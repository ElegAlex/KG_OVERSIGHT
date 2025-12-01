/**
 * KG-Oversight - Data Service
 * Service principal d'orchestration des opérations CRUD
 *
 * Coordonne :
 * - Validation des entités
 * - Génération des IDs
 * - Persistance IndexedDB
 * - Synchronisation avec le state Jotai
 */

import type { NodeType, EdgeType, GraphNode, GraphEdge } from '@data/types';
import type {
  DataServiceResult,
  DataServiceError,
  CreateNodeOptions,
  UpdateNodeOptions,
  DeleteNodeOptions,
  DeleteResult,
  ValidationResult,
} from '../types';
import { getEntitySchema } from '../constants/entitySchemas';
import {
  generateId,
  registerExistingId,
  releaseId,
  syncWithExistingNodes,
  idExists,
  validateCustomId,
} from './idGenerator';
import {
  validateEntity,
  validateRelation,
  validateDeletion,
} from './validationService';
import * as persistence from '@data/database/persistence';

// =============================================================================
// Types internes
// =============================================================================

type NodeData = Record<string, unknown>;

interface EdgeData {
  source: string;
  target: string;
  type: EdgeType;
  properties?: Record<string, unknown>;
}

// =============================================================================
// Cache des nœuds pour la validation des références
// =============================================================================

let nodesCache: Map<string, GraphNode> = new Map();
let edgesCache: Map<string, GraphEdge> = new Map();

/**
 * Met à jour le cache local des nœuds
 */
export function updateNodesCache(nodes: Map<string, GraphNode>): void {
  nodesCache = new Map(nodes);
  // Synchroniser le générateur d'IDs
  syncWithExistingNodes(Array.from(nodes.keys()));
}

/**
 * Met à jour le cache local des arêtes
 */
export function updateEdgesCache(edges: Map<string, GraphEdge>): void {
  edgesCache = new Map(edges);
}

/**
 * Récupère le cache des nœuds
 */
export function getNodesCache(): Map<string, GraphNode> {
  return nodesCache;
}

/**
 * Récupère le cache des arêtes
 */
export function getEdgesCache(): Map<string, GraphEdge> {
  return edgesCache;
}

// =============================================================================
// Helpers
// =============================================================================

function createError(code: string, message: string, field?: string): DataServiceError {
  return { code, message, field };
}

function success<T>(data: T): DataServiceResult<T> {
  return { success: true, data };
}

function failure<T>(error: DataServiceError): DataServiceResult<T> {
  return { success: false, error };
}

/**
 * Construit un GraphNode à partir des données fournies
 */
function buildNode(
  id: string,
  type: NodeType,
  data: NodeData
): GraphNode {
  const schema = getEntitySchema(type);
  const node: Record<string, unknown> = {
    id,
    _type: type,
    type, // Alias pour compatibilité
  };

  // Copier les propriétés définies dans le schéma
  if (schema) {
    for (const field of schema.fields) {
      if (data[field.name] !== undefined) {
        node[field.name] = data[field.name];
      } else if (field.defaultValue !== undefined) {
        node[field.name] = field.defaultValue;
      }
    }
  }

  // Ajouter les propriétés supplémentaires
  for (const [key, value] of Object.entries(data)) {
    if (!(key in node)) {
      node[key] = value;
    }
  }

  return node as GraphNode;
}

/**
 * Construit un GraphEdge à partir des données fournies
 */
function buildEdge(
  id: string,
  source: string,
  target: string,
  type: EdgeType,
  properties?: Record<string, unknown>
): GraphEdge {
  return {
    id,
    source,
    target,
    _type: type,
    type, // Alias pour compatibilité
    ...properties,
  } as GraphEdge;
}

// =============================================================================
// Opérations CRUD sur les nœuds
// =============================================================================

/**
 * Crée un nouveau nœud
 */
export async function createNode(
  type: NodeType,
  data: NodeData,
  options: CreateNodeOptions = {}
): Promise<DataServiceResult<GraphNode>> {
  try {
    // Vérifier que le type est valide
    const schema = getEntitySchema(type);
    if (!schema) {
      return failure(createError('INVALID_TYPE', `Type d'entité inconnu: ${type}`));
    }

    // Générer ou valider l'ID
    let nodeId: string;
    if (options.customId) {
      const idValidation = validateCustomId(options.customId, type);
      if (!idValidation.valid) {
        return failure(createError('INVALID_ID', idValidation.error || 'ID invalide', 'id'));
      }
      nodeId = options.customId;
    } else {
      nodeId = generateId(type);
    }

    // Vérifier l'unicité de l'ID
    if (idExists(nodeId) || nodesCache.has(nodeId)) {
      return failure(createError('DUPLICATE_ID', `L'ID "${nodeId}" existe déjà`, 'id'));
    }

    // Valider les données
    if (!options.skipValidation) {
      const validation = validateEntity(type, data, { existingNodes: nodesCache });
      if (!validation.isValid) {
        const firstError = validation.errors[0];
        return failure(
          createError('VALIDATION_ERROR', firstError.message, firstError.field)
        );
      }
    }

    // Construire le nœud
    const node = buildNode(nodeId, type, data);

    // Persister
    await persistence.putNode(node);

    // Mettre à jour le cache
    nodesCache.set(nodeId, node);
    registerExistingId(nodeId);

    console.log(`[DataService] Created node: ${nodeId} (${type})`);
    return success(node);
  } catch (error) {
    console.error('[DataService] Create node error:', error);
    return failure(
      createError('PERSISTENCE_ERROR', `Erreur lors de la création: ${error}`)
    );
  }
}

