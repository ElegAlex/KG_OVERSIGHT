/**
 * KG-Oversight - Clipboard Atom
 * Store Jotai pour la gestion du presse-papiers d'entités
 *
 * Permet de copier/coller des nœuds et relations entre différentes
 * parties de l'application.
 */

import { atom } from 'jotai';
import type { GraphNode, GraphEdge } from '@data/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Type de contenu dans le presse-papiers
 */
export type ClipboardContentType = 'node' | 'nodes' | 'edge' | 'edges' | 'mixed';

/**
 * Contenu du presse-papiers
 */
export interface ClipboardContent {
  /** Type de contenu */
  type: ClipboardContentType;
  /** Nœuds copiés */
  nodes: GraphNode[];
  /** Relations copiées */
  edges: GraphEdge[];
  /** Timestamp de la copie */
  timestamp: number;
  /** ID du nœud source (pour duplication) */
  sourceNodeId?: string;
  /** Inclure les relations lors du collage */
  includeRelations: boolean;
}

/**
 * État complet du presse-papiers
 */
export interface ClipboardState {
  /** Contenu actuel */
  content: ClipboardContent | null;
  /** Historique des copies (pour multi-collage) */
  history: ClipboardContent[];
  /** Nombre maximum d'entrées dans l'historique */
  maxHistory: number;
}

// =============================================================================
// Valeurs par défaut
// =============================================================================

const DEFAULT_CLIPBOARD_STATE: ClipboardState = {
  content: null,
  history: [],
  maxHistory: 10,
};

// =============================================================================
// Atoms
// =============================================================================

/**
 * Atom principal du presse-papiers
 */
export const clipboardStateAtom = atom<ClipboardState>(DEFAULT_CLIPBOARD_STATE);

/**
 * Atom dérivé pour le contenu actuel (lecture seule)
 */
export const clipboardContentAtom = atom((get) => get(clipboardStateAtom).content);

/**
 * Atom dérivé pour savoir si le presse-papiers contient quelque chose
 */
export const hasClipboardContentAtom = atom((get) => get(clipboardStateAtom).content !== null);

/**
 * Atom dérivé pour le nombre d'éléments copiés
 */
export const clipboardCountAtom = atom((get) => {
  const content = get(clipboardStateAtom).content;
  if (!content) return { nodes: 0, edges: 0, total: 0 };
  return {
    nodes: content.nodes.length,
    edges: content.edges.length,
    total: content.nodes.length + content.edges.length,
  };
});

/**
 * Atom dérivé pour l'historique
 */
export const clipboardHistoryAtom = atom((get) => get(clipboardStateAtom).history);

// =============================================================================
// Actions
// =============================================================================

/**
 * Action pour copier des nœuds
 */
export const copyNodesAtom = atom(
  null,
  (get, set, nodes: GraphNode[], options?: { includeRelations?: boolean; edges?: GraphEdge[] }) => {
    const state = get(clipboardStateAtom);
    const edges = options?.edges || [];

    const content: ClipboardContent = {
      type: nodes.length === 1 ? 'node' : 'nodes',
      nodes: [...nodes],
      edges: [...edges],
      timestamp: Date.now(),
      sourceNodeId: nodes.length === 1 ? nodes[0].id : undefined,
      includeRelations: options?.includeRelations ?? false,
    };

    // Ajouter à l'historique
    const newHistory = [content, ...state.history].slice(0, state.maxHistory);

    set(clipboardStateAtom, {
      ...state,
      content,
      history: newHistory,
    });

    console.log(`[Clipboard] Copied ${nodes.length} node(s), ${edges.length} edge(s)`);
  }
);

/**
 * Action pour copier des relations
 */
export const copyEdgesAtom = atom(null, (get, set, edges: GraphEdge[]) => {
  const state = get(clipboardStateAtom);

  const content: ClipboardContent = {
    type: edges.length === 1 ? 'edge' : 'edges',
    nodes: [],
    edges: [...edges],
    timestamp: Date.now(),
    includeRelations: false,
  };

  const newHistory = [content, ...state.history].slice(0, state.maxHistory);

  set(clipboardStateAtom, {
    ...state,
    content,
    history: newHistory,
  });

  console.log(`[Clipboard] Copied ${edges.length} edge(s)`);
});

/**
 * Action pour vider le presse-papiers
 */
export const clearClipboardAtom = atom(null, (get, set) => {
  const state = get(clipboardStateAtom);
  set(clipboardStateAtom, {
    ...state,
    content: null,
  });
  console.log('[Clipboard] Cleared');
});

/**
 * Action pour vider l'historique
 */
export const clearClipboardHistoryAtom = atom(null, (get, set) => {
  const state = get(clipboardStateAtom);
  set(clipboardStateAtom, {
    ...state,
    content: null,
    history: [],
  });
  console.log('[Clipboard] History cleared');
});

/**
 * Action pour restaurer depuis l'historique
 */
export const restoreFromHistoryAtom = atom(null, (get, set, index: number) => {
  const state = get(clipboardStateAtom);
  const historyItem = state.history[index];

  if (historyItem) {
    set(clipboardStateAtom, {
      ...state,
      content: historyItem,
    });
    console.log(`[Clipboard] Restored from history index ${index}`);
  }
});

// =============================================================================
// Export
// =============================================================================

export default clipboardStateAtom;
