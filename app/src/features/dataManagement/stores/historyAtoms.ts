/**
 * KG-Oversight - History Atoms
 * Gestion de l'historique Undo/Redo pour les opérations CRUD
 *
 * Approche : Snapshot-based history
 * - Stocke les états précédents des nodes et edges
 * - Limite à 50 entrées d'historique
 * - Synchronisé avec IndexedDB via persistence
 */

import { atom } from 'jotai';
import type { GraphNode, GraphEdge } from '@data/types';

// =============================================================================
// Types
// =============================================================================

interface HistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  maxEntries: number;
}

// =============================================================================
// Atoms
// =============================================================================

/** État de l'historique */
export const historyStateAtom = atom<HistoryState>({
  entries: [],
  currentIndex: -1,
  maxEntries: 50,
});

/** Peut-on annuler ? */
export const canUndoAtom = atom((get) => {
  const state = get(historyStateAtom);
  return state.currentIndex > 0;
});

/** Peut-on rétablir ? */
export const canRedoAtom = atom((get) => {
  const state = get(historyStateAtom);
  return state.currentIndex < state.entries.length - 1;
});

/** Nombre d'opérations dans l'historique */
export const historyCountAtom = atom((get) => {
  const state = get(historyStateAtom);
  return state.entries.length;
});

/** Description de la dernière opération annulable */
export const lastUndoDescriptionAtom = atom((get) => {
  const state = get(historyStateAtom);
  if (state.currentIndex <= 0) return null;
  return state.entries[state.currentIndex]?.description ?? null;
});

/** Description de la prochaine opération rétablissable */
export const nextRedoDescriptionAtom = atom((get) => {
  const state = get(historyStateAtom);
  if (state.currentIndex >= state.entries.length - 1) return null;
  return state.entries[state.currentIndex + 1]?.description ?? null;
});

// =============================================================================
// Actions
// =============================================================================

/**
 * Ajouter une entrée à l'historique
 */
export const pushHistoryAtom = atom(
  null,
  (get, set, payload: { description: string; nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> }) => {
    const state = get(historyStateAtom);

    // Créer une copie des Maps pour le snapshot
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: payload.description,
      nodes: new Map(payload.nodes),
      edges: new Map(payload.edges),
    };

    // Supprimer les entrées après l'index courant (on écrase l'historique "futur")
    const newEntries = state.entries.slice(0, state.currentIndex + 1);
    newEntries.push(entry);

    // Limiter le nombre d'entrées
    if (newEntries.length > state.maxEntries) {
      newEntries.shift();
    }

    set(historyStateAtom, {
      ...state,
      entries: newEntries,
      currentIndex: newEntries.length - 1,
    });
  }
);

/**
 * Undo - Retourne l'état précédent
 */
export const undoAtom = atom(
  null,
  (get, set): { nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> } | null => {
    const state = get(historyStateAtom);

    if (state.currentIndex <= 0) {
      return null;
    }

    const newIndex = state.currentIndex - 1;
    const entry = state.entries[newIndex];

    set(historyStateAtom, {
      ...state,
      currentIndex: newIndex,
    });

    return {
      nodes: new Map(entry.nodes),
      edges: new Map(entry.edges),
    };
  }
);

/**
 * Redo - Retourne l'état suivant
 */
export const redoAtom = atom(
  null,
  (get, set): { nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> } | null => {
    const state = get(historyStateAtom);

    if (state.currentIndex >= state.entries.length - 1) {
      return null;
    }

    const newIndex = state.currentIndex + 1;
    const entry = state.entries[newIndex];

    set(historyStateAtom, {
      ...state,
      currentIndex: newIndex,
    });

    return {
      nodes: new Map(entry.nodes),
      edges: new Map(entry.edges),
    };
  }
);

/**
 * Réinitialiser l'historique
 */
export const clearHistoryAtom = atom(null, (get, set) => {
  set(historyStateAtom, {
    entries: [],
    currentIndex: -1,
    maxEntries: 50,
  });
});

/**
 * Initialiser l'historique avec l'état actuel
 */
export const initHistoryAtom = atom(
  null,
  (get, set, payload: { nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> }) => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: 'État initial',
      nodes: new Map(payload.nodes),
      edges: new Map(payload.edges),
    };

    set(historyStateAtom, {
      entries: [entry],
      currentIndex: 0,
      maxEntries: 50,
    });
  }
);
