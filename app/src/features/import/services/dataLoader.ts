/**
 * KG-Oversight - Service de chargement des données CSV
 * Charge les nœuds et relations depuis les fichiers CSV du repo
 * Utilise la persistance IndexedDB pour les sessions suivantes
 */

import Papa from 'papaparse';
import type { GraphNode, GraphEdge, NodeType } from '@data/types';
import { loadAll, saveAll, hasPersistedData } from '@data/database/persistence';
import { normalizeKQIStatut, normalizeKQITendance } from '@features/kqi/utils/kqiNormalization';

// Liste des types de nœuds à charger
const NODE_TYPES: NodeType[] = [
  'SousTraitant',
  'Contrat',
  'AccordQualite',
  'Audit',
  'Inspection',
  'Finding',
  'EvenementQualite',
  'Decision',
  'EvaluationRisque',
  'ReunionQualite',
  'EtudeClinique',
  'DomaineService',
  'ContexteReglementaire',
  'Alerte',
  'Evenement',
  'KQI',
];

// Liste des types de relations à charger
const RELATION_FILES = [
  'A_ETE_AUDITE_PAR',
  'A_ETE_INSPECTE_PAR',
  'A_ETE_SUIVI_PAR',
  'A_FAIT_OBJET_EVALUATION',
  'A_POUR_CONTEXTE',
  'A_VERSION_SUIVANTE',
  'AUDIT_DECLENCHE_ALERTE',
  'CAUSE_EVENEMENT',
  'DECISION_JUSTIFIEE_PAR_AUDIT',
  'DECISION_JUSTIFIEE_PAR_FINDING',
  'DECISION_JUSTIFIEE_PAR_INSPECTION',
  'DECISION_JUSTIFIEE_PAR_QE',
  'EST_COUVERT_PAR_QA',
  'EST_LIE_AU_CONTRAT',
  'EST_SOUS_TRAITANT_DE',
  'EVT_CONCERNE_ST',
  'GENERE_FINDING',
  'IMPLIQUE_ST',
  'INSPECTION_GENERE_FINDING',
  'KQI_MESURE_ST',
  'POSSEDE_SERVICE',
  'QA_A_VERSION_SUIVANTE',
  'QE_CONCERNE_ST',
  'QE_DECLENCHE_ALERTE',
  'RESULTE_DE_EVALUATION',
  'SURVENU_DANS_ETUDE',
];

interface ParsedRow {
  [key: string]: string;
}

async function fetchAndParseCsv(url: string): Promise<ParsedRow[]> {
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Failed to fetch ${url}: ${response.status}`);
    return [];
  }

  const text = await response.text();

  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as ParsedRow[]);
      },
      error: () => {
        resolve([]);
      },
    });
  });
}

function parseNodeRow(row: ParsedRow, nodeType: NodeType): GraphNode {
  // Ajouter les propriétés spécifiques selon le type
  const props: Record<string, unknown> = {
    _type: nodeType,
    id: row.id,
  };

  // Parser toutes les propriétés du CSV
  for (const [key, value] of Object.entries(row)) {
    if (!value || key === 'id') continue;

    // Convertir les types selon le format de la valeur
    if (/^-?\d+$/.test(value)) {
      props[key] = parseInt(value, 10);
    } else if (/^-?\d+\.\d+$/.test(value)) {
      props[key] = parseFloat(value);
    } else if (value === 'true' || value === 'false') {
      props[key] = value === 'true';
    } else {
      props[key] = value;
    }
  }

  // Normalisation spécifique pour les KQI
  // IMPORTANT: Cette normalisation doit être appliquée APRÈS le parsing
  // pour garantir la cohérence avec les types TypeScript
  if (nodeType === 'KQI') {
    props.statut = normalizeKQIStatut(row.statut ?? '');
    props.tendance = normalizeKQITendance(row.tendance ?? '');
  }

  return props as GraphNode;
}

function parseEdgeRow(row: ParsedRow, relationType: string, index: number): GraphEdge {
  return {
    id: `${relationType}-${index}`,
    source: row.from,
    target: row.to,
    _type: relationType,
    // Propriétés additionnelles des relations
    ...(row.date_lien && { date_lien: row.date_lien }),
    ...(row.validite && { validite: row.validite }),
    ...(row.niveau && { niveau: parseInt(row.niveau, 10) }),
    ...(row.role && { role: row.role }),
    ...(row.via && { via: row.via }),
  } as GraphEdge;
}

/**
 * Charge les données depuis les fichiers CSV
 */
async function loadFromCSV(): Promise<{
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}> {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  // Charger les nœuds
  const nodePromises = NODE_TYPES.map(async (nodeType) => {
    const url = `/data/nodes/${nodeType}.csv`;
    const rows = await fetchAndParseCsv(url);

    for (const row of rows) {
      if (row.id) {
        const node = parseNodeRow(row, nodeType);
        nodes.set(node.id, node);
      }
    }
  });

  // Charger les relations
  const edgePromises = RELATION_FILES.map(async (relationType) => {
    const url = `/data/relations/${relationType}.csv`;
    const rows = await fetchAndParseCsv(url);

    rows.forEach((row, index) => {
      if (row.from && row.to) {
        const edge = parseEdgeRow(row, relationType, index);
        edges.set(edge.id, edge);
      }
    });
  });

  // Attendre le chargement de tout
  await Promise.all([...nodePromises, ...edgePromises]);

  return { nodes, edges };
}

/**
 * Charge toutes les données avec stratégie de persistance
 * 1. Tente de charger depuis IndexedDB (rapide)
 * 2. Si pas de données, charge depuis CSV et persiste
 */
export async function loadAllData(forceReload = false): Promise<{
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  source: 'cache' | 'csv';
}> {
  // Vérifier si on a des données en cache et qu'on ne force pas le rechargement
  if (!forceReload) {
    try {
      const hasCached = await hasPersistedData();
      if (hasCached) {
        console.log('[DataLoader] Loading from IndexedDB cache...');
        const cached = await loadAll();
        if (cached && cached.nodes.size > 0) {
          console.log(`[DataLoader] Loaded ${cached.nodes.size} nodes and ${cached.edges.size} edges from cache`);
          // Normaliser les KQI depuis le cache (données potentiellement anciennes)
          for (const [id, node] of cached.nodes) {
            if (node._type === 'KQI') {
              const kqi = node as any;
              kqi.statut = normalizeKQIStatut(kqi.statut);
              kqi.tendance = normalizeKQITendance(kqi.tendance);
            }
          }
          return { ...cached, source: 'cache' };
        }
      }
    } catch (error) {
      console.warn('[DataLoader] Failed to load from cache, falling back to CSV:', error);
    }
  }

  // Charger depuis les fichiers CSV
  console.log('[DataLoader] Loading from CSV files...');
  const { nodes, edges } = await loadFromCSV();
  console.log(`[DataLoader] Loaded ${nodes.size} nodes and ${edges.size} edges from CSV`);

  // Persister en arrière-plan (ne pas bloquer le retour)
  saveAll(nodes, edges).then(() => {
    console.log('[DataLoader] Data persisted to IndexedDB');
  }).catch((error) => {
    console.warn('[DataLoader] Failed to persist data:', error);
  });

  return { nodes, edges, source: 'csv' };
}

/**
 * Force le rechargement depuis les fichiers CSV et met à jour le cache
 */
export async function reloadFromCSV(): Promise<{
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}> {
  const result = await loadAllData(true);
  return { nodes: result.nodes, edges: result.edges };
}

export default loadAllData;
