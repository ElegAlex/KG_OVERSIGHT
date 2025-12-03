/**
 * KG-Oversight - Hook useDataMutations
 * Fournit les opérations CRUD avec intégration React/Jotai
 *
 * Ce hook :
 * - Expose les mutations CRUD pour les composants React
 * - Gère les états de chargement et d'erreur
 * - Synchronise les atoms Jotai après chaque mutation
 * - Intègre l'historique pour undo/redo (snapshots avant chaque mutation)
 */

import { useCallback, useState, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { allNodesAtom, allEdgesAtom } from '@shared/stores/selectionAtoms';
import { pushHistoryAtom, initHistoryAtom } from '../stores/historyAtoms';
import type { NodeType, EdgeType, GraphNode, GraphEdge } from '@data/types';
import type {
  DataServiceResult,
  DeleteResult,
  ValidationResult,
  CreateNodeOptions,
  UpdateNodeOptions,
  DeleteNodeOptions,
} from '../types';
import * as dataService from '../services/dataService';
import { validateEntity, validateSingleField } from '../services/validationService';
import { getEntitySchema } from '../constants/entitySchemas';

// =============================================================================
// Types
// =============================================================================

interface MutationState {
  isLoading: boolean;
  error: string | null;
  lastOperation: string | null;
}

interface NodeMutations {
  // CRUD
  createNode: (
    type: NodeType,
    data: Record<string, unknown>,
    options?: CreateNodeOptions
  ) => Promise<DataServiceResult<GraphNode>>;
  updateNode: (
    nodeId: string,
    updates: Partial<Record<string, unknown>>,
    options?: UpdateNodeOptions
  ) => Promise<DataServiceResult<GraphNode>>;
  deleteNode: (
    nodeId: string,
    options?: DeleteNodeOptions
  ) => Promise<DataServiceResult<DeleteResult>>;
  deleteNodes: (
    nodeIds: string[],
    options?: DeleteNodeOptions
  ) => Promise<DataServiceResult<DeleteResult>>;
  duplicateNode: (
    nodeId: string,
    options?: { newData?: Partial<Record<string, unknown>>; includeRelations?: boolean }
  ) => Promise<DataServiceResult<{ node: GraphNode; edges: GraphEdge[] }>>;
}

interface EdgeMutations {
  createEdge: (
    source: string,
    target: string,
    type: EdgeType,
    properties?: Record<string, unknown>
  ) => Promise<DataServiceResult<GraphEdge>>;
  updateEdge: (
    edgeId: string,
    changes: Partial<Omit<GraphEdge, 'id' | '_type' | 'source' | 'target'>>
  ) => Promise<DataServiceResult<GraphEdge>>;
  deleteEdge: (edgeId: string) => Promise<DataServiceResult<boolean>>;
}

interface ValidationFunctions {
  validateNode: (
    type: NodeType,
    data: Record<string, unknown>,
    options?: { isUpdate?: boolean; originalId?: string }
  ) => ValidationResult;
  validateField: (
    type: NodeType,
    fieldName: string,
    value: unknown,
    fullData?: Record<string, unknown>
  ) => { isValid: boolean; error?: string };
}

interface DataMutationsHook extends NodeMutations, EdgeMutations, ValidationFunctions {
  state: MutationState;
  refreshFromPersistence: () => Promise<void>;
  clearError: () => void;
}

// =============================================================================
// Hook principal
// =============================================================================

export function useDataMutations(): DataMutationsHook {
  // State local pour le chargement et les erreurs
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
    lastOperation: null,
  });

  // Atoms Jotai
  const [nodes, setNodes] = useAtom(allNodesAtom);
  const [edges, setEdges] = useAtom(allEdgesAtom);

  // History atoms
  const pushHistory = useSetAtom(pushHistoryAtom);
  const initHistory = useSetAtom(initHistoryAtom);

  // Track if history is initialized
  const historyInitialized = useRef(false);

  // ==========================================================================
  // Helpers
  // ==========================================================================

  const startMutation = useCallback((operation: string) => {
    setState({ isLoading: true, error: null, lastOperation: operation });
  }, []);

  const endMutation = useCallback((error?: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: error || null,
    }));
  }, []);

  const syncCaches = useCallback(() => {
    // Synchroniser les caches du dataService avec les atoms
    dataService.updateNodesCache(nodes);
    dataService.updateEdgesCache(edges);
  }, [nodes, edges]);

  /**
   * Sauvegarde un snapshot avant une mutation
   * Initialise l'historique au premier appel
   */
  const saveHistorySnapshot = useCallback(
    (description: string) => {
      // Initialiser l'historique au premier appel
      if (!historyInitialized.current) {
        initHistory({ nodes, edges });
        historyInitialized.current = true;
      }
      // Sauvegarder le snapshot
      pushHistory({ description, nodes, edges });
    },
    [nodes, edges, pushHistory, initHistory]
  );

  // ==========================================================================
  // CRUD Nodes
  // ==========================================================================

  const createNode = useCallback(
    async (
      type: NodeType,
      data: Record<string, unknown>,
      options?: CreateNodeOptions
    ): Promise<DataServiceResult<GraphNode>> => {
      startMutation('createNode');
      syncCaches();
      saveHistorySnapshot(`Créer ${type}`);

      try {
        const result = await dataService.createNode(type, data, options);

        if (result.success && result.data) {
          // Mettre à jour l'atom
          setNodes((prev) => {
            const newNodes = new Map(prev);
            newNodes.set(result.data!.id, result.data!);
            return newNodes;
          });
        }

        endMutation(result.error?.message);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        endMutation(errorMsg);
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: errorMsg },
        };
      }
    },
    [startMutation, endMutation, syncCaches, setNodes, saveHistorySnapshot]
  );

  const updateNode = useCallback(
    async (
      nodeId: string,
      updates: Partial<Record<string, unknown>>,
      options?: UpdateNodeOptions
    ): Promise<DataServiceResult<GraphNode>> => {
      startMutation('updateNode');
      syncCaches();
      saveHistorySnapshot('Modifier entité');

      try {
        const result = await dataService.updateNode(nodeId, updates, options);

        if (result.success && result.data) {
          // Mettre à jour l'atom
          setNodes((prev) => {
            const newNodes = new Map(prev);
            newNodes.set(nodeId, result.data!);
            return newNodes;
          });
        }

        endMutation(result.error?.message);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        endMutation(errorMsg);
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: errorMsg },
        };
      }
    },
    [startMutation, endMutation, syncCaches, setNodes, saveHistorySnapshot]
  );

  const deleteNode = useCallback(
    async (
      nodeId: string,
      options?: DeleteNodeOptions
    ): Promise<DataServiceResult<DeleteResult>> => {
      startMutation('deleteNode');
      syncCaches();
      saveHistorySnapshot('Supprimer entité');

      try {
        const result = await dataService.deleteNode(nodeId, options);

        if (result.success && result.data) {
          // Mettre à jour les atoms
          setNodes((prev) => {
            const newNodes = new Map(prev);
            for (const id of result.data!.deletedNodes) {
              newNodes.delete(id);
            }
            return newNodes;
          });

          setEdges((prev) => {
            const newEdges = new Map(prev);
            for (const id of result.data!.deletedEdges) {
              newEdges.delete(id);
            }
            return newEdges;
          });
        }

        endMutation(result.error?.message);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        endMutation(errorMsg);
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: errorMsg },
        };
      }
    },
    [startMutation, endMutation, syncCaches, setNodes, setEdges, saveHistorySnapshot]
  );

  const deleteNodes = useCallback(
    async (
      nodeIds: string[],
      options?: DeleteNodeOptions
    ): Promise<DataServiceResult<DeleteResult>> => {
      startMutation('deleteNodes');
      syncCaches();
      saveHistorySnapshot(`Supprimer ${nodeIds.length} entités`);

      try {
        const result = await dataService.deleteNodes(nodeIds, options);

        if (result.success && result.data) {
          setNodes((prev) => {
            const newNodes = new Map(prev);
            for (const id of result.data!.deletedNodes) {
              newNodes.delete(id);
            }
            return newNodes;
          });

          setEdges((prev) => {
            const newEdges = new Map(prev);
            for (const id of result.data!.deletedEdges) {
              newEdges.delete(id);
            }
            return newEdges;
          });
        }

        endMutation(result.error?.message);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        endMutation(errorMsg);
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: errorMsg },
        };
      }
    },
    [startMutation, endMutation, syncCaches, setNodes, setEdges, saveHistorySnapshot]
  );

  const duplicateNode = useCallback(
    async (
      nodeId: string,
      options?: { newData?: Partial<Record<string, unknown>>; includeRelations?: boolean }
    ): Promise<DataServiceResult<{ node: GraphNode; edges: GraphEdge[] }>> => {
      startMutation('duplicateNode');
      syncCaches();
      saveHistorySnapshot('Dupliquer entité');

      try {
        const result = await dataService.duplicateNode(nodeId, options);

        if (result.success && result.data) {
          // Ajouter le nouveau nœud
          setNodes((prev) => {
            const newNodes = new Map(prev);
            newNodes.set(result.data!.node.id, result.data!.node);
            return newNodes;
          });

          // Ajouter les nouvelles arêtes
          if (result.data.edges.length > 0) {
            setEdges((prev) => {
              const newEdges = new Map(prev);
              for (const edge of result.data!.edges) {
                newEdges.set(edge.id, edge);
              }
              return newEdges;
            });
          }
        }

        endMutation(result.error?.message);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        endMutation(errorMsg);
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: errorMsg },
        };
      }
    },
    [startMutation, endMutation, syncCaches, setNodes, setEdges, saveHistorySnapshot]
  );

  // ==========================================================================
  // CRUD Edges
  // ==========================================================================

  const createEdge = useCallback(
    async (
      source: string,
      target: string,
      type: EdgeType,
      properties?: Record<string, unknown>
    ): Promise<DataServiceResult<GraphEdge>> => {
      startMutation('createEdge');
      syncCaches();
      saveHistorySnapshot('Créer relation');

      try {
        const result = await dataService.createEdge({
          source,
          target,
          type,
          properties,
        });

        if (result.success && result.data) {
          setEdges((prev) => {
            const newEdges = new Map(prev);
            newEdges.set(result.data!.id, result.data!);
            return newEdges;
          });
        }

        endMutation(result.error?.message);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        endMutation(errorMsg);
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: errorMsg },
        };
      }
    },
    [startMutation, endMutation, syncCaches, setEdges, saveHistorySnapshot]
  );

  const updateEdge = useCallback(
    async (
      edgeId: string,
      changes: Partial<Omit<GraphEdge, 'id' | '_type' | 'source' | 'target'>>
    ): Promise<DataServiceResult<GraphEdge>> => {
      startMutation('updateEdge');
      syncCaches();
      saveHistorySnapshot('Modifier relation');

      try {
        const result = await dataService.updateEdge(edgeId, changes);

        if (result.success && result.data) {
          setEdges((prev) => {
            const newEdges = new Map(prev);
            newEdges.set(edgeId, result.data!);
            return newEdges;
          });
        }

        endMutation(result.error?.message);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        endMutation(errorMsg);
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: errorMsg },
        };
      }
    },
    [startMutation, endMutation, syncCaches, setEdges, saveHistorySnapshot]
  );

  const deleteEdge = useCallback(
    async (edgeId: string): Promise<DataServiceResult<boolean>> => {
      startMutation('deleteEdge');
      syncCaches();
      saveHistorySnapshot('Supprimer relation');

      try {
        const result = await dataService.deleteEdge(edgeId);

        if (result.success) {
          setEdges((prev) => {
            const newEdges = new Map(prev);
            newEdges.delete(edgeId);
            return newEdges;
          });
        }

        endMutation(result.error?.message);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        endMutation(errorMsg);
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: errorMsg },
        };
      }
    },
    [startMutation, endMutation, syncCaches, setEdges, saveHistorySnapshot]
  );

  // ==========================================================================
  // Validation
  // ==========================================================================

  const validateNodeFn = useCallback(
    (
      type: NodeType,
      data: Record<string, unknown>,
      options?: { isUpdate?: boolean; originalId?: string }
    ): ValidationResult => {
      return validateEntity(type, data, {
        existingNodes: nodes,
        isUpdate: options?.isUpdate,
        originalId: options?.originalId,
      });
    },
    [nodes]
  );

  const validateFieldFn = useCallback(
    (
      type: NodeType,
      fieldName: string,
      value: unknown,
      fullData?: Record<string, unknown>
    ): { isValid: boolean; error?: string } => {
      const errors = validateSingleField(type, fieldName, value, fullData, {
        existingNodes: nodes,
      });

      if (errors.length === 0) {
        return { isValid: true };
      }

      return { isValid: false, error: errors[0].message };
    },
    [nodes]
  );

  // ==========================================================================
  // Utilitaires
  // ==========================================================================

  const refreshFromPersistence = useCallback(async () => {
    startMutation('refresh');

    try {
      await dataService.initializeDataService();
      const nodesData = dataService.getNodesCache();
      const edgesData = dataService.getEdgesCache();

      setNodes(nodesData);
      setEdges(edgesData);

      endMutation();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      endMutation(errorMsg);
    }
  }, [startMutation, endMutation, setNodes, setEdges]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    state,
    clearError,

    // Node mutations
    createNode,
    updateNode,
    deleteNode,
    deleteNodes,
    duplicateNode,

    // Edge mutations
    createEdge,
    updateEdge,
    deleteEdge,

    // Validation
    validateNode: validateNodeFn,
    validateField: validateFieldFn,

    // Utilities
    refreshFromPersistence,
  };
}

