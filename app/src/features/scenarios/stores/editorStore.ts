/**
 * KG-Oversight - Store Jotai pour l'éditeur de scénarios
 * Gestion de l'état de l'éditeur visuel de scénarios
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type {
  EditorState,
  EditorStepNode,
  EditorConnection,
  EditorMode,
  EditorHistoryEntry,
  Position,
} from '../types/editor';
import type { ScenarioMetadata, Scenario, ScenarioStep } from '../types/scenario';

// =============================================================================
// État initial
// =============================================================================

const initialState: EditorState = {
  mode: 'select',
  nodes: [],
  connections: [],
  selectedNodeId: null,
  selectedConnectionId: null,
  connectingFromId: null,
  metadata: {
    id: '',
    title: '',
    description: '',
    category: 'custom',
    color: '#6366f1',
    estimatedDuration: 10,
    tags: [],
  },
  history: [],
  historyIndex: -1,
  viewport: {
    zoom: 1,
    panX: 0,
    panY: 0,
  },
  editingScenarioId: null,
  isDirty: false,
};

// =============================================================================
// Atoms de base
// =============================================================================

/** État de l'éditeur */
export const editorStateAtom = atom<EditorState>(initialState);

/** Éditeur ouvert */
export const isEditorOpenAtom = atom<boolean>(false);

/** Scénarios personnalisés sauvegardés */
export const customScenariosAtom = atomWithStorage<Scenario[]>('kg-oversight-custom-scenarios', []);

// =============================================================================
// Atoms dérivés
// =============================================================================

/** Mode d'édition actuel */
export const editorModeAtom = atom(
  (get) => get(editorStateAtom).mode,
  (get, set, mode: EditorMode) => {
    const state = get(editorStateAtom);
    set(editorStateAtom, {
      ...state,
      mode,
      connectingFromId: mode === 'connect' ? state.connectingFromId : null,
    });
  }
);

/** Nœuds de l'éditeur */
export const editorNodesAtom = atom(
  (get) => get(editorStateAtom).nodes
);

/** Connexions de l'éditeur */
export const editorConnectionsAtom = atom(
  (get) => get(editorStateAtom).connections
);

/** Nœud sélectionné */
export const selectedNodeAtom = atom(
  (get) => {
    const state = get(editorStateAtom);
    if (!state.selectedNodeId) return null;
    return state.nodes.find((n) => n.id === state.selectedNodeId) || null;
  }
);

/** Métadonnées du scénario */
export const editorMetadataAtom = atom(
  (get) => get(editorStateAtom).metadata
);

/** Viewport (zoom/pan) */
export const editorViewportAtom = atom(
  (get) => get(editorStateAtom).viewport
);

/** Peut undo */
export const canUndoAtom = atom(
  (get) => get(editorStateAtom).historyIndex > 0
);

/** Peut redo */
export const canRedoAtom = atom(
  (get) => {
    const state = get(editorStateAtom);
    return state.historyIndex < state.history.length - 1;
  }
);

/** Le scénario est valide pour export */
export const isScenarioValidAtom = atom((get) => {
  const state = get(editorStateAtom);

  // Vérifications de base
  if (!state.metadata.title || state.metadata.title.trim() === '') return false;
  if (state.nodes.length === 0) return false;

  // Chaque nœud doit avoir un titre
  for (const node of state.nodes) {
    if (!node.data.title || node.data.title.trim() === '') return false;
  }

  return true;
});

// =============================================================================
// Helpers
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function saveToHistory(state: EditorState): EditorState {
  const entry: EditorHistoryEntry = {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    connections: JSON.parse(JSON.stringify(state.connections)),
    metadata: JSON.parse(JSON.stringify(state.metadata)),
  };

  // Tronquer l'historique si on n'est pas à la fin
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);

  // Limiter la taille de l'historique
  const maxHistory = 50;
  if (newHistory.length > maxHistory) {
    newHistory.shift();
  }

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
    isDirty: true,
  };
}

// =============================================================================
// Actions
// =============================================================================

/** Ouvrir l'éditeur */
export const openEditorAtom = atom(null, (get, set) => {
  set(isEditorOpenAtom, true);
});

/** Fermer l'éditeur */
export const closeEditorAtom = atom(null, (get, set) => {
  set(isEditorOpenAtom, false);
});

/** Réinitialiser l'éditeur pour un nouveau scénario */
export const resetEditorAtom = atom(null, (get, set) => {
  set(editorStateAtom, {
    ...initialState,
    metadata: {
      ...initialState.metadata,
      id: generateId(),
    },
  });
});

