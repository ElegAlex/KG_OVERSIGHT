/**
 * KG-Oversight - Store Jotai pour les scénarios
 * Gestion de l'état du player et de la navigation
 */

import { atom } from 'jotai';
import type {
  Scenario,
  ScenarioStep,
  ScenarioPlayerState,
  ScenarioProgress,
  NodeSelector,
} from '../types/scenario';
import type { GraphNode, GraphEdge, NodeType, EdgeType } from '@data/types';

// =============================================================================
// Atoms de base
// =============================================================================

// Scénario actuellement chargé
export const currentScenarioAtom = atom<Scenario | null>(null);

// État du player
export const playerStateAtom = atom<ScenarioPlayerState>('idle');

// Index de l'étape courante
export const currentStepIndexAtom = atom<number>(0);

// Mode plein écran
export const isFullscreenAtom = atom<boolean>(false);

// Panel ouvert
export const isScenarioPanelOpenAtom = atom<boolean>(false);

// =============================================================================
// Atoms dérivés
// =============================================================================

// Étape courante
export const currentStepAtom = atom<ScenarioStep | null>((get) => {
  const scenario = get(currentScenarioAtom);
  const stepIndex = get(currentStepIndexAtom);

  if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) {
    return null;
  }

  return scenario.steps[stepIndex];
});

// Progression
export const progressAtom = atom<ScenarioProgress | null>((get) => {
  const scenario = get(currentScenarioAtom);
  const stepIndex = get(currentStepIndexAtom);
  const state = get(playerStateAtom);

  if (!scenario || state === 'idle') {
    return null;
  }

  return {
    scenarioId: scenario.metadata.id,
    currentStepIndex: stepIndex,
    totalSteps: scenario.steps.length,
    startedAt: new Date(),
    completedSteps: scenario.steps.slice(0, stepIndex).map((s) => s.id),
  };
});

// Peut aller à l'étape suivante
export const canGoNextAtom = atom<boolean>((get) => {
  const scenario = get(currentScenarioAtom);
  const stepIndex = get(currentStepIndexAtom);
  const state = get(playerStateAtom);

  if (!scenario || state === 'idle') return false;
  return stepIndex < scenario.steps.length - 1;
});

// Peut revenir à l'étape précédente
export const canGoPrevAtom = atom<boolean>((get) => {
  const stepIndex = get(currentStepIndexAtom);
  const state = get(playerStateAtom);

  if (state === 'idle') return false;
  return stepIndex > 0;
});

// =============================================================================
// Atoms d'actions
// =============================================================================

// Démarrer un scénario
export const startScenarioAtom = atom(null, (get, set, scenario: Scenario) => {
  set(currentScenarioAtom, scenario);
  set(currentStepIndexAtom, 0);
  set(playerStateAtom, 'playing');
  set(isScenarioPanelOpenAtom, true);
});

// Arrêter le scénario
export const stopScenarioAtom = atom(null, (get, set) => {
  set(currentScenarioAtom, null);
  set(currentStepIndexAtom, 0);
  set(playerStateAtom, 'idle');
  set(isFullscreenAtom, false);
});

// Étape suivante
export const nextStepAtom = atom(null, (get, set) => {
  const scenario = get(currentScenarioAtom);
  const stepIndex = get(currentStepIndexAtom);

  if (!scenario) return;

  if (stepIndex < scenario.steps.length - 1) {
    set(currentStepIndexAtom, stepIndex + 1);
  } else {
    set(playerStateAtom, 'completed');
  }
});

// Étape précédente
export const prevStepAtom = atom(null, (get, set) => {
  const stepIndex = get(currentStepIndexAtom);

  if (stepIndex > 0) {
    set(currentStepIndexAtom, stepIndex - 1);
    set(playerStateAtom, 'playing');
  }
});

// Aller à une étape spécifique
export const goToStepAtom = atom(null, (get, set, stepIndex: number) => {
  const scenario = get(currentScenarioAtom);

  if (!scenario) return;

  if (stepIndex >= 0 && stepIndex < scenario.steps.length) {
    set(currentStepIndexAtom, stepIndex);
    set(playerStateAtom, 'playing');
  }
});

// Toggle pause/play
export const togglePauseAtom = atom(null, (get, set) => {
  const state = get(playerStateAtom);

  if (state === 'playing') {
    set(playerStateAtom, 'paused');
  } else if (state === 'paused') {
    set(playerStateAtom, 'playing');
  }
});

// Toggle fullscreen
export const toggleFullscreenAtom = atom(null, (get, set) => {
  set(isFullscreenAtom, !get(isFullscreenAtom));
});

// =============================================================================
// Utilitaires de sélection de nœuds
// =============================================================================

/**
 * Résout un NodeSelector en liste d'IDs de nœuds
 */
export function resolveNodeSelector(
  selector: NodeSelector,
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>
): Set<string> {
  const result = new Set<string>();

  // Sélection par IDs
  if (selector.ids) {
    for (const id of selector.ids) {
      if (nodes.has(id)) {
        result.add(id);
      }
    }
  }

  // Sélection par types
  if (selector.types) {
    for (const [id, node] of nodes) {
      if (selector.types.includes(node._type)) {
        result.add(id);
      }
    }
  }

  // Sélection par attributs
  if (selector.where) {
    for (const [id, node] of nodes) {
      const nodeRecord = node as Record<string, unknown>;
      let matches = true;

      for (const condition of selector.where) {
        const value = nodeRecord[condition.field];

        switch (condition.operator) {
          case 'eq':
            matches = matches && value === condition.value;
            break;
          case 'neq':
            matches = matches && value !== condition.value;
            break;
          case 'contains':
            matches = matches && String(value).toLowerCase().includes(String(condition.value).toLowerCase());
            break;
          case 'gt':
            matches = matches && Number(value) > Number(condition.value);
            break;
          case 'lt':
            matches = matches && Number(value) < Number(condition.value);
            break;
          case 'in':
            matches = matches && Array.isArray(condition.value) && condition.value.includes(value);
            break;
        }
      }

      if (matches) {
        result.add(id);
      }
    }
  }

  // Sélection relative
  if (selector.relativeTo) {
    const { nodeId, relation, depth = 1, edgeTypes } = selector.relativeTo;

    if (nodes.has(nodeId)) {
      const visited = new Set<string>();
      const queue: { id: string; currentDepth: number }[] = [{ id: nodeId, currentDepth: 0 }];

      while (queue.length > 0) {
        const { id, currentDepth } = queue.shift()!;

        if (visited.has(id) || currentDepth > depth) continue;
        visited.add(id);

        if (currentDepth > 0) {
          result.add(id);
        }

        if (currentDepth < depth) {
          for (const [, edge] of edges) {
            // Filtrer par type de relation si spécifié
            if (edgeTypes && !edgeTypes.includes(edge._type)) continue;

            let neighborId: string | null = null;

            if (relation === 'neighbors' || relation === 'connected') {
              if (edge.source === id) neighborId = edge.target;
              else if (edge.target === id) neighborId = edge.source;
            } else if (relation === 'successors') {
              if (edge.source === id) neighborId = edge.target;
            } else if (relation === 'predecessors') {
              if (edge.target === id) neighborId = edge.source;
            }

            if (neighborId && !visited.has(neighborId)) {
              queue.push({ id: neighborId, currentDepth: currentDepth + 1 });
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * Atom pour les nœuds à highlight basé sur l'étape courante
 */
export const scenarioHighlightedNodesAtom = atom<Set<string>>((get) => {
  // Cet atom sera recalculé via un effet dans le composant
  // car il a besoin des données du graphe
  return new Set();
});
