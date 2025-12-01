/**
 * KG-Oversight - Service de persistance locale
 * Utilise IndexedDB pour stocker les données du graphe entre les sessions
 */

import type { GraphNode, GraphEdge, KQI } from '@data/types';
import { normalizeKQI, isStatutNormalized } from '@features/kqi/utils/kqiNormalization';

const DB_NAME = 'kg-oversight-db';
const DB_VERSION = 3; // v3: normalisation robuste des statuts KQI avec module centralisé
const STORE_NODES = 'nodes';
const STORE_EDGES = 'edges';
const STORE_META = 'metadata';

let db: IDBDatabase | null = null;

/**
 * Ouvre la connexion à IndexedDB
 */
export async function openDatabase(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[Persistence] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('[Persistence] Database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store pour les nœuds
      if (!database.objectStoreNames.contains(STORE_NODES)) {
        const nodesStore = database.createObjectStore(STORE_NODES, { keyPath: 'id' });
        nodesStore.createIndex('type', '_type', { unique: false });
        nodesStore.createIndex('criticite', 'criticite', { unique: false });
      }

      // Store pour les arêtes
      if (!database.objectStoreNames.contains(STORE_EDGES)) {
        const edgesStore = database.createObjectStore(STORE_EDGES, { keyPath: 'id' });
        edgesStore.createIndex('type', '_type', { unique: false });
        edgesStore.createIndex('source', 'source', { unique: false });
        edgesStore.createIndex('target', 'target', { unique: false });
      }

      // Store pour les métadonnées
      if (!database.objectStoreNames.contains(STORE_META)) {
        database.createObjectStore(STORE_META, { keyPath: 'key' });
      }

      console.log('[Persistence] Database schema created');
    };
  });
}

/**
 * Sauvegarde tous les nœuds dans IndexedDB
 */