/** Ajouter un nœud */
export const addNodeAtom = atom(null, (get, set, { position, type = 'step' }: { position: Position; type?: EditorStepNode['type'] }) => {
  const state = get(editorStateAtom);

  const newNode: EditorStepNode = {
    id: generateId(),
    position,
    type,
    data: {
      id: generateId(),
      title: type === 'start' ? 'Début' : type === 'end' ? 'Fin' : 'Nouvelle étape',
      description: '',
      nodeSelector: { types: [] },
      actions: ['highlight'],
    },
  };

  const newState = saveToHistory({
    ...state,
    nodes: [...state.nodes, newNode],
    selectedNodeId: newNode.id,
  });

  set(editorStateAtom, newState);
});

/** Supprimer un nœud */
export const deleteNodeAtom = atom(null, (get, set, nodeId: string) => {
  const state = get(editorStateAtom);

  const newState = saveToHistory({
    ...state,
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    connections: state.connections.filter(
      (c) => c.sourceId !== nodeId && c.targetId !== nodeId
    ),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
  });

  set(editorStateAtom, newState);
});

/** Déplacer un nœud */
export const moveNodeAtom = atom(null, (get, set, { id, position }: { id: string; position: Position }) => {
  const state = get(editorStateAtom);

  set(editorStateAtom, {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === id ? { ...n, position } : n
    ),
    isDirty: true,
  });
});

/** Sélectionner un nœud */
export const selectNodeAtom = atom(null, (get, set, nodeId: string | null) => {
  const state = get(editorStateAtom);

  set(editorStateAtom, {
    ...state,
    selectedNodeId: nodeId,
    selectedConnectionId: nodeId ? null : state.selectedConnectionId,
  });
});

/** Mettre à jour les données d'un nœud */
export const updateNodeDataAtom = atom(null, (get, set, { id, data }: { id: string; data: Partial<ScenarioStep> }) => {
  const state = get(editorStateAtom);

  const newState = saveToHistory({
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...data } } : n
    ),
  });

  set(editorStateAtom, newState);
});

/** Ajouter une connexion */
export const addConnectionAtom = atom(null, (get, set, { sourceId, targetId }: { sourceId: string; targetId: string }) => {
  const state = get(editorStateAtom);

  // Vérifier que la connexion n'existe pas déjà
  const exists = state.connections.some(
    (c) => c.sourceId === sourceId && c.targetId === targetId
  );

  if (exists || sourceId === targetId) return;

  const newConnection: EditorConnection = {
    id: generateId(),
    sourceId,
    targetId,
  };

  const newState = saveToHistory({
    ...state,
    connections: [...state.connections, newConnection],
    connectingFromId: null,
    mode: 'select',
  });

  set(editorStateAtom, newState);
});

/** Supprimer une connexion */
export const deleteConnectionAtom = atom(null, (get, set, connectionId: string) => {
  const state = get(editorStateAtom);

  const newState = saveToHistory({
    ...state,
    connections: state.connections.filter((c) => c.id !== connectionId),
    selectedConnectionId: state.selectedConnectionId === connectionId ? null : state.selectedConnectionId,
  });

  set(editorStateAtom, newState);
});

/** Commencer une connexion */
export const startConnectingAtom = atom(null, (get, set, fromId: string) => {
  const state = get(editorStateAtom);

  set(editorStateAtom, {
    ...state,
    connectingFromId: fromId,
    mode: 'connect',
  });
});

/** Annuler la connexion en cours */
export const cancelConnectingAtom = atom(null, (get, set) => {
  const state = get(editorStateAtom);

  set(editorStateAtom, {
    ...state,
    connectingFromId: null,
    mode: 'select',
  });
});

/** Mettre à jour les métadonnées */
export const updateMetadataAtom = atom(null, (get, set, metadata: Partial<ScenarioMetadata>) => {
  const state = get(editorStateAtom);

  const newState = saveToHistory({
    ...state,
    metadata: { ...state.metadata, ...metadata },
  });

  set(editorStateAtom, newState);
});

/** Mettre à jour le viewport */
export const updateViewportAtom = atom(null, (get, set, viewport: Partial<EditorState['viewport']>) => {
  const state = get(editorStateAtom);

  set(editorStateAtom, {
    ...state,
    viewport: { ...state.viewport, ...viewport },
  });
});

/** Undo */
export const undoAtom = atom(null, (get, set) => {
  const state = get(editorStateAtom);

  if (state.historyIndex <= 0) return;

  const entry = state.history[state.historyIndex - 1];

  set(editorStateAtom, {
    ...state,
    nodes: JSON.parse(JSON.stringify(entry.nodes)),
    connections: JSON.parse(JSON.stringify(entry.connections)),
    metadata: JSON.parse(JSON.stringify(entry.metadata)),
    historyIndex: state.historyIndex - 1,
    selectedNodeId: null,
    selectedConnectionId: null,
  });
});

