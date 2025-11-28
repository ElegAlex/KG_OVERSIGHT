/**
 * KG-Oversight - Atomes Jotai pour la sélection et le filtrage
 * Partagés entre le graphe, la timeline et le dashboard
 */

import { atom } from 'jotai';
import type { NodeType, Criticite, GraphNode, GraphEdge } from '@data/types';

// =============================================================================
// Sélection de nœuds
// =============================================================================

/** IDs des nœuds sélectionnés */
export const selectedNodeIdsAtom = atom<Set<string>>(new Set<string>());

/** Nœud actuellement survolé */
export const hoveredNodeIdAtom = atom<string | null>(null);

/** Nœuds mis en évidence (highlight) par un scénario ou une alerte */
export const highlightedNodeIdsAtom = atom<Set<string>>(new Set<string>());

/** Nœud central pour le mode focus (drill-down) */
export const focusedNodeIdAtom = atom<string | null>(null);

/** Mode d'affichage du graphe */
export const graphViewModeAtom = atom<'all' | 'focus'>('all');

/**
 * Étude sélectionnée pour le contexte N1/N2
 * Quand une étude est sélectionnée, les sous-traitants sont colorés
 * selon leur niveau (N1/N2) dans CETTE étude spécifiquement
 */
export const selectedStudyIdAtom = atom<string | null>(null);

// =============================================================================
// Filtres
// =============================================================================

/** Types de nœuds à afficher (multi-sélection) */
export const visibleNodeTypesAtom = atom<Set<NodeType>>(
  new Set<NodeType>([
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
  ])
);

/** Criticités à afficher */
export const visibleCriticitesAtom = atom<Set<Criticite | ''>>(
  new Set<Criticite | ''>(['Critique', 'Majeur', 'Standard', 'Mineur', ''])
);

/** Plage de dates pour le filtrage */
export const dateRangeAtom = atom<[Date | null, Date | null]>([null, null]);

/** Texte de recherche */
export const searchQueryAtom = atom<string>('');

// =============================================================================
// Données du graphe
// =============================================================================

/** Tous les nœuds chargés */
export const allNodesAtom = atom<Map<string, GraphNode>>(new Map());

/** Toutes les arêtes chargées */
export const allEdgesAtom = atom<Map<string, GraphEdge>>(new Map());

// =============================================================================
// Atomes dérivés (lecture seule)
// =============================================================================

/** Nœuds filtrés selon les critères actifs (EXCLUT les KQI du graphe) */
export const filteredNodesAtom = atom((get) => {
  const nodes = get(allNodesAtom);
  const visibleTypes = get(visibleNodeTypesAtom);
  const visibleCriticites = get(visibleCriticitesAtom);
  const [startDate, endDate] = get(dateRangeAtom);
  const searchQuery = get(searchQueryAtom).toLowerCase();

  const filtered = new Map<string, GraphNode>();

  for (const [id, node] of nodes) {
    // EXCLURE les KQI du graphe - ils sont affichés dans un panneau dédié
    if (node._type === 'KQI') continue;

    // Filtre par type
    if (!visibleTypes.has(node._type)) continue;

    // Filtre par criticité
    const nodeCriticite = node.criticite ?? '';
    if (!visibleCriticites.has(nodeCriticite)) continue;

    // Filtre par recherche textuelle
    if (searchQuery) {
      const searchableText = [
        node.id,
        node.nom ?? '',
        node.description ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!searchableText.includes(searchQuery)) continue;
    }

    // Filtre par date (si le nœud a une date)
    if (startDate || endDate) {
      const nodeDate = getNodeDate(node);
      if (nodeDate) {
        if (startDate && nodeDate < startDate) continue;
        if (endDate && nodeDate > endDate) continue;
      }
    }

    filtered.set(id, node);
  }

  return filtered;
});

/** Données KQI séparées pour le panneau dédié */
export const kqiDataAtom = atom((get) => {
  const nodes = get(allNodesAtom);
  const kqiNodes: GraphNode[] = [];

  for (const [, node] of nodes) {
    if (node._type === 'KQI') {
      kqiNodes.push(node);
    }
  }

  return kqiNodes;
});

/** Arêtes filtrées (connectant des nœuds visibles, EXCLUT KQI_MESURE_ST) */
export const filteredEdgesAtom = atom((get) => {
  const edges = get(allEdgesAtom);
  const filteredNodes = get(filteredNodesAtom);

  const filtered = new Map<string, GraphEdge>();

  for (const [id, edge] of edges) {
    // Exclure les relations KQI
    if (edge._type === 'KQI_MESURE_ST') continue;

    if (filteredNodes.has(edge.source) && filteredNodes.has(edge.target)) {
      filtered.set(id, edge);
    }
  }

  return filtered;
});

/** Nœud sélectionné (premier de la sélection) */
export const selectedNodeAtom = atom((get) => {
  const selectedIds = get(selectedNodeIdsAtom);
  const nodes = get(allNodesAtom);

  if (selectedIds.size === 0) return null;

  const firstId = selectedIds.values().next().value;
  return firstId ? nodes.get(firstId) ?? null : null;
});

// =============================================================================
// Utilitaires
// =============================================================================

function getNodeDate(node: GraphNode): Date | null {
  // Récupérer la date principale selon le type de nœud
  let dateStr: string | undefined;

  switch (node._type) {
    case 'SousTraitant':
      dateStr = node.date_creation;
      break;
    case 'Audit':
    case 'Inspection':
      dateStr = node.date_debut;
      break;
    case 'Finding':
      dateStr = node.date_detection;
      break;
    case 'EvenementQualite':
    case 'Alerte':
    case 'Evenement':
      dateStr = node.date_creation;
      break;
    case 'Decision':
      dateStr = node.date_decision;
      break;
    case 'EvaluationRisque':
      dateStr = node.date_evaluation;
      break;
    case 'ReunionQualite':
      dateStr = node.date_reunion;
      break;
    case 'EtudeClinique':
      dateStr = node.date_debut;
      break;
    default:
      dateStr = undefined;
  }

  return dateStr ? new Date(dateStr) : null;
}