export async function saveNodes(nodes: Map<string, GraphNode>): Promise<number> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES], 'readwrite');
    const store = transaction.objectStore(STORE_NODES);

    // Vider le store existant
    store.clear();

    let count = 0;
    for (const [, node] of nodes) {
      store.put(node);
      count++;
    }

    transaction.oncomplete = () => {
      console.log(`[Persistence] Saved ${count} nodes`);
      resolve(count);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to save nodes:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Sauvegarde toutes les arêtes dans IndexedDB
 */
export async function saveEdges(edges: Map<string, GraphEdge>): Promise<number> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES], 'readwrite');
    const store = transaction.objectStore(STORE_EDGES);

    // Vider le store existant
    store.clear();

    let count = 0;
    for (const [, edge] of edges) {
      store.put(edge);
      count++;
    }

    transaction.oncomplete = () => {
      console.log(`[Persistence] Saved ${count} edges`);
      resolve(count);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to save edges:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Sauvegarde les nœuds et arêtes en une seule transaction
 */
export async function saveAll(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>
): Promise<{ nodes: number; edges: number }> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES, STORE_EDGES, STORE_META], 'readwrite');

    const nodesStore = transaction.objectStore(STORE_NODES);
    const edgesStore = transaction.objectStore(STORE_EDGES);
    const metaStore = transaction.objectStore(STORE_META);

    // Vider les stores existants
    nodesStore.clear();
    edgesStore.clear();

    let nodeCount = 0;
    let edgeCount = 0;

    // Sauvegarder les nœuds
    for (const [, node] of nodes) {
      nodesStore.put(node);
      nodeCount++;
    }

    // Sauvegarder les arêtes
    for (const [, edge] of edges) {
      edgesStore.put(edge);
      edgeCount++;
    }

    // Sauvegarder les métadonnées
    metaStore.put({
      key: 'lastSave',
      timestamp: new Date().toISOString(),
      nodeCount,
      edgeCount,
    });

    transaction.oncomplete = () => {
      console.log(`[Persistence] Saved ${nodeCount} nodes and ${edgeCount} edges`);
      resolve({ nodes: nodeCount, edges: edgeCount });
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to save data:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Charge tous les nœuds depuis IndexedDB.
 * Les nœuds KQI sont automatiquement normalisés pour garantir
 * la cohérence des statuts et tendances avec les types TypeScript.
 */
export async function loadNodes(): Promise<Map<string, GraphNode>> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES], 'readonly');
    const store = transaction.objectStore(STORE_NODES);
    const request = store.getAll();

    request.onsuccess = () => {
      const nodes = new Map<string, GraphNode>();
      let normalizedCount = 0;

      for (const node of request.result) {
        // Normaliser les KQI pour garantir la cohérence des données
        // même si elles proviennent d'une version antérieure du cache
        if (node._type === 'KQI') {
          const kqi = node as KQI;
          // Vérifier si la normalisation est nécessaire
          if (!isStatutNormalized(kqi.statut)) {
            normalizedCount++;
          }
          nodes.set(node.id, normalizeKQI(kqi) as GraphNode);
        } else {
          nodes.set(node.id, node as GraphNode);
        }
      }

      if (normalizedCount > 0) {
        console.log(`[Persistence] Normalized ${normalizedCount} KQI nodes from legacy format`);
      }
      console.log(`[Persistence] Loaded ${nodes.size} nodes`);
      resolve(nodes);
    };

    request.onerror = () => {
      console.error('[Persistence] Failed to load nodes:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Charge toutes les arêtes depuis IndexedDB
 */
export async function loadEdges(): Promise<Map<string, GraphEdge>> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES], 'readonly');
    const store = transaction.objectStore(STORE_EDGES);
    const request = store.getAll();

    request.onsuccess = () => {
      const edges = new Map<string, GraphEdge>();
      for (const edge of request.result) {
        edges.set(edge.id, edge as GraphEdge);
      }
      console.log(`[Persistence] Loaded ${edges.size} edges`);
      resolve(edges);
    };

    request.onerror = () => {
      console.error('[Persistence] Failed to load edges:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Charge tous les nœuds et arêtes depuis IndexedDB
 */
export async function loadAll(): Promise<{
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
} | null> {
  try {
    const database = await openDatabase();

    // Vérifier si des données existent
    const meta = await getMetadata();
    if (!meta || meta.nodeCount === 0) {
      console.log('[Persistence] No persisted data found');
      return null;
    }

    const [nodes, edges] = await Promise.all([loadNodes(), loadEdges()]);

    return { nodes, edges };
  } catch (error) {
    console.error('[Persistence] Failed to load data:', error);
    return null;
  }
}

/**
 * Récupère les métadonnées de la dernière sauvegarde
 */
export async function getMetadata(): Promise<{
  lastSave: string;
  nodeCount: number;
  edgeCount: number;
} | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_META], 'readonly');
    const store = transaction.objectStore(STORE_META);
    const request = store.get('lastSave');

    request.onsuccess = () => {
      if (request.result) {
        resolve({
          lastSave: request.result.timestamp,
          nodeCount: request.result.nodeCount,
          edgeCount: request.result.edgeCount,
        });
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Vérifie si des données sont persistées
 */
export async function hasPersistedData(): Promise<boolean> {
  try {
    const meta = await getMetadata();
    return meta !== null && meta.nodeCount > 0;
  } catch {
    return false;
  }
}

/**
 * Efface toutes les données persistées
 */
export async function clearAll(): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES, STORE_EDGES, STORE_META], 'readwrite');

    transaction.objectStore(STORE_NODES).clear();
    transaction.objectStore(STORE_EDGES).clear();
    transaction.objectStore(STORE_META).clear();

    transaction.oncomplete = () => {
      console.log('[Persistence] All data cleared');
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

/**
 * Ferme la connexion à la base de données
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[Persistence] Database closed');
  }
}

// =============================================================================
// Opérations unitaires sur les nœuds (CRUD)
// =============================================================================

/**
 * Récupère un nœud par son ID
 */
export async function getNode(nodeId: string): Promise<GraphNode | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES], 'readonly');
    const store = transaction.objectStore(STORE_NODES);
    const request = store.get(nodeId);

    request.onsuccess = () => {
      if (request.result) {
        // Normaliser les KQI si nécessaire
        if (request.result._type === 'KQI') {
          resolve(normalizeKQI(request.result as KQI) as GraphNode);
        } else {
          resolve(request.result as GraphNode);
        }
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('[Persistence] Failed to get node:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Sauvegarde ou met à jour un seul nœud
 */
export async function putNode(node: GraphNode): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_NODES);
    const metaStore = transaction.objectStore(STORE_META);

    store.put(node);

    // Mettre à jour les métadonnées
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      metaStore.put({
        key: 'lastSave',
        timestamp: new Date().toISOString(),
        nodeCount: countRequest.result,
        edgeCount: -1, // Sera mis à jour séparément si nécessaire
      });
    };

    transaction.oncomplete = () => {
      console.log(`[Persistence] Saved node: ${node.id}`);
      resolve();
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to save node:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Met à jour un nœud existant (merge partiel)
 */
export async function updateNode(
  nodeId: string,
  updates: Partial<GraphNode>
): Promise<GraphNode | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_NODES);
    const metaStore = transaction.objectStore(STORE_META);

    const getRequest = store.get(nodeId);

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        resolve(null);
        return;
      }

      // Fusionner les mises à jour avec le nœud existant
      const updatedNode = { ...getRequest.result, ...updates, id: nodeId };
      store.put(updatedNode);

      // Mettre à jour le timestamp
      metaStore.put({
        key: 'lastSave',
        timestamp: new Date().toISOString(),
        nodeCount: -1,
        edgeCount: -1,
      });

      transaction.oncomplete = () => {
        console.log(`[Persistence] Updated node: ${nodeId}`);
        resolve(updatedNode as GraphNode);
      };
    };

    getRequest.onerror = () => {
      console.error('[Persistence] Failed to get node for update:', getRequest.error);
      reject(getRequest.error);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to update node:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Supprime un nœud par son ID
 */
export async function deleteNode(nodeId: string): Promise<boolean> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_NODES);
    const metaStore = transaction.objectStore(STORE_META);

    // Vérifier si le nœud existe
    const getRequest = store.get(nodeId);

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        resolve(false);
        return;
      }

      store.delete(nodeId);

      // Mettre à jour les métadonnées
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        metaStore.put({
          key: 'lastSave',
          timestamp: new Date().toISOString(),
          nodeCount: countRequest.result,
          edgeCount: -1,
        });
      };
    };

    transaction.oncomplete = () => {
      console.log(`[Persistence] Deleted node: ${nodeId}`);
      resolve(true);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to delete node:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Supprime plusieurs nœuds en une transaction
 */
export async function deleteNodes(nodeIds: string[]): Promise<number> {
  if (nodeIds.length === 0) return 0;

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_NODES);
    const metaStore = transaction.objectStore(STORE_META);

    let deletedCount = 0;

    for (const nodeId of nodeIds) {
      const request = store.delete(nodeId);
      request.onsuccess = () => {
        deletedCount++;
      };
    }

    transaction.oncomplete = () => {
      // Mettre à jour les métadonnées
      const countTransaction = database.transaction([STORE_NODES, STORE_META], 'readwrite');
      const countStore = countTransaction.objectStore(STORE_NODES);
      const countMetaStore = countTransaction.objectStore(STORE_META);

      const countRequest = countStore.count();
      countRequest.onsuccess = () => {
        countMetaStore.put({
          key: 'lastSave',
          timestamp: new Date().toISOString(),
          nodeCount: countRequest.result,
          edgeCount: -1,
        });
      };

      console.log(`[Persistence] Deleted ${deletedCount} nodes`);
      resolve(deletedCount);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to delete nodes:', transaction.error);
      reject(transaction.error);
    };
  });
}

