/**
 * KG-Oversight - Store Jotai pour l'éditeur de scénarios ERD
 * Gestion de l'état de l'éditeur basé sur le modèle entités-relations
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { NodeType, EdgeType } from '@data/types/entities';
import type { Scenario, ScenarioStep, ScenarioMetadata } from '../types/scenario';
import { schemaEntities, schemaRelations, getEntityByType } from '../data/schemaDefinition';

// =============================================================================
// Types pour l'éditeur ERD
// =============================================================================

/** Étape du parcours ERD */
export interface ERDPathStep {
  id: string;
  entityType: NodeType;
  relationToNext?: EdgeType;
  filters?: {
    field: string;
    operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in';
    value: string | number | boolean | string[];
  }[];
  description?: string;
}

/** État de l'éditeur ERD */
export interface ERDEditorState {
  /** Parcours défini (séquence d'entités et relations) */
  path: ERDPathStep[];

  /** Entité sélectionnée pour ajout */
  selectedEntityType: NodeType | null;

  /** Relation sélectionnée pour ajout */
  selectedRelationType: EdgeType | null;

  /** Étape en cours d'édition */
  editingStepId: string | null;

  /** Métadonnées du scénario */
  metadata: Partial<ScenarioMetadata>;

  /** Mode d'affichage du schéma */
  schemaViewMode: 'full' | 'connected';

  /** Entités highlightées dans le schéma */
  highlightedEntities: Set<NodeType>;

  /** Modifications non sauvegardées */
  isDirty: boolean;

  /** ID du scénario en cours d'édition */
  editingScenarioId: string | null;
}

// =============================================================================
// État initial
// =============================================================================

const initialState: ERDEditorState = {
  path: [],
  selectedEntityType: null,
  selectedRelationType: null,
  editingStepId: null,
  metadata: {
    id: '',
    title: '',
    description: '',
    category: 'custom',
    color: '#6366f1',
    estimatedDuration: 10,
    tags: [],
  },
  schemaViewMode: 'full',
  highlightedEntities: new Set(),
  isDirty: false,
  editingScenarioId: null,
};

// =============================================================================
// Atoms de base
// =============================================================================

/** État de l'éditeur ERD */
export const erdEditorStateAtom = atom<ERDEditorState>(initialState);

/** Éditeur ERD ouvert */
export const isERDEditorOpenAtom = atom<boolean>(false);

/** Scénarios ERD personnalisés sauvegardés */
export const erdCustomScenariosAtom = atomWithStorage<Scenario[]>('kg-oversight-erd-scenarios', []);

// =============================================================================
// Atoms dérivés
// =============================================================================

/** Parcours actuel */
export const erdPathAtom = atom((get) => get(erdEditorStateAtom).path);

/** Métadonnées */
export const erdMetadataAtom = atom((get) => get(erdEditorStateAtom).metadata);

/** Entités dans le parcours */
export const pathEntitiesAtom = atom((get) => {
  const state = get(erdEditorStateAtom);
  return state.path.map((step) => step.entityType);
});

/** Relations dans le parcours */
export const pathRelationsAtom = atom((get) => {
  const state = get(erdEditorStateAtom);
  return state.path
    .filter((step) => step.relationToNext)
    .map((step) => step.relationToNext!);
});

/** Dernière entité du parcours */
export const lastEntityInPathAtom = atom((get) => {
  const state = get(erdEditorStateAtom);
  if (state.path.length === 0) return null;
  return state.path[state.path.length - 1].entityType;
});

/** Relations disponibles depuis la dernière entité */
export const availableRelationsAtom = atom((get) => {
  const lastEntity = get(lastEntityInPathAtom);
  if (!lastEntity) return schemaRelations;

  return schemaRelations.filter(
    (rel) => rel.source === lastEntity || rel.target === lastEntity
  );
});

/** Entités connectées à la dernière entité */
export const connectedEntitiesAtom = atom((get) => {
  const lastEntity = get(lastEntityInPathAtom);
  if (!lastEntity) return schemaEntities;

  const connected = new Set<NodeType>();
  for (const rel of schemaRelations) {
    if (rel.source === lastEntity) connected.add(rel.target);
    if (rel.target === lastEntity) connected.add(rel.source);
  }

  return schemaEntities.filter((e) => connected.has(e.type));
});

/** Le scénario est valide pour export */
export const isERDScenarioValidAtom = atom((get) => {
  const state = get(erdEditorStateAtom);

  if (!state.metadata.title || state.metadata.title.trim() === '') return false;
  if (state.path.length < 2) return false;

  return true;
});

