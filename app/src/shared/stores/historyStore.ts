/**
 * KG-Oversight - Store d'historique pour Undo/Redo
 * Utilise jotai-history pour gérer l'historique des actions
 */

import { atom } from 'jotai';
import { withHistory, type HistoryAtom } from 'jotai-history';

// =============================================================================
// Types
// =============================================================================

export interface GraphState {
  selectedNodeIds: Set<string>;
  highlightedNodeIds: Set<string>;
  expandedNodeIds: Set<string>;
  focusedNodeId: string | null;
}

export interface HistoryEntry {
  timestamp: number;
  action: string;
  state: GraphState;
}

// =============================================================================
// État de base avec historique
// =============================================================================

// État de sélection (avec historique)
const baseSelectedNodeIdsAtom = atom<Set<string>>(new Set());
export const selectedNodeIdsHistoryAtom = withHistory(baseSelectedNodeIdsAtom, 50);

// État de highlight (avec historique)
const baseHighlightedNodeIdsAtom = atom<Set<string>>(new Set());
export const highlightedNodeIdsHistoryAtom = withHistory(baseHighlightedNodeIdsAtom, 50);

// État des nœuds développés (avec historique)
const baseFocusedNodeIdAtom = atom<string | null>(null);
export const focusedNodeIdHistoryAtom = withHistory(baseFocusedNodeIdAtom, 50);

// =============================================================================
// Atoms pour accéder aux valeurs courantes
// =============================================================================

export const selectedNodeIdsValueAtom = atom(
  (get) => get(selectedNodeIdsHistoryAtom).value,
  (get, set, newValue: Set<string>) => {
    set(selectedNodeIdsHistoryAtom, { value: newValue });
  }
);

export const highlightedNodeIdsValueAtom = atom(
  (get) => get(highlightedNodeIdsHistoryAtom).value,
  (get, set, newValue: Set<string>) => {
    set(highlightedNodeIdsHistoryAtom, { value: newValue });
  }
);

export const focusedNodeIdValueAtom = atom(
  (get) => get(focusedNodeIdHistoryAtom).value,
  (get, set, newValue: string | null) => {
    set(focusedNodeIdHistoryAtom, { value: newValue });
  }
);

// =============================================================================
// Atoms d'état Undo/Redo
// =============================================================================

export const canUndoAtom = atom((get) => {
  const history = get(selectedNodeIdsHistoryAtom);
  return history.index > 0;
});

export const canRedoAtom = atom((get) => {
  const history = get(selectedNodeIdsHistoryAtom);
  return history.index < history.history.length - 1;
});

// =============================================================================
// Actions Undo/Redo
// =============================================================================

export const undoAtom = atom(null, (get, set) => {
  const selectionHistory = get(selectedNodeIdsHistoryAtom);
  const highlightHistory = get(highlightedNodeIdsHistoryAtom);
  const focusHistory = get(focusedNodeIdHistoryAtom);

  if (selectionHistory.index > 0) {
    set(selectedNodeIdsHistoryAtom, { index: selectionHistory.index - 1 });
  }
  if (highlightHistory.index > 0) {
    set(highlightedNodeIdsHistoryAtom, { index: highlightHistory.index - 1 });
  }
  if (focusHistory.index > 0) {
    set(focusedNodeIdHistoryAtom, { index: focusHistory.index - 1 });
  }
});

export const redoAtom = atom(null, (get, set) => {
  const selectionHistory = get(selectedNodeIdsHistoryAtom);
  const highlightHistory = get(highlightedNodeIdsHistoryAtom);
  const focusHistory = get(focusedNodeIdHistoryAtom);

  if (selectionHistory.index < selectionHistory.history.length - 1) {
    set(selectedNodeIdsHistoryAtom, { index: selectionHistory.index + 1 });
  }
  if (highlightHistory.index < highlightHistory.history.length - 1) {
    set(highlightedNodeIdsHistoryAtom, { index: highlightHistory.index + 1 });
  }
  if (focusHistory.index < focusHistory.history.length - 1) {
    set(focusedNodeIdHistoryAtom, { index: focusHistory.index + 1 });
  }
});

// =============================================================================
// Historique des actions (pour affichage)
// =============================================================================

export interface ActionLogEntry {
  id: string;
  timestamp: Date;
  type: 'select' | 'highlight' | 'focus' | 'filter' | 'layout' | 'import' | 'scenario';
  description: string;
  nodeCount?: number;
}

const actionLogAtom = atom<ActionLogEntry[]>([]);

export const actionLogReadAtom = atom((get) => get(actionLogAtom));

export const logActionAtom = atom(
  null,
  (get, set, entry: Omit<ActionLogEntry, 'id' | 'timestamp'>) => {
    const currentLog = get(actionLogAtom);
    const newEntry: ActionLogEntry = {
      ...entry,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    // Garder les 100 dernières actions
    set(actionLogAtom, [newEntry, ...currentLog].slice(0, 100));
  }
);

// =============================================================================
// Compteur d'historique
// =============================================================================

export const historyStatsAtom = atom((get) => {
  const selectionHistory = get(selectedNodeIdsHistoryAtom);
  return {
    currentIndex: selectionHistory.index,
    totalSteps: selectionHistory.history.length,
    canUndo: selectionHistory.index > 0,
    canRedo: selectionHistory.index < selectionHistory.history.length - 1,
  };
});
