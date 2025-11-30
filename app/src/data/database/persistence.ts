/**
 * KG-Oversight - Service de persistance locale
 * Utilise IndexedDB pour stocker les données du graphe entre les sessions
 */

import type { GraphNode, GraphEdge } from '@data/types';

const DB_NAME = 'kg-oversight-db';
const DB_VERSION = 1;
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
 * Charge tous les nœuds depuis IndexedDB
 */
export async function loadNodes(): Promise<Map<string, GraphNode>> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NODES], 'readonly');
    const store = transaction.objectStore(STORE_NODES);
    const request = store.getAll();

    request.onsuccess = () => {
      const nodes = new Map<string, GraphNode>();
      for (const node of request.result) {
        nodes.set(node.id, node as GraphNode);
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
};