// =============================================================================
// Hooks secondaires
// =============================================================================

/**
 * Hook pour la validation en temps réel d'un formulaire d'entité
 */
export function useEntityValidation(type: NodeType) {
  const [nodes] = useAtom(allNodesAtom);
  const schema = getEntitySchema(type);

  const validate = useCallback(
    (data: Record<string, unknown>, options?: { isUpdate?: boolean; originalId?: string }) => {
      return validateEntity(type, data, {
        existingNodes: nodes,
        isUpdate: options?.isUpdate,
        originalId: options?.originalId,
      });
    },
    [type, nodes]
  );

  const validateField = useCallback(
    (fieldName: string, value: unknown, fullData?: Record<string, unknown>) => {
      const errors = validateSingleField(type, fieldName, value, fullData, {
        existingNodes: nodes,
      });
      return errors.length === 0 ? null : errors[0].message;
    },
    [type, nodes]
  );

  return {
    schema,
    validate,
    validateField,
  };
}

/**
 * Hook pour obtenir les informations d'un nœud avec ses relations
 */
export function useNodeWithRelations(nodeId: string | null) {
  const [nodes] = useAtom(allNodesAtom);
  const [edges] = useAtom(allEdgesAtom);

  if (!nodeId) {
    return {
      node: null,
      incomingEdges: [],
      outgoingEdges: [],
      relatedNodes: [],
    };
  }

  const node = nodes.get(nodeId) || null;

  const incomingEdges = Array.from(edges.values()).filter(
    (e) => e.target === nodeId
  );

  const outgoingEdges = Array.from(edges.values()).filter(
    (e) => e.source === nodeId
  );

  const relatedNodeIds = new Set<string>();
  for (const edge of [...incomingEdges, ...outgoingEdges]) {
    if (edge.source !== nodeId) relatedNodeIds.add(edge.source);
    if (edge.target !== nodeId) relatedNodeIds.add(edge.target);
  }

  const relatedNodes = Array.from(relatedNodeIds)
    .map((id) => nodes.get(id))
    .filter((n): n is GraphNode => n !== undefined);

  return {
    node,
    incomingEdges,
    outgoingEdges,
    relatedNodes,
  };
}

// =============================================================================
// Export default
// =============================================================================

export default useDataMutations;
