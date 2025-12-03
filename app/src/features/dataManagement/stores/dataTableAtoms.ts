/**
 * KG-Oversight - DataTable Atoms
 * Store Jotai pour la vue tabulaire des données
 *
 * Gère l'état de la DataTable :
 * - Type d'entité affiché
 * - Tri et filtres
 * - Sélection multiple
 * - Pagination
 * - Cellule en cours d'édition
 */

import { atom } from 'jotai';
import type { NodeType } from '@data/types';

// =============================================================================
// Types
// =============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface FilterConfig {
  column: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean | null;
}

export interface EditingCell {
  rowId: string;
  column: string;
  originalValue: unknown;
}

export interface DataTableState {
  /** Type d'entité actuellement affiché */
  selectedType: NodeType;
  /** Configuration du tri (multi-colonnes) */
  sortConfigs: SortConfig[];
  /** Filtres actifs */
  filters: FilterConfig[];
  /** IDs des lignes sélectionnées */
  selectedRows: Set<string>;
  /** Pagination */
  page: number;
  pageSize: number;
  /** Cellule en cours d'édition */
  editingCell: EditingCell | null;
  /** Recherche textuelle globale */
  searchQuery: string;
  /** Colonnes visibles (par type) */
  visibleColumns: Record<string, string[]>;
  /** Largeurs des colonnes */
  columnWidths: Record<string, number>;
  /** Mode d'affichage compact */
  compactMode: boolean;
}

// =============================================================================
// Valeurs par défaut
// =============================================================================

const DEFAULT_PAGE_SIZE = 50;

const DEFAULT_STATE: DataTableState = {
  selectedType: null as unknown as NodeType, // null = tous les types
  sortConfigs: [],
  filters: [],
  selectedRows: new Set(),
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  editingCell: null,
  searchQuery: '',
  visibleColumns: {},
  columnWidths: {},
  compactMode: false,
};

// =============================================================================
// Atoms principaux
// =============================================================================

/**
 * État principal de la DataTable
 */
export const dataTableStateAtom = atom<DataTableState>(DEFAULT_STATE);

/**
 * Type d'entité sélectionné
 */
export const selectedTypeAtom = atom(
  (get) => get(dataTableStateAtom).selectedType,
  (get, set, type: NodeType) => {
    set(dataTableStateAtom, {
      ...get(dataTableStateAtom),
      selectedType: type,
      page: 1, // Reset page on type change
      selectedRows: new Set(), // Clear selection
      editingCell: null, // Cancel editing
    });
  }
);

/**
 * Configuration du tri
 */
export const sortConfigsAtom = atom(
  (get) => get(dataTableStateAtom).sortConfigs,
  (get, set, configs: SortConfig[]) => {
    set(dataTableStateAtom, {
      ...get(dataTableStateAtom),
      sortConfigs: configs,
    });
  }
);

/**
 * Filtres actifs
 */
export const filtersAtom = atom(
  (get) => get(dataTableStateAtom).filters,
  (get, set, filters: FilterConfig[]) => {
    set(dataTableStateAtom, {
      ...get(dataTableStateAtom),
      filters,
      page: 1, // Reset page on filter change
    });
  }
);

/**
 * Lignes sélectionnées
 */
export const selectedRowsAtom = atom(
  (get) => get(dataTableStateAtom).selectedRows,
  (get, set, rows: Set<string>) => {
    set(dataTableStateAtom, {
      ...get(dataTableStateAtom),
      selectedRows: rows,
    });
  }
);

/**
 * Pagination
 */
export const paginationAtom = atom(
  (get) => ({
    page: get(dataTableStateAtom).page,
    pageSize: get(dataTableStateAtom).pageSize,
  }),
  (get, set, pagination: { page?: number; pageSize?: number }) => {
    const state = get(dataTableStateAtom);
    set(dataTableStateAtom, {
      ...state,
      page: pagination.page ?? state.page,
      pageSize: pagination.pageSize ?? state.pageSize,
    });
  }
);

/**
 * Cellule en cours d'édition
 */
export const editingCellAtom = atom(
  (get) => get(dataTableStateAtom).editingCell,
  (get, set, cell: EditingCell | null) => {
    set(dataTableStateAtom, {
      ...get(dataTableStateAtom),
      editingCell: cell,
    });
  }
);

/**
 * Recherche textuelle
 */
export const searchQueryAtom = atom(
  (get) => get(dataTableStateAtom).searchQuery,
  (get, set, query: string) => {
    set(dataTableStateAtom, {
      ...get(dataTableStateAtom),
      searchQuery: query,
      page: 1, // Reset page on search
    });
  }
);

/**
 * Mode compact
 */
export const compactModeAtom = atom(
  (get) => get(dataTableStateAtom).compactMode,
  (get, set, compact: boolean) => {
    set(dataTableStateAtom, {
      ...get(dataTableStateAtom),
      compactMode: compact,
    });
  }
);

// =============================================================================
// Atoms dérivés
// =============================================================================