/**
 * Lit un nœud par son ID
 */
export async function readNode(nodeId: string): Promise<DataServiceResult<GraphNode>> {
  try {
    // Vérifier le cache d'abord
    const cachedNode = nodesCache.get(nodeId);
    if (cachedNode) {
      return success(cachedNode);
    }

    // Sinon, lire depuis la persistence
    const node = await persistence.getNode(nodeId);
    if (!node) {
      return failure(createError('NOT_FOUND', `Nœud "${nodeId}" non trouvé`, 'id'));
    }

    // Mettre à jour le cache
    nodesCache.set(nodeId, node);

    return success(node);
  } catch (error) {
    console.error('[DataService] Read node error:', error);
    return failure(createError('PERSISTENCE_ERROR', `Erreur lors de la lecture: ${error}`));
  }
}

/**
 * Met à jour un nœud existant
 */
export async function updateNode(
  nodeId: string,
  updates: Partial<NodeData>,
  options: UpdateNodeOptions = {}
): Promise<DataServiceResult<GraphNode>> {
  try {
    // Vérifier que le nœud existe
    const existingNode = nodesCache.get(nodeId) || (await persistence.getNode(nodeId));
    if (!existingNode) {
      return failure(createError('NOT_FOUND', `Nœud "${nodeId}" non trouvé`, 'id'));
    }

    const nodeType = existingNode._type || existingNode.type;

    // Fusionner les données
    const mergedData = { ...existingNode, ...updates };

    // Valider les données fusionnées
    if (!options.skipValidation) {
      const validation = validateEntity(nodeType as NodeType, mergedData as NodeData, {
        existingNodes: nodesCache,
        isUpdate: true,
        originalId: nodeId,
      });
      if (!validation.isValid) {
        const firstError = validation.errors[0];
        return failure(
          createError('VALIDATION_ERROR', firstError.message, firstError.field)
        );
      }
    }

    // Reconstruire le nœud
    const updatedNode = buildNode(nodeId, nodeType as NodeType, mergedData as NodeData);

    // Persister
    await persistence.putNode(updatedNode);

    // Mettre à jour le cache
    nodesCache.set(nodeId, updatedNode);

    console.log(`[DataService] Updated node: ${nodeId}`);
    return success(updatedNode);
  } catch (error) {
    console.error('[DataService] Update node error:', error);
    return failure(
      createError('PERSISTENCE_ERROR', `Erreur lors de la mise à jour: ${error}`)
    );
  }
}

/**
 * Supprime un nœud
 */
export async function deleteNode(
  nodeId: string,
  options: DeleteNodeOptions = {}
): Promise<DataServiceResult<DeleteResult>> {
  try {
    // Vérifier que le nœud existe
    const existingNode = nodesCache.get(nodeId);
    if (!existingNode) {
      return failure(createError('NOT_FOUND', `Nœud "${nodeId}" non trouvé`, 'id'));
    }

    // Trouver les relations impactées
    const affectedEdges = Array.from(edgesCache.values()).filter(
      (e) => e.source === nodeId || e.target === nodeId
    );

    // Valider la suppression
    const validation = validateDeletion(
      nodeId,
      affectedEdges.map((e) => ({ source: e.source, target: e.target })),
      { cascade: options.cascade }
    );

    if (!validation.isValid && !options.cascade) {
      return failure(
        createError(
          'HAS_RELATIONS',
          `Ce nœud a ${affectedEdges.length} relation(s). Utilisez cascade: true pour supprimer.`,
          'relations'
        )
      );
    }

    // Mode dry run
    if (options.dryRun) {
      return success({
        deletedNodes: [nodeId],
        deletedEdges: affectedEdges.map((e) => e.id),
        preservedNodes: [],
      });
    }

    const deletedEdgeIds: string[] = [];
    const deletedNodeIds: string[] = [nodeId];

    // Supprimer les relations si cascade
    if (options.cascade && affectedEdges.length > 0) {
      const edgeIds = affectedEdges.map((e) => e.id);
      await persistence.deleteEdges(edgeIds);
      deletedEdgeIds.push(...edgeIds);

      // Mettre à jour le cache des arêtes
      for (const edgeId of edgeIds) {
        edgesCache.delete(edgeId);
      }
    }

    // Supprimer le nœud
    await persistence.deleteNode(nodeId);

    // Mettre à jour le cache
    nodesCache.delete(nodeId);
    releaseId(nodeId);

    console.log(`[DataService] Deleted node: ${nodeId} (${deletedEdgeIds.length} edges)`);

    return success({
      deletedNodes: deletedNodeIds,
      deletedEdges: deletedEdgeIds,
      preservedNodes: [],
    });
  } catch (error) {
    console.error('[DataService] Delete node error:', error);
    return failure(
      createError('PERSISTENCE_ERROR', `Erreur lors de la suppression: ${error}`)
    );
  }
}