// =============================================================================
// Opérations unitaires sur les arêtes (CRUD)
// =============================================================================

/**
 * Récupère une arête par son ID
 */
export async function getEdge(edgeId: string): Promise<GraphEdge | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES], 'readonly');
    const store = transaction.objectStore(STORE_EDGES);
    const request = store.get(edgeId);

    request.onsuccess = () => {
      resolve(request.result ? (request.result as GraphEdge) : null);
    };

    request.onerror = () => {
      console.error('[Persistence] Failed to get edge:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Sauvegarde ou met à jour une seule arête
 */
export async function putEdge(edge: GraphEdge): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_EDGES);
    const metaStore = transaction.objectStore(STORE_META);

    store.put(edge);

    // Mettre à jour les métadonnées
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      metaStore.put({
        key: 'lastSave',
        timestamp: new Date().toISOString(),
        nodeCount: -1,
        edgeCount: countRequest.result,
      });
    };

    transaction.oncomplete = () => {
      console.log(`[Persistence] Saved edge: ${edge.id}`);
      resolve();
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to save edge:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Met à jour une arête existante (merge partiel)
 */
export async function updateEdge(
  edgeId: string,
  updates: Partial<GraphEdge>
): Promise<GraphEdge | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_EDGES);
    const metaStore = transaction.objectStore(STORE_META);

    const getRequest = store.get(edgeId);

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        resolve(null);
        return;
      }

      // Fusionner les mises à jour avec l'arête existante
      const updatedEdge = { ...getRequest.result, ...updates, id: edgeId };
      store.put(updatedEdge);

      // Mettre à jour le timestamp
      metaStore.put({
        key: 'lastSave',
        timestamp: new Date().toISOString(),
        nodeCount: -1,
        edgeCount: -1,
      });

      transaction.oncomplete = () => {
        console.log(`[Persistence] Updated edge: ${edgeId}`);
        resolve(updatedEdge as GraphEdge);
      };
    };

    getRequest.onerror = () => {
      console.error('[Persistence] Failed to get edge for update:', getRequest.error);
      reject(getRequest.error);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to update edge:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Supprime une arête par son ID
 */
export async function deleteEdge(edgeId: string): Promise<boolean> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_EDGES);
    const metaStore = transaction.objectStore(STORE_META);

    // Vérifier si l'arête existe
    const getRequest = store.get(edgeId);

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        resolve(false);
        return;
      }

      store.delete(edgeId);

      // Mettre à jour les métadonnées
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        metaStore.put({
          key: 'lastSave',
          timestamp: new Date().toISOString(),
          nodeCount: -1,
          edgeCount: countRequest.result,
        });
      };
    };

    transaction.oncomplete = () => {
      console.log(`[Persistence] Deleted edge: ${edgeId}`);
      resolve(true);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to delete edge:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Supprime plusieurs arêtes en une transaction
 */
export async function deleteEdges(edgeIds: string[]): Promise<number> {
  if (edgeIds.length === 0) return 0;

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_EDGES);

    let deletedCount = 0;

    for (const edgeId of edgeIds) {
      const request = store.delete(edgeId);
      request.onsuccess = () => {
        deletedCount++;
      };
    }

    transaction.oncomplete = () => {
      // Mettre à jour les métadonnées
      const countTransaction = database.transaction([STORE_EDGES, STORE_META], 'readwrite');
      const countStore = countTransaction.objectStore(STORE_EDGES);
      const countMetaStore = countTransaction.objectStore(STORE_META);

      const countRequest = countStore.count();
      countRequest.onsuccess = () => {
        countMetaStore.put({
          key: 'lastSave',
          timestamp: new Date().toISOString(),
          nodeCount: -1,
          edgeCount: countRequest.result,
        });
      };

      console.log(`[Persistence] Deleted ${deletedCount} edges`);
      resolve(deletedCount);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to delete edges:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Récupère toutes les arêtes connectées à un nœud
 */
export async function getEdgesByNode(nodeId: string): Promise<GraphEdge[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES], 'readonly');
    const store = transaction.objectStore(STORE_EDGES);

    const edges: GraphEdge[] = [];

    // Utiliser l'index source
    const sourceIndex = store.index('source');
    const sourceRequest = sourceIndex.getAll(nodeId);

    sourceRequest.onsuccess = () => {
      edges.push(...(sourceRequest.result as GraphEdge[]));

      // Utiliser l'index target
      const targetIndex = store.index('target');
      const targetRequest = targetIndex.getAll(nodeId);

      targetRequest.onsuccess = () => {
        edges.push(...(targetRequest.result as GraphEdge[]));
        // Dédupliquer (au cas où une arête serait source ET target du même nœud)
        const uniqueEdges = Array.from(
          new Map(edges.map((e) => [e.id, e])).values()
        );
        resolve(uniqueEdges);
      };

      targetRequest.onerror = () => {
        reject(targetRequest.error);
      };
    };

    sourceRequest.onerror = () => {
      reject(sourceRequest.error);
    };
  });
}

