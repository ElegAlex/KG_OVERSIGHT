/**
 * KG-Oversight - Service de chargement des données CSV
 * Charge les nœuds et relations depuis les fichiers CSV du repo
 */

import Papa from 'papaparse';
import type { GraphNode, GraphEdge, NodeType } from '@data/types';

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
  // Conversion des types selon le type de nœud
  const baseNode = {
    _type: nodeType,
    id: row.id,
    nom: row.nom,
    description: row.description,
    statut: row.statut,
    criticite: row.criticite as GraphNode['criticite'],
    source_donnees: row.source_donnees,
  };

  // Ajouter les propriétés spécifiques selon le type
  const additionalProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value && !['id', 'nom', 'description', 'statut', 'criticite', 'source_donnees'].includes(key)) {
      // Convertir les nombres
      if (/^\d+$/.test(value)) {
        additionalProps[key] = parseInt(value, 10);
      } else if (/^\d+\.\d+$/.test(value)) {
        additionalProps[key] = parseFloat(value);
      } else if (value === 'true' || value === 'false') {
        additionalProps[key] = value === 'true';
      } else {
        additionalProps[key] = value;
      }
    }
  }

  return { ...baseNode, ...additionalProps } as GraphNode;
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

export async function loadAllData(): Promise<{
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

  console.log(`Loaded ${nodes.size} nodes and ${edges.size} edges`);

  return { nodes, edges };
}

export default loadAllData;