/**
 * Supprime plusieurs nœuds
 */
export async function deleteNodes(
  nodeIds: string[],
  options: DeleteNodeOptions = {}
): Promise<DataServiceResult<DeleteResult>> {
  const deletedNodes: string[] = [];
  const deletedEdges: string[] = [];
  const preservedNodes: string[] = [];

  for (const nodeId of nodeIds) {
    const result = await deleteNode(nodeId, options);
    if (result.success && result.data) {
      deletedNodes.push(...result.data.deletedNodes);
      deletedEdges.push(...result.data.deletedEdges);
    } else {
      preservedNodes.push(nodeId);
    }
  }

  return success({
    deletedNodes,
    deletedEdges,
    preservedNodes,
  });
}

// =============================================================================
// Opérations CRUD sur les arêtes
// =============================================================================

/**
 * Crée une nouvelle relation
 */
export async function createEdge(
  data: EdgeData
): Promise<DataServiceResult<GraphEdge>> {
  try {
    // Vérifier que les nœuds existent
    const sourceNode = nodesCache.get(data.source);
    const targetNode = nodesCache.get(data.target);

    if (!sourceNode) {
      return failure(
        createError('NOT_FOUND', `Nœud source "${data.source}" non trouvé`, 'source')
      );
    }

    if (!targetNode) {
      return failure(
        createError('NOT_FOUND', `Nœud cible "${data.target}" non trouvé`, 'target')
      );
    }

    // Valider la relation
    const sourceType = (sourceNode._type || sourceNode.type) as NodeType;
    const targetType = (targetNode._type || targetNode.type) as NodeType;

    const validation = validateRelation(
      sourceType,
      targetType,
      data.type,
      nodesCache,
      data.source,
      data.target
    );

    if (!validation.isValid) {
      const firstError = validation.errors[0];
      return failure(
        createError('VALIDATION_ERROR', firstError.message, firstError.field)
      );
    }

    // Générer l'ID de l'arête
    const edgeId = `${data.source}_${data.type}_${data.target}`;

    // Vérifier l'unicité
    if (edgesCache.has(edgeId)) {
      return failure(
        createError('DUPLICATE_EDGE', 'Cette relation existe déjà', 'id')
      );
    }

    // Construire l'arête
    const edge = buildEdge(edgeId, data.source, data.target, data.type, data.properties);

    // Persister
    await persistence.putEdge(edge);

    // Mettre à jour le cache
    edgesCache.set(edgeId, edge);

    console.log(`[DataService] Created edge: ${edgeId}`);
    return success(edge);
  } catch (error) {
    console.error('[DataService] Create edge error:', error);
    return failure(
      createError('PERSISTENCE_ERROR', `Erreur lors de la création: ${error}`)
    );
  }
}

/**
 * Lit une relation par son ID
 */
export async function readEdge(edgeId: string): Promise<DataServiceResult<GraphEdge>> {
  try {
    const cachedEdge = edgesCache.get(edgeId);
    if (cachedEdge) {
      return success(cachedEdge);
    }

    const edge = await persistence.getEdge(edgeId);
    if (!edge) {
      return failure(createError('NOT_FOUND', `Relation "${edgeId}" non trouvée`, 'id'));
    }

    edgesCache.set(edgeId, edge);
    return success(edge);
  } catch (error) {
    console.error('[DataService] Read edge error:', error);
    return failure(createError('PERSISTENCE_ERROR', `Erreur lors de la lecture: ${error}`));
  }
}

/**
 * Supprime une relation
 */