// =============================================================================
// Helpers
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// Actions
// =============================================================================

/** Ouvrir l'éditeur ERD */
export const openERDEditorAtom = atom(null, (get, set) => {
  set(isERDEditorOpenAtom, true);
});

/** Fermer l'éditeur ERD */
export const closeERDEditorAtom = atom(null, (get, set) => {
  set(isERDEditorOpenAtom, false);
});

/** Réinitialiser l'éditeur */
export const resetERDEditorAtom = atom(null, (get, set) => {
  set(erdEditorStateAtom, {
    ...initialState,
    metadata: {
      ...initialState.metadata,
      id: generateId(),
    },
    highlightedEntities: new Set(),
  });
});

/** Ajouter une entité au parcours */
export const addEntityToPathAtom = atom(null, (get, set, entityType: NodeType) => {
  const state = get(erdEditorStateAtom);
  const entity = getEntityByType(entityType);

  const newStep: ERDPathStep = {
    id: generateId(),
    entityType,
    description: entity?.description || '',
  };

  // Si ce n'est pas la première étape, trouver la relation
  if (state.path.length > 0) {
    const lastStep = state.path[state.path.length - 1];
    const relation = schemaRelations.find(
      (r) =>
        (r.source === lastStep.entityType && r.target === entityType) ||
        (r.target === lastStep.entityType && r.source === entityType)
    );

    if (relation) {
      // Mettre à jour l'étape précédente avec la relation
      const updatedPath = [...state.path];
      updatedPath[updatedPath.length - 1] = {
        ...lastStep,
        relationToNext: relation.type,
      };

      set(erdEditorStateAtom, {
        ...state,
        path: [...updatedPath, newStep],
        isDirty: true,
        highlightedEntities: new Set([...state.path.map((s) => s.entityType), entityType]),
      });
      return;
    }
  }

  set(erdEditorStateAtom, {
    ...state,
    path: [...state.path, newStep],
    isDirty: true,
    highlightedEntities: new Set([...state.path.map((s) => s.entityType), entityType]),
  });
});

/** Supprimer une étape du parcours */
export const removeStepFromPathAtom = atom(null, (get, set, stepId: string) => {
  const state = get(erdEditorStateAtom);
  const stepIndex = state.path.findIndex((s) => s.id === stepId);

  if (stepIndex === -1) return;

  const newPath = state.path.filter((s) => s.id !== stepId);

  // Si on supprime une étape au milieu, enlever la relation de l'étape précédente
  if (stepIndex > 0 && stepIndex < state.path.length - 1) {
    newPath[stepIndex - 1] = {
      ...newPath[stepIndex - 1],
      relationToNext: undefined,
    };
  }

  // Recalculer les relations
  for (let i = 0; i < newPath.length - 1; i++) {
    const relation = schemaRelations.find(
      (r) =>
        (r.source === newPath[i].entityType && r.target === newPath[i + 1].entityType) ||
        (r.target === newPath[i].entityType && r.source === newPath[i + 1].entityType)
    );
    newPath[i] = {
      ...newPath[i],
      relationToNext: relation?.type,
    };
  }

  // Enlever la relation de la dernière étape
  if (newPath.length > 0) {
    newPath[newPath.length - 1] = {
      ...newPath[newPath.length - 1],
      relationToNext: undefined,
    };
  }

  set(erdEditorStateAtom, {
    ...state,
    path: newPath,
    isDirty: true,
    highlightedEntities: new Set(newPath.map((s) => s.entityType)),
  });
});

/** Mettre à jour une étape */
export const updateStepAtom = atom(null, (get, set, { stepId, updates }: { stepId: string; updates: Partial<ERDPathStep> }) => {
  const state = get(erdEditorStateAtom);

  set(erdEditorStateAtom, {
    ...state,
    path: state.path.map((step) =>
      step.id === stepId ? { ...step, ...updates } : step
    ),
    isDirty: true,
  });
});

/** Sélectionner une étape pour édition */
export const selectStepForEditAtom = atom(null, (get, set, stepId: string | null) => {
  const state = get(erdEditorStateAtom);

  set(erdEditorStateAtom, {
    ...state,
    editingStepId: stepId,
  });
});

/** Mettre à jour les métadonnées */
export const updateERDMetadataAtom = atom(null, (get, set, metadata: Partial<ScenarioMetadata>) => {
  const state = get(erdEditorStateAtom);

  set(erdEditorStateAtom, {
    ...state,
    metadata: { ...state.metadata, ...metadata },
    isDirty: true,
  });
});