/** Redo */
export const redoAtom = atom(null, (get, set) => {
  const state = get(editorStateAtom);

  if (state.historyIndex >= state.history.length - 1) return;

  const entry = state.history[state.historyIndex + 1];

  set(editorStateAtom, {
    ...state,
    nodes: JSON.parse(JSON.stringify(entry.nodes)),
    connections: JSON.parse(JSON.stringify(entry.connections)),
    metadata: JSON.parse(JSON.stringify(entry.metadata)),
    historyIndex: state.historyIndex + 1,
    selectedNodeId: null,
    selectedConnectionId: null,
  });
});

/** Charger un scénario existant pour édition */
export const loadScenarioForEditAtom = atom(null, (get, set, scenario: Scenario) => {
  // Convertir le scénario en nœuds et connexions
  const nodes: EditorStepNode[] = scenario.steps.map((step, index) => ({
    id: step.id,
    position: {
      x: 200 + (index % 3) * 300,
      y: 100 + Math.floor(index / 3) * 200,
    },
    type: 'step' as const,
    data: step,
  }));

  // Créer des connexions linéaires par défaut
  const connections: EditorConnection[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    connections.push({
      id: generateId(),
      sourceId: nodes[i].id,
      targetId: nodes[i + 1].id,
    });
  }

  set(editorStateAtom, {
    ...initialState,
    nodes,
    connections,
    metadata: scenario.metadata,
    editingScenarioId: scenario.metadata.id,
    history: [{
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections)),
      metadata: JSON.parse(JSON.stringify(scenario.metadata)),
    }],
    historyIndex: 0,
  });

  set(isEditorOpenAtom, true);
});

/** Convertir l'état de l'éditeur en Scenario */
export const exportScenarioAtom = atom((get) => {
  const state = get(editorStateAtom);

  // Ordonner les étapes selon les connexions
  const orderedSteps: ScenarioStep[] = [];
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));

  // Trouver le premier nœud (pas de connexion entrante ou nœud de départ)
  const incomingMap = new Map<string, number>();
  for (const node of state.nodes) {
    incomingMap.set(node.id, 0);
  }
  for (const conn of state.connections) {
    incomingMap.set(conn.targetId, (incomingMap.get(conn.targetId) || 0) + 1);
  }

  const startNodes = state.nodes.filter(
    (n) => (incomingMap.get(n.id) || 0) === 0 || n.type === 'start'
  );

  // Parcours en largeur pour ordonner
  const visited = new Set<string>();
  const queue = [...startNodes.map((n) => n.id)];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (node && node.data) {
      orderedSteps.push({
        id: node.data.id || node.id,
        title: node.data.title || 'Étape sans titre',
        description: node.data.description || '',
        nodeSelector: node.data.nodeSelector || { types: [] },
        actions: node.data.actions || ['highlight'],
        config: node.data.config,
        tips: node.data.tips,
        insights: node.data.insights,
      });
    }

    // Ajouter les successeurs
    for (const conn of state.connections) {
      if (conn.sourceId === nodeId && !visited.has(conn.targetId)) {
        queue.push(conn.targetId);
      }
    }
  }

  // Ajouter les nœuds non connectés
  for (const node of state.nodes) {
    if (!visited.has(node.id) && node.data) {
      orderedSteps.push({
        id: node.data.id || node.id,
        title: node.data.title || 'Étape sans titre',
        description: node.data.description || '',
        nodeSelector: node.data.nodeSelector || { types: [] },
        actions: node.data.actions || ['highlight'],
        config: node.data.config,
        tips: node.data.tips,
        insights: node.data.insights,
      });
    }
  }

  const scenario: Scenario = {
    metadata: {
      id: state.metadata.id || generateId(),
      title: state.metadata.title || 'Nouveau scénario',
      description: state.metadata.description || '',
      category: state.metadata.category || 'custom',
      color: state.metadata.color || '#6366f1',
      estimatedDuration: state.metadata.estimatedDuration || 10,
      tags: state.metadata.tags || [],
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    steps: orderedSteps,
  };

  return scenario;
});

/** Sauvegarder le scénario */
export const saveScenarioAtom = atom(null, (get, set) => {
  const scenario = get(exportScenarioAtom);
  const customScenarios = get(customScenariosAtom);
  const state = get(editorStateAtom);

  // Mettre à jour ou ajouter
  const existingIndex = customScenarios.findIndex(
    (s) => s.metadata.id === scenario.metadata.id
  );

  let newScenarios: Scenario[];
  if (existingIndex >= 0) {
    newScenarios = [...customScenarios];
    newScenarios[existingIndex] = scenario;
  } else {
    newScenarios = [...customScenarios, scenario];
  }

  set(customScenariosAtom, newScenarios);
  set(editorStateAtom, { ...state, isDirty: false });

  return scenario;
});

/** Supprimer un scénario personnalisé */
export const deleteCustomScenarioAtom = atom(null, (get, set, scenarioId: string) => {
  const customScenarios = get(customScenariosAtom);
  set(customScenariosAtom, customScenarios.filter((s) => s.metadata.id !== scenarioId));
});