/**
 * Nombre de lignes sélectionnées
 */
export const selectedCountAtom = atom((get) => get(dataTableStateAtom).selectedRows.size);

/**
 * Vérifie si une ligne est sélectionnée
 */
export const isRowSelectedAtom = atom((get) => {
  const selectedRows = get(dataTableStateAtom).selectedRows;
  return (rowId: string) => selectedRows.has(rowId);
});

/**
 * Vérifie si une cellule est en cours d'édition
 */
export const isCellEditingAtom = atom((get) => {
  const editingCell = get(dataTableStateAtom).editingCell;
  return (rowId: string, column: string) =>
    editingCell?.rowId === rowId && editingCell?.column === column;
});

/**
 * Vérifie si des filtres sont actifs
 */
export const hasActiveFiltersAtom = atom(
  (get) =>
    get(dataTableStateAtom).filters.length > 0 ||
    get(dataTableStateAtom).searchQuery.length > 0
);

// =============================================================================
// Actions
// =============================================================================

/**
 * Toggle la sélection d'une ligne
 */
export const toggleRowSelectionAtom = atom(null, (get, set, rowId: string) => {
  const state = get(dataTableStateAtom);
  const newSelection = new Set(state.selectedRows);

  if (newSelection.has(rowId)) {
    newSelection.delete(rowId);
  } else {
    newSelection.add(rowId);
  }

  set(dataTableStateAtom, {
    ...state,
    selectedRows: newSelection,
  });
});

/**
 * Sélectionner toutes les lignes (de la page courante)
 */
export const selectAllRowsAtom = atom(null, (get, set, rowIds: string[]) => {
  const state = get(dataTableStateAtom);
  set(dataTableStateAtom, {
    ...state,
    selectedRows: new Set(rowIds),
  });
});

/**
 * Désélectionner toutes les lignes
 */
export const clearSelectionAtom = atom(null, (get, set) => {
  const state = get(dataTableStateAtom);
  set(dataTableStateAtom, {
    ...state,
    selectedRows: new Set(),
  });
});

/**
 * Toggle le tri sur une colonne
 */
export const toggleSortAtom = atom(null, (get, set, column: string, multiSort = false) => {
  const state = get(dataTableStateAtom);
  const existingIndex = state.sortConfigs.findIndex((s) => s.column === column);
  let newConfigs: SortConfig[];

  if (existingIndex >= 0) {
    const existing = state.sortConfigs[existingIndex];
    if (existing.direction === 'asc') {
      // asc -> desc
      newConfigs = [...state.sortConfigs];
      newConfigs[existingIndex] = { column, direction: 'desc' };
    } else if (existing.direction === 'desc') {
      // desc -> remove
      newConfigs = state.sortConfigs.filter((_, i) => i !== existingIndex);
    } else {
      // null -> asc
      newConfigs = [...state.sortConfigs];
      newConfigs[existingIndex] = { column, direction: 'asc' };
    }
  } else {
    // Add new sort
    if (multiSort) {
      newConfigs = [...state.sortConfigs, { column, direction: 'asc' }];
    } else {
      newConfigs = [{ column, direction: 'asc' }];
    }
  }

  set(dataTableStateAtom, {
    ...state,
    sortConfigs: newConfigs,
  });
});

/**
 * Ajouter un filtre
 */
export const addFilterAtom = atom(null, (get, set, filter: FilterConfig) => {
  const state = get(dataTableStateAtom);
  set(dataTableStateAtom, {
    ...state,
    filters: [...state.filters, filter],
    page: 1,
  });
});

/**
 * Supprimer un filtre
 */
export const removeFilterAtom = atom(null, (get, set, index: number) => {
  const state = get(dataTableStateAtom);
  set(dataTableStateAtom, {
    ...state,
    filters: state.filters.filter((_, i) => i !== index),
    page: 1,
  });
});

/**
 * Effacer tous les filtres
 */
export const clearFiltersAtom = atom(null, (get, set) => {
  const state = get(dataTableStateAtom);
  set(dataTableStateAtom, {
    ...state,
    filters: [],
    searchQuery: '',
    page: 1,
  });
});

/**
 * Démarrer l'édition d'une cellule
 */
export const startEditingAtom = atom(
  null,
  (get, set, rowId: string, column: string, originalValue: unknown) => {
    set(dataTableStateAtom, {
      ...get(dataTableStateAtom),
      editingCell: { rowId, column, originalValue },
    });
  }
);

/**
 * Annuler l'édition
 */
export const cancelEditingAtom = atom(null, (get, set) => {
  set(dataTableStateAtom, {
    ...get(dataTableStateAtom),
    editingCell: null,
  });
});

/**
 * Réinitialiser l'état de la DataTable
 */
export const resetDataTableAtom = atom(null, (_get, set) => {
  set(dataTableStateAtom, DEFAULT_STATE);
});

// =============================================================================
// Export
// =============================================================================

export default dataTableStateAtom;