/** Changer le mode de vue du schéma */
export const setSchemaViewModeAtom = atom(null, (get, set, mode: 'full' | 'connected') => {
  const state = get(erdEditorStateAtom);

  set(erdEditorStateAtom, {
    ...state,
    schemaViewMode: mode,
  });
});

/** Convertir le parcours ERD en Scenario exécutable */
export const exportERDScenarioAtom = atom((get) => {
  const state = get(erdEditorStateAtom);

  const steps: ScenarioStep[] = state.path.map((pathStep, index) => {
    const entity = getEntityByType(pathStep.entityType);
    const isFirst = index === 0;
    const isLast = index === state.path.length - 1;

    // Construire le NodeSelector
    const nodeSelector: ScenarioStep['nodeSelector'] = {
      types: [pathStep.entityType],
    };

    // Ajouter les filtres si présents
    if (pathStep.filters && pathStep.filters.length > 0) {
      nodeSelector.where = pathStep.filters;
    }

    // Si ce n'est pas la première étape, utiliser la relation pour le contexte
    if (!isFirst && state.path[index - 1].relationToNext) {
      // On pourrait ajouter une logique de sélection relative ici
    }

    return {
      id: pathStep.id,
      title: `${entity?.label || pathStep.entityType}`,
      description: pathStep.description || entity?.description || '',
      nodeSelector,
      actions: isFirst ? ['highlight', 'filter', 'focus'] : ['highlight', 'expand', 'focus'],
      config: {
        autoZoom: true,
        showEdges: true,
        highlightColor: entity?.color || '#6366f1',
      },
      tips: isLast
        ? ['Fin du parcours - analysez les éléments affichés']
        : [`Prochaine étape: ${getEntityByType(state.path[index + 1]?.entityType)?.label || 'Suivant'}`],
    };
  });

  const scenario: Scenario = {
    metadata: {
      id: state.metadata.id || generateId(),
      title: state.metadata.title || 'Scénario ERD',
      description: state.metadata.description || `Parcours: ${state.path.map((s) => getEntityByType(s.entityType)?.label).join(' → ')}`,
      category: state.metadata.category || 'custom',
      color: state.metadata.color || '#6366f1',
      estimatedDuration: state.metadata.estimatedDuration || state.path.length * 2,
      tags: [...(state.metadata.tags || []), 'ERD', 'modélisation'],
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    steps,
  };

  return scenario;
});

/** Sauvegarder le scénario ERD */
export const saveERDScenarioAtom = atom(null, (get, set) => {
  const scenario = get(exportERDScenarioAtom);
  const customScenarios = get(erdCustomScenariosAtom);
  const state = get(erdEditorStateAtom);

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

  set(erdCustomScenariosAtom, newScenarios);
  set(erdEditorStateAtom, { ...state, isDirty: false });

  return scenario;
});

/** Charger un scénario ERD existant pour édition */
export const loadERDScenarioForEditAtom = atom(null, (get, set, scenario: Scenario) => {
  // Reconstruire le parcours depuis les steps
  const path: ERDPathStep[] = scenario.steps.map((step, index) => {
    const entityType = step.nodeSelector.types?.[0] as NodeType;

    // Trouver la relation vers l'étape suivante
    let relationToNext: EdgeType | undefined;
    if (index < scenario.steps.length - 1) {
      const nextEntityType = scenario.steps[index + 1].nodeSelector.types?.[0] as NodeType;
      const relation = schemaRelations.find(
        (r) =>
          (r.source === entityType && r.target === nextEntityType) ||
          (r.target === entityType && r.source === nextEntityType)
      );
      relationToNext = relation?.type;
    }

    return {
      id: step.id,
      entityType,
      relationToNext,
      filters: step.nodeSelector.where,
      description: step.description,
    };
  });

  set(erdEditorStateAtom, {
    ...initialState,
    path,
    metadata: scenario.metadata,
    editingScenarioId: scenario.metadata.id,
    highlightedEntities: new Set(path.map((s) => s.entityType)),
  });

  set(isERDEditorOpenAtom, true);
});

/** Supprimer un scénario ERD */
export const deleteERDScenarioAtom = atom(null, (get, set, scenarioId: string) => {
  const customScenarios = get(erdCustomScenariosAtom);
  set(erdCustomScenariosAtom, customScenarios.filter((s) => s.metadata.id !== scenarioId));
});
