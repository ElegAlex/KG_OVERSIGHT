/**
 * KG-Oversight - Types pour l'éditeur visuel de scénarios
 * Modélisation type entités-relations pour créer des scénarios
 */

import type { ScenarioStep, NodeSelector, ScenarioAction, ScenarioMetadata } from './scenario';

// =============================================================================
// Position et dimensions pour l'éditeur visuel
// =============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// =============================================================================
// Nœud d'étape dans l'éditeur (représentation visuelle d'une ScenarioStep)
// =============================================================================

export interface EditorStepNode {
  /** ID unique du nœud */
  id: string;

  /** Position dans le canvas */
  position: Position;

  /** Données de l'étape */
  data: Partial<ScenarioStep>;

  /** Type de nœud */
  type: 'step' | 'start' | 'end';

  /** État sélectionné */
  selected?: boolean;

  /** Dimensions calculées */
  size?: Size;
}

// =============================================================================
// Connexion entre étapes (transition)
// =============================================================================

export interface EditorConnection {
  /** ID unique de la connexion */
  id: string;

  /** ID du nœud source */
  sourceId: string;

  /** ID du nœud cible */
  targetId: string;

  /** Label optionnel (condition de transition) */
  label?: string;

  /** État sélectionné */
  selected?: boolean;
}

// =============================================================================
// État de l'éditeur
// =============================================================================

export type EditorMode = 'select' | 'add-step' | 'connect' | 'delete';

export interface EditorState {
  /** Mode d'édition actuel */
  mode: EditorMode;

  /** Nœuds d'étapes */
  nodes: EditorStepNode[];

  /** Connexions entre nœuds */
  connections: EditorConnection[];

  /** ID du nœud sélectionné */
  selectedNodeId: string | null;

  /** ID de la connexion sélectionnée */
  selectedConnectionId: string | null;

  /** Nœud en cours de connexion (mode connect) */
  connectingFromId: string | null;

  /** Métadonnées du scénario */
  metadata: Partial<ScenarioMetadata>;

  /** Historique pour undo/redo */
  history: EditorHistoryEntry[];
  historyIndex: number;

  /** Zoom et pan du canvas */
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
  };

  /** Scénario en cours d'édition (pour modification) */
  editingScenarioId: string | null;

  /** Modifications non sauvegardées */
  isDirty: boolean;
}

// =============================================================================
// Historique pour undo/redo
// =============================================================================

export interface EditorHistoryEntry {
  nodes: EditorStepNode[];
  connections: EditorConnection[];
  metadata: Partial<ScenarioMetadata>;
}

// =============================================================================
// Actions de l'éditeur
// =============================================================================

export type EditorAction =
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'ADD_NODE'; node: EditorStepNode }
  | { type: 'UPDATE_NODE'; id: string; updates: Partial<EditorStepNode> }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'MOVE_NODE'; id: string; position: Position }
  | { type: 'SELECT_NODE'; id: string | null }
  | { type: 'ADD_CONNECTION'; connection: EditorConnection }
  | { type: 'DELETE_CONNECTION'; id: string }
  | { type: 'SELECT_CONNECTION'; id: string | null }
  | { type: 'START_CONNECTING'; fromId: string }
  | { type: 'CANCEL_CONNECTING' }
  | { type: 'UPDATE_METADATA'; metadata: Partial<ScenarioMetadata> }
  | { type: 'UPDATE_STEP_DATA'; nodeId: string; data: Partial<ScenarioStep> }
  | { type: 'SET_VIEWPORT'; viewport: EditorState['viewport'] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' }
  | { type: 'LOAD_SCENARIO'; scenarioId: string; nodes: EditorStepNode[]; connections: EditorConnection[]; metadata: Partial<ScenarioMetadata> }
  | { type: 'MARK_SAVED' };

// =============================================================================
// Configuration de l'étape (panneau latéral)
// =============================================================================

export interface StepConfigPanelProps {
  node: EditorStepNode;
  onUpdate: (data: Partial<ScenarioStep>) => void;
  onClose: () => void;
}

// =============================================================================
// Templates d'étapes prédéfinis
// =============================================================================

export interface StepTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  defaultData: Partial<ScenarioStep>;
}

export const stepTemplates: StepTemplate[] = [
  {
    id: 'select-nodes',
    label: 'Sélection de nœuds',
    description: 'Sélectionner des nœuds par type ou attribut',
    icon: 'MousePointer',
    defaultData: {
      title: 'Sélection',
      description: 'Sélectionnez les éléments...',
      nodeSelector: { types: [] },
      actions: ['highlight', 'focus'],
    },
  },
  {
    id: 'filter-view',
    label: 'Filtrage de la vue',
    description: 'Filtrer pour n\'afficher que certains nœuds',
    icon: 'Filter',
    defaultData: {
      title: 'Filtrage',
      description: 'Filtrez la vue pour...',
      nodeSelector: { types: [] },
      actions: ['filter'],
      config: { autoZoom: true },
    },
  },
  {
    id: 'expand-neighbors',
    label: 'Expansion des voisins',
    description: 'Développer les connexions d\'un nœud',
    icon: 'Maximize2',
    defaultData: {
      title: 'Expansion',
      description: 'Explorez les connexions...',
      nodeSelector: { relativeTo: { nodeId: '', relation: 'neighbors', depth: 1 } },
      actions: ['expand', 'highlight'],
    },
  },
  {
    id: 'annotate',
    label: 'Annotation',
    description: 'Ajouter une annotation explicative',
    icon: 'MessageSquare',
    defaultData: {
      title: 'Information',
      description: 'Point d\'attention...',
      nodeSelector: { ids: [] },
      actions: ['annotate'],
      config: { annotation: { text: '', position: 'top' } },
    },
  },
  {
    id: 'analysis',
    label: 'Analyse',
    description: 'Étape d\'analyse avec insights',
    icon: 'BarChart3',
    defaultData: {
      title: 'Analyse',
      description: 'Analysez les données...',
      nodeSelector: { types: [] },
      actions: ['highlight'],
      insights: [],
    },
  },
];

// =============================================================================
// Conversion éditeur <-> Scenario
// =============================================================================

export interface EditorToScenarioResult {
  success: boolean;
  scenario?: import('./scenario').Scenario;
  errors?: string[];
}