/**
 * Supprime toutes les arêtes connectées à un nœud
 */
export async function deleteEdgesByNode(nodeId: string): Promise<string[]> {
  const edges = await getEdgesByNode(nodeId);
  const edgeIds = edges.map((e) => e.id);

  if (edgeIds.length > 0) {
    await deleteEdges(edgeIds);
  }

  return edgeIds;
}

/**
 * Sauvegarde plusieurs nœuds en une transaction (sans vider le store)
 */
export async function putNodes(nodes: GraphNode[]): Promise<number> {
  if (nodes.length === 0) return 0;

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_NODES);
    const metaStore = transaction.objectStore(STORE_META);

    for (const node of nodes) {
      store.put(node);
    }

    transaction.oncomplete = () => {
      // Mettre à jour les métadonnées
      const countTransaction = database.transaction([STORE_NODES, STORE_META], 'readwrite');
      const countStore = countTransaction.objectStore(STORE_NODES);
      const countMetaStore = countTransaction.objectStore(STORE_META);

      const countRequest = countStore.count();
      countRequest.onsuccess = () => {
        countMetaStore.put({
          key: 'lastSave',
          timestamp: new Date().toISOString(),
          nodeCount: countRequest.result,
          edgeCount: -1,
        });
      };

      console.log(`[Persistence] Put ${nodes.length} nodes`);
      resolve(nodes.length);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to put nodes:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Sauvegarde plusieurs arêtes en une transaction (sans vider le store)
 */
export async function putEdges(edges: GraphEdge[]): Promise<number> {
  if (edges.length === 0) return 0;

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_EDGES, STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_EDGES);
    const metaStore = transaction.objectStore(STORE_META);

    for (const edge of edges) {
      store.put(edge);
    }

    transaction.oncomplete = () => {
      // Mettre à jour les métadonnées
      const countTransaction = database.transaction([STORE_EDGES, STORE_META], 'readwrite');
      const countStore = countTransaction.objectStore(STORE_EDGES);
      const countMetaStore = countTransaction.objectStore(STORE_META);

      const countRequest = countStore.count();
      countRequest.onsuccess = () => {
        countMetaStore.put({
          key: 'lastSave',
          timestamp: new Date().toISOString(),
          nodeCount: -1,
          edgeCount: countRequest.result,
        });
      };

      console.log(`[Persistence] Put ${edges.length} edges`);
      resolve(edges.length);
    };

    transaction.onerror = () => {
      console.error('[Persistence] Failed to put edges:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Vérifie si un nœud existe
 */
export async function nodeExists(nodeId: string): Promise<boolean> {
  const node = await getNode(nodeId);
  return node !== null;
}

/**
 * Vérifie si une arête existe
 */
export async function edgeExists(edgeId: string): Promise<boolean> {
  const edge = await getEdge(edgeId);
  return edge !== null;
}

/**
 * Compte le nombre de nœuds par type
 */
export async function countNodesByType(): Promise<Map<string, number>> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES], 'readonly');
    const store = transaction.objectStore(STORE_NODES);
    const request = store.getAll();

    request.onsuccess = () => {
      const counts = new Map<string, number>();
      for (const node of request.result) {
        const type = node._type || 'unknown';
        counts.set(type, (counts.get(type) || 0) + 1);
      }
      resolve(counts);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export default {
  openDatabase,
  saveNodes,
  saveEdges,
  saveAll,
  loadNodes,
  loadEdges,
  loadAll,
  getMetadata,
  hasPersistedData,
  clearAll,
  closeDatabase,
  // Opérations unitaires sur les nœuds
  getNode,
  putNode,
  updateNode,
  deleteNode,
  deleteNodes,
  putNodes,
  nodeExists,
  // Opérations unitaires sur les arêtes
  getEdge,
  putEdge,
  updateEdge,
  deleteEdge,
  deleteEdges,
  putEdges,
  edgeExists,
  getEdgesByNode,
  deleteEdgesByNode,
  // Statistiques
  countNodesByType,
};