export async function deleteEdge(edgeId: string): Promise<DataServiceResult<boolean>> {
  try {
    const exists = edgesCache.has(edgeId);
    if (!exists) {
      return failure(createError('NOT_FOUND', `Relation "${edgeId}" non trouvée`, 'id'));
    }

    await persistence.deleteEdge(edgeId);
    edgesCache.delete(edgeId);

    console.log(`[DataService] Deleted edge: ${edgeId}`);
    return success(true);
  } catch (error) {
    console.error('[DataService] Delete edge error:', error);
    return failure(
      createError('PERSISTENCE_ERROR', `Erreur lors de la suppression: ${error}`)
    );
  }
}

/**
 * Récupère les relations d'un nœud
 */
export function getNodeEdges(nodeId: string): GraphEdge[] {
  return Array.from(edgesCache.values()).filter(
    (e) => e.source === nodeId || e.target === nodeId
  );
}

/**
 * Récupère les relations sortantes d'un nœud
 */
export function getOutgoingEdges(nodeId: string): GraphEdge[] {
  return Array.from(edgesCache.values()).filter((e) => e.source === nodeId);
}

/**
 * Récupère les relations entrantes d'un nœud
 */
export function getIncomingEdges(nodeId: string): GraphEdge[] {
  return Array.from(edgesCache.values()).filter((e) => e.target === nodeId);
}

// =============================================================================
// Opérations de masse
// =============================================================================

/**
 * Duplique un nœud avec un nouvel ID
 */
export async function duplicateNode(
  nodeId: string,
  options: { newData?: Partial<NodeData>; includeRelations?: boolean } = {}
): Promise<DataServiceResult<{ node: GraphNode; edges: GraphEdge[] }>> {
  try {
    const sourceNode = nodesCache.get(nodeId);
    if (!sourceNode) {
      return failure(createError('NOT_FOUND', `Nœud "${nodeId}" non trouvé`, 'id'));
    }

    const nodeType = (sourceNode._type || sourceNode.type) as NodeType;

    // Créer une copie des données
    const nodeData: NodeData = { ...sourceNode };
    delete nodeData.id;
    delete nodeData._type;
    delete nodeData.type;

    // Appliquer les modifications
    if (options.newData) {
      Object.assign(nodeData, options.newData);
    }

    // Créer le nouveau nœud
    const createResult = await createNode(nodeType, nodeData);
    if (!createResult.success || !createResult.data) {
      return failure(createResult.error!);
    }

    const newNode = createResult.data;
    const newEdges: GraphEdge[] = [];

    // Dupliquer les relations si demandé
    if (options.includeRelations) {
      const sourceEdges = getNodeEdges(nodeId);

      for (const edge of sourceEdges) {
        const edgeType = (edge._type || edge.type) as EdgeType;
        const newSource = edge.source === nodeId ? newNode.id : edge.source;
        const newTarget = edge.target === nodeId ? newNode.id : edge.target;

        const edgeResult = await createEdge({
          source: newSource,
          target: newTarget,
          type: edgeType,
        });

        if (edgeResult.success && edgeResult.data) {
          newEdges.push(edgeResult.data);
        }
      }
    }

    console.log(`[DataService] Duplicated node: ${nodeId} -> ${newNode.id}`);
    return success({ node: newNode, edges: newEdges });
  } catch (error) {
    console.error('[DataService] Duplicate node error:', error);
    return failure(
      createError('PERSISTENCE_ERROR', `Erreur lors de la duplication: ${error}`)
    );
  }
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Valide une entité sans la persister
 */
export function validateNode(
  type: NodeType,
  data: NodeData,
  options: { isUpdate?: boolean; originalId?: string } = {}
): ValidationResult {
  return validateEntity(type, data, {
    existingNodes: nodesCache,
    isUpdate: options.isUpdate,
    originalId: options.originalId,
  });
}

// =============================================================================
// Initialisation
// =============================================================================

/**
 * Initialise le service avec les données existantes
 */
export async function initializeDataService(): Promise<void> {
  try {
    const data = await persistence.loadAll();
    if (data) {
      updateNodesCache(data.nodes);
      updateEdgesCache(data.edges);
      console.log(
        `[DataService] Initialized with ${data.nodes.size} nodes and ${data.edges.size} edges`
      );
    } else {
      console.log('[DataService] Initialized with empty data');
    }
  } catch (error) {
    console.error('[DataService] Initialization error:', error);
    throw error;
  }
}

// =============================================================================
// Export
// =============================================================================

export default {
  // Cache
  updateNodesCache,
  updateEdgesCache,
  getNodesCache,
  getEdgesCache,
  // CRUD Nodes
  createNode,
  readNode,
  updateNode,
  deleteNode,
  deleteNodes,
  duplicateNode,
  // CRUD Edges
  createEdge,
  readEdge,
  deleteEdge,
  getNodeEdges,
  getOutgoingEdges,
  getIncomingEdges,
  // Validation
  validateNode,
  // Init
  initializeDataService,
};
