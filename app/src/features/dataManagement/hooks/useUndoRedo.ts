/**
 * KG-Oversight - Hook useUndoRedo
 * Expose les fonctions Undo/Redo avec synchronisation des données
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { allNodesAtom, allEdgesAtom } from '@shared/stores/selectionAtoms';
import {
  canUndoAtom,
  canRedoAtom,
  pushHistoryAtom,
  undoAtom,
  redoAtom,
  initHistoryAtom,
  clearHistoryAtom,
  lastUndoDescriptionAtom,
  nextRedoDescriptionAtom,
} from '../stores/historyAtoms';
import { updateNodesCache, updateEdgesCache } from '../services/dataService';
import { saveAll } from '@data/database/persistence';

// =============================================================================
// Types
// =============================================================================

interface UndoRedoHook {
  canUndo: boolean;
  canRedo: boolean;
  lastUndoDescription: string | null;
  nextRedoDescription: string | null;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  saveSnapshot: (description: string) => void;
  clearHistory: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useUndoRedo(): UndoRedoHook {
  const [nodes, setNodes] = useAtom(allNodesAtom);
  const [edges, setEdges] = useAtom(allEdgesAtom);

  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const lastUndoDescription = useAtomValue(lastUndoDescriptionAtom);
  const nextRedoDescription = useAtomValue(nextRedoDescriptionAtom);

  const pushHistory = useSetAtom(pushHistoryAtom);
  const doUndo = useSetAtom(undoAtom);
  const doRedo = useSetAtom(redoAtom);
  const initHistory = useSetAtom(initHistoryAtom);
  const doClearHistory = useSetAtom(clearHistoryAtom);

  // Flag pour éviter de sauvegarder pendant undo/redo
  const isUndoRedoInProgress = useRef(false);

  // Initialiser l'historique au premier rendu
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current && nodes.size > 0) {
      initHistory({ nodes, edges });
      isInitialized.current = true;
    }
  }, [nodes, edges, initHistory]);

  /**
   * Sauvegarder un snapshot de l'état actuel
   */
  const saveSnapshot = useCallback(
    (description: string) => {
      if (isUndoRedoInProgress.current) return;
      pushHistory({ description, nodes, edges });
    },
    [nodes, edges, pushHistory]
  );

  /**
   * Annuler la dernière opération
   */
  const undo = useCallback(async () => {
    if (!canUndo) return;

    isUndoRedoInProgress.current = true;

    try {
      const previousState = doUndo();
      if (!previousState) return;

      // Mettre à jour les atoms
      setNodes(previousState.nodes);
      setEdges(previousState.edges);

      // Synchroniser le cache du dataService
      updateNodesCache(previousState.nodes);
      updateEdgesCache(previousState.edges);

      // Persister dans IndexedDB
      await saveAll(previousState.nodes, previousState.edges);

      console.log('[UndoRedo] Undo effectué');
    } catch (error) {
      console.error('[UndoRedo] Erreur lors du undo:', error);
    } finally {
      isUndoRedoInProgress.current = false;
    }
  }, [canUndo, doUndo, setNodes, setEdges]);

  /**
   * Rétablir l'opération annulée
   */
  const redo = useCallback(async () => {
    if (!canRedo) return;

    isUndoRedoInProgress.current = true;

    try {
      const nextState = doRedo();
      if (!nextState) return;

      // Mettre à jour les atoms
      setNodes(nextState.nodes);
      setEdges(nextState.edges);

      // Synchroniser le cache du dataService
      updateNodesCache(nextState.nodes);
      updateEdgesCache(nextState.edges);

      // Persister dans IndexedDB
      await saveAll(nextState.nodes, nextState.edges);

      console.log('[UndoRedo] Redo effectué');
    } catch (error) {
      console.error('[UndoRedo] Erreur lors du redo:', error);
    } finally {
      isUndoRedoInProgress.current = false;
    }
  }, [canRedo, doRedo, setNodes, setEdges]);

  /**
   * Effacer l'historique
   */
  const clearHistory = useCallback(() => {
    doClearHistory();
    // Réinitialiser avec l'état actuel
    initHistory({ nodes, edges });
  }, [doClearHistory, initHistory, nodes, edges]);

  return {
    canUndo,
    canRedo,
    lastUndoDescription,
    nextRedoDescription,
    undo,
    redo,
    saveSnapshot,
    clearHistory,
  };
}

export default useUndoRedo;
