/**
 * KG-Oversight - Types pour les scénarios guidés
 * Définition du schéma JSON pour les scénarios de navigation
 */

import type { NodeType, EdgeType } from '@data/types';

// =============================================================================
// Types de base
// =============================================================================

/**
 * Action à effectuer sur un nœud ou groupe de nœuds
 */
export type ScenarioAction =
  | 'highlight'      // Mettre en surbrillance
  | 'select'         // Sélectionner le nœud
  | 'focus'          // Centrer la caméra sur le nœud
  | 'expand'         // Développer les voisins
  | 'filter'         // Filtrer pour n'afficher que ces nœuds
  | 'annotate';      // Afficher une annotation

/**
 * Critère de sélection des nœuds pour une étape
 */
export interface NodeSelector {
  // Sélection par ID(s) spécifique(s)
  ids?: string[];

  // Sélection par type(s)
  types?: NodeType[];

  // Sélection par attributs
  where?: {
    field: string;
    operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in';
    value: string | number | boolean | string[];
  }[];

  // Sélection relative à un nœud
  relativeTo?: {
    nodeId: string;
    relation: 'neighbors' | 'predecessors' | 'successors' | 'connected';
    depth?: number;
    edgeTypes?: EdgeType[];
  };
}

/**
 * Étape d'un scénario
 */
export interface ScenarioStep {
  id: string;

  // Titre et description
  title: string;
  description: string;

  // Sélection des nœuds concernés
  nodeSelector: NodeSelector;

  // Actions à effectuer
  actions: ScenarioAction[];

  // Configuration optionnelle
  config?: {
    // Durée d'animation en ms
    animationDuration?: number;

    // Zoom automatique pour englober tous les nœuds
    autoZoom?: boolean;

    // Couleur de highlight personnalisée
    highlightColor?: string;

    // Afficher les relations entre nœuds sélectionnés
    showEdges?: boolean;

    // Annotation à afficher
    annotation?: {
      text: string;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
  };

  // Conseils pour l'utilisateur
  tips?: string[];

  // Données supplémentaires à afficher
  insights?: {
    label: string;
    value: string | number;
    severity?: 'info' | 'warning' | 'critical';
  }[];
}

/**
 * Métadonnées d'un scénario
 */
export interface ScenarioMetadata {
  // Identifiant unique
  id: string;

  // Informations générales
  title: string;
  description: string;

  // Catégorie
  category: 'inspection' | 'audit' | 'risk' | 'monitoring' | 'custom';

  // Icône (nom Lucide)
  icon?: string;

  // Couleur thématique
  color?: string;

  // Temps estimé en minutes
  estimatedDuration?: number;

  // Auteur et version
  author?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;

  // Tags pour la recherche
  tags?: string[];
}

/**
 * Étape ERD pour la visualisation
 */
export interface ERDPathStepForViewer {
  id: string;
  entityType: NodeType;
  relationToNext?: EdgeType;
  description?: string;
}

/**
 * Scénario complet
 */
export interface Scenario {
  metadata: ScenarioMetadata;

  // Prérequis (nœuds ou données nécessaires)
  prerequisites?: {
    requiredTypes?: NodeType[];
    requiredNodes?: string[];
    description?: string;
  };

  // Point de départ optionnel
  startNodeSelector?: NodeSelector;

  // Étapes du scénario
  steps: ScenarioStep[];

  // Parcours ERD original (pour visualisation ERD)
  erdPath?: ERDPathStepForViewer[];
}

// =============================================================================
// Types pour l'état du player
// =============================================================================

export type ScenarioPlayerState = 'idle' | 'playing' | 'paused' | 'completed';

export interface ScenarioProgress {
  scenarioId: string;
  currentStepIndex: number;
  totalSteps: number;
  startedAt: Date;
  completedSteps: string[];
}

export interface ScenarioPlayerContext {
  scenario: Scenario | null;
  state: ScenarioPlayerState;
  progress: ScenarioProgress | null;
  isFullscreen: boolean;
  highlightedNodeIds: Set<string>;
  selectedNodeIds: Set<string>;
}

// =============================================================================
// Types pour les événements
// =============================================================================

export type ScenarioEvent =
  | { type: 'START'; scenario: Scenario }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; stepIndex: number }
  | { type: 'STOP' }
  | { type: 'TOGGLE_FULLSCREEN' };
