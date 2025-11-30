/**
 * KG-Oversight - Store d'historique pour Undo/Redo
 * Implémentation simple sans dépendance externe
 */

import { atom } from 'jotai';

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
// Historique interne
// =============================================================================

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

function createHistoryAtom<T>(initialValue: T, maxHistory = 50) {
  const historyAtom = atom<HistoryState<T>>({
    past: [],
    present: initialValue,
    future: [],
  });

  const valueAtom = atom(
    (get) => get(historyAtom).present,
    (get, set, newValue: T) => {
      const state = get(historyAtom);
      set(historyAtom, {
        past: [...state.past, state.present].slice(-maxHistory),
        present: newValue,
        future: [],
      });
    }
  );

  const undoAtom = atom(null, (get, set) => {
    const state = get(historyAtom);
    if (state.past.length === 0) return;

    const previous = state.past[state.past.length - 1];
    set(historyAtom, {
      past: state.past.slice(0, -1),
      present: previous as T,
      future: [state.present, ...state.future],
    });
  });

  const redoAtom = atom(null, (get, set) => {
    const state = get(historyAtom);
    if (state.future.length === 0) return;

    const next = state.future[0];
    set(historyAtom, {
      past: [...state.past, state.present],
      present: next as T,
      future: state.future.slice(1),
    });
  });

  const canUndoAtom = atom((get) => get(historyAtom).past.length > 0);
  const canRedoAtom = atom((get) => get(historyAtom).future.length > 0);

  return { valueAtom, undoAtom, redoAtom, canUndoAtom, canRedoAtom };
}

// =============================================================================
// Historiques de sélection
// =============================================================================

const selectionHistory = createHistoryAtom<Set<string>>(new Set());
const highlightHistory = createHistoryAtom<Set<string>>(new Set());
const focusHistory = createHistoryAtom<string | null>(null);

// Exports pour compatibilité
export const selectedNodeIdsValueAtom = selectionHistory.valueAtom;
export const highlightedNodeIdsValueAtom = highlightHistory.valueAtom;
export const focusedNodeIdValueAtom = focusHistory.valueAtom;

// =============================================================================
// Atoms d'état Undo/Redo
// =============================================================================

export const canUndoAtom = selectionHistory.canUndoAtom;
export const canRedoAtom = selectionHistory.canRedoAtom;

// =============================================================================
// Actions Undo/Redo globales
// =============================================================================

export const undoAtom = atom(null, (_get, set) => {
  set(selectionHistory.undoAtom);
  set(highlightHistory.undoAtom);
  set(focusHistory.undoAtom);
});

export const redoAtom = atom(null, (_get, set) => {
  set(selectionHistory.redoAtom);
  set(highlightHistory.redoAtom);
  set(focusHistory.redoAtom);
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
  const canUndo = get(canUndoAtom);
  const canRedo = get(canRedoAtom);
  return {
    canUndo,
    canRedo,
  };
});
