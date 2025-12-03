/**
 * KG-Oversight - Hook useDataTable
 * Logique pour la vue tabulaire des données
 *
 * Ce hook fournit :
 * - Filtrage et tri des données
 * - Pagination
 * - Sélection multiple
 * - Édition inline
 * - Export CSV
 */

import { useCallback, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { allNodesAtom, allEdgesAtom } from '@shared/stores/selectionAtoms';
import { addNotification } from '@shared/stores/notificationStore';
import type { GraphNode, NodeType } from '@data/types';
import { getEntitySchema } from '../constants/entitySchemas';
import { useDataMutations } from './useDataMutations';
import {
  dataTableStateAtom,
  selectedTypeAtom,
  sortConfigsAtom,
  filtersAtom,
  selectedRowsAtom,
  paginationAtom,
  editingCellAtom,
  searchQueryAtom,
  compactModeAtom,
  toggleRowSelectionAtom,
  selectAllRowsAtom,
  clearSelectionAtom,
  toggleSortAtom,
  addFilterAtom,
  removeFilterAtom,
  clearFiltersAtom,
  startEditingAtom,
  cancelEditingAtom,
  type SortConfig,
  type FilterConfig,
  type EditingCell,
} from '../stores/dataTableAtoms';

// =============================================================================
// Types
// =============================================================================

export interface ColumnDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  sortable: boolean;
  filterable: boolean;
  editable: boolean;
  width?: number;
  minWidth?: number;
  options?: { value: string | number; label: string }[];
}

export interface DataTableRow {
  id: string;
  data: GraphNode;
  isSelected: boolean;
}

export interface UseDataTableReturn {
  // État
  selectedType: NodeType;
  setSelectedType: (type: NodeType) => void;
  columns: ColumnDefinition[];
  rows: DataTableRow[];
  totalRows: number;
  totalPages: number;
  page: number;
  pageSize: number;
  selectedRows: Set<string>;
  selectedCount: number;
  editingCell: EditingCell | null;
  searchQuery: string;
  sortConfigs: SortConfig[];
  filters: FilterConfig[];
  compactMode: boolean;
  isLoading: boolean;

  // Actions de sélection
  toggleRowSelection: (rowId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isRowSelected: (rowId: string) => boolean;

  // Actions de tri/filtre
  toggleSort: (column: string, multiSort?: boolean) => void;
  addFilter: (filter: FilterConfig) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;

  // Actions de pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;

  // Actions d'édition
  startEditing: (rowId: string, column: string) => void;
  cancelEditing: () => void;
  saveCell: (value: unknown) => Promise<boolean>;

  // Actions sur la sélection
  deleteSelected: () => Promise<void>;
  duplicateSelected: () => Promise<void>;
  exportSelected: () => void;

  // Autres
  setCompactMode: (compact: boolean) => void;
  refreshData: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useDataTable(): UseDataTableReturn {
  // Stores
  const nodes = useAtomValue(allNodesAtom);
  const state = useAtomValue(dataTableStateAtom);

  // Atoms individuels
  const [selectedType, setSelectedType] = useAtom(selectedTypeAtom);
  const sortConfigs = useAtomValue(sortConfigsAtom);
  const filters = useAtomValue(filtersAtom);
  const selectedRows = useAtomValue(selectedRowsAtom);
  const [pagination, setPagination] = useAtom(paginationAtom);
  const editingCell = useAtomValue(editingCellAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [compactMode, setCompactMode] = useAtom(compactModeAtom);

  // Actions
  const toggleRowSelectionAction = useSetAtom(toggleRowSelectionAtom);
  const selectAllRowsAction = useSetAtom(selectAllRowsAtom);
  const clearSelectionAction = useSetAtom(clearSelectionAtom);
  const toggleSortAction = useSetAtom(toggleSortAtom);
  const addFilterAction = useSetAtom(addFilterAtom);
  const removeFilterAction = useSetAtom(removeFilterAtom);
  const clearFiltersAction = useSetAtom(clearFiltersAtom);
  const startEditingAction = useSetAtom(startEditingAtom);
  const cancelEditingAction = useSetAtom(cancelEditingAtom);

  // Mutations
  const { updateNode, deleteNodes, duplicateNode, state: mutationState } = useDataMutations();

  // ==========================================================================
  // Colonnes
  // ==========================================================================

  const columns = useMemo((): ColumnDefinition[] => {
    // Mode "tous les types" : colonnes communes
    // Note: certaines entités ont 'nom', d'autres ont 'description' comme identifiant principal
    // On utilise une colonne spéciale '_label' qui sera résolue dynamiquement
    if (!selectedType) {
      return [
        { key: '_type', label: 'Type', type: 'text', sortable: true, filterable: true, editable: false },
        { key: '_label', label: 'Libellé', type: 'text', sortable: true, filterable: true, editable: false },
        { key: 'statut', label: 'Statut', type: 'text', sortable: true, filterable: true, editable: false },
        { key: 'criticite', label: 'Criticité', type: 'text', sortable: true, filterable: true, editable: false },
        { key: 'source_donnees', label: 'Source', type: 'text', sortable: true, filterable: true, editable: false },
      ];
    }

    const schema = getEntitySchema(selectedType);
    if (!schema) return [];

    return schema.fields
      .filter((field) => field.name !== 'id' && field.name !== '_type')
      .map((field) => ({
        key: field.name,
        label: field.label,
        type: field.type === 'textarea' ? 'text' : field.type,
        sortable: ['text', 'number', 'date'].includes(field.type),
        filterable: true,
        editable: field.editable,
        options: field.options,
      }));
  }, [selectedType]);

  // ==========================================================================
  // Données filtrées et triées
  // ==========================================================================

  const filteredAndSortedData = useMemo(() => {
    // 1. Filtrer par type (null = tous les types)
    let data = Array.from(nodes.values());
    if (selectedType) {
      data = data.filter((node) => {
        const nodeType = node._type || node.type;
        return nodeType === selectedType;
      });
    }

    // 2. Appliquer la recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter((node) => {
        return Object.values(node).some((value) => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === 'number') {
            return value.toString().includes(query);
          }
          return false;
        });
      });
    }

    // 3. Appliquer les filtres
    for (const filter of filters) {
      data = data.filter((node) => {
        const value = (node as Record<string, unknown>)[filter.column];
        const filterValue = filter.value;

        switch (filter.operator) {
          case 'equals':
            return value === filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'gt':
            return typeof value === 'number' && value > Number(filterValue);
          case 'lt':
            return typeof value === 'number' && value < Number(filterValue);
          case 'gte':
            return typeof value === 'number' && value >= Number(filterValue);
          case 'lte':
            return typeof value === 'number' && value <= Number(filterValue);
          default:
            return true;
        }
      });
    }

    // Helper pour résoudre les colonnes virtuelles
    const resolveColumnValue = (node: GraphNode, columnKey: string): unknown => {
      const nodeRecord = node as Record<string, unknown>;
      if (columnKey === '_label') {
        return nodeRecord.nom ?? nodeRecord.description ?? '';
      }
      return nodeRecord[columnKey];
    };

    // 4. Appliquer le tri
    if (sortConfigs.length > 0) {
      data.sort((a, b) => {
        for (const sort of sortConfigs) {
          const aValue = resolveColumnValue(a, sort.column);
          const bValue = resolveColumnValue(b, sort.column);

          let comparison = 0;
          if (aValue === null || aValue === undefined) comparison = 1;
          else if (bValue === null || bValue === undefined) comparison = -1;
          else if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue, 'fr');
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else {
            comparison = String(aValue).localeCompare(String(bValue));
          }

          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    return data;
  }, [nodes, selectedType, searchQuery, filters, sortConfigs]);

  // ==========================================================================
  // Pagination
  // ==========================================================================

  const totalRows = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalRows / pagination.pageSize);

  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredAndSortedData.slice(start, end);
  }, [filteredAndSortedData, pagination.page, pagination.pageSize]);

  // ==========================================================================
  // Lignes avec état de sélection
  // ==========================================================================

  const rows = useMemo(
    (): DataTableRow[] =>
      paginatedData.map((node) => ({
        id: node.id,
        data: node,
        isSelected: selectedRows.has(node.id),
      })),
    [paginatedData, selectedRows]
  );

  // ==========================================================================
  // Actions
  // ==========================================================================

  const toggleRowSelection = useCallback(
    (rowId: string) => {
      toggleRowSelectionAction(rowId);
    },
    [toggleRowSelectionAction]
  );

  const selectAll = useCallback(() => {
    const allIds = paginatedData.map((node) => node.id);
    selectAllRowsAction(allIds);
  }, [paginatedData, selectAllRowsAction]);

  const clearSelection = useCallback(() => {
    clearSelectionAction();
  }, [clearSelectionAction]);

  const isRowSelected = useCallback(
    (rowId: string) => selectedRows.has(rowId),
    [selectedRows]
  );

  const toggleSort = useCallback(
    (column: string, multiSort = false) => {
      toggleSortAction(column, multiSort);
    },
    [toggleSortAction]
  );

  const addFilter = useCallback(
    (filter: FilterConfig) => {
      addFilterAction(filter);
    },
    [addFilterAction]
  );

  const removeFilter = useCallback(
    (index: number) => {
      removeFilterAction(index);
    },
    [removeFilterAction]
  );

  const clearFilters = useCallback(() => {
    clearFiltersAction();
  }, [clearFiltersAction]);

  // Pagination
  const setPage = useCallback(
    (page: number) => {
      setPagination({ page: Math.max(1, Math.min(page, totalPages)) });
    },
    [setPagination, totalPages]
  );

  const setPageSize = useCallback(
    (size: number) => {
      setPagination({ pageSize: size, page: 1 });
    },
    [setPagination]
  );

  const goToFirstPage = useCallback(() => setPage(1), [setPage]);
  const goToLastPage = useCallback(() => setPage(totalPages), [setPage, totalPages]);
  const goToPreviousPage = useCallback(
    () => setPage(pagination.page - 1),
    [setPage, pagination.page]
  );
  const goToNextPage = useCallback(
    () => setPage(pagination.page + 1),
    [setPage, pagination.page]
  );

  // Édition
  const startEditing = useCallback(
    (rowId: string, column: string) => {
      const node = nodes.get(rowId);
      if (node) {
        startEditingAction(rowId, column, (node as Record<string, unknown>)[column]);
      }
    },
    [nodes, startEditingAction]
  );

  const cancelEditing = useCallback(() => {
    cancelEditingAction();
  }, [cancelEditingAction]);

  const saveCell = useCallback(
    async (value: unknown): Promise<boolean> => {
      if (!editingCell) return false;

      const result = await updateNode(editingCell.rowId, {
        [editingCell.column]: value,
      });

      if (result.success) {
        cancelEditingAction();
        addNotification({
          type: 'success',
          message: 'Modification enregistrée',
        });
        return true;
      } else {
        addNotification({
          type: 'error',
          message: result.error?.message || 'Erreur lors de la modification',
        });
        return false;
      }
    },
    [editingCell, updateNode, cancelEditingAction]
  );

  // Actions groupées
  const deleteSelected = useCallback(async () => {
    if (selectedRows.size === 0) {
      addNotification({
        type: 'warning',
        message: 'Aucune ligne sélectionnée',
      });
      return;
    }

    const result = await deleteNodes(Array.from(selectedRows), { cascade: true });

    if (result.success && result.data) {
      clearSelectionAction();
      addNotification({
        type: 'success',
        message: `${result.data.deletedNodes.length} entité(s) supprimée(s)`,
      });
    }
  }, [selectedRows, deleteNodes, clearSelectionAction]);

  const duplicateSelected = useCallback(async () => {
    if (selectedRows.size === 0) {
      addNotification({
        type: 'warning',
        message: 'Aucune ligne sélectionnée',
      });
      return;
    }

    let successCount = 0;
    for (const nodeId of selectedRows) {
      const result = await duplicateNode(nodeId);
      if (result.success) successCount++;
    }

    addNotification({
      type: 'success',
      message: `${successCount} entité(s) dupliquée(s)`,
    });
  }, [selectedRows, duplicateNode]);

  const exportSelected = useCallback(() => {
    const selectedData =
      selectedRows.size > 0
        ? filteredAndSortedData.filter((node) => selectedRows.has(node.id))
        : filteredAndSortedData;

    if (selectedData.length === 0) {
      addNotification({
        type: 'warning',
        message: 'Aucune donnée à exporter',
      });
      return;
    }

    // Construire le CSV
    const headers = columns.map((col) => col.label);
    const csvRows = [headers.join(';')];

    for (const node of selectedData) {
      const nodeRecord = node as Record<string, unknown>;
      const row = columns.map((col) => {
        // Résolution des colonnes virtuelles
        let value: unknown;
        if (col.key === '_label') {
          value = nodeRecord.nom ?? nodeRecord.description ?? '';
        } else {
          value = nodeRecord[col.key];
        }
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(';')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      csvRows.push(row.join(';'));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedType}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      message: `${selectedData.length} ligne(s) exportée(s)`,
    });
  }, [selectedRows, filteredAndSortedData, columns, selectedType]);

  const refreshData = useCallback(() => {
    // Force refresh by triggering a re-render
    // The atoms will automatically update when nodes change
    addNotification({
      type: 'info',
      message: 'Données actualisées',
    });
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // État
    selectedType,
    setSelectedType,
    columns,
    rows,
    totalRows,
    totalPages,
    page: pagination.page,
    pageSize: pagination.pageSize,
    selectedRows,
    selectedCount: selectedRows.size,
    editingCell,
    searchQuery,
    sortConfigs,
    filters,
    compactMode,
    isLoading: mutationState.isLoading,

    // Actions de sélection
    toggleRowSelection,
    selectAll,
    clearSelection,
    isRowSelected,

    // Actions de tri/filtre
    toggleSort,
    addFilter,
    removeFilter,
    clearFilters,
    setSearchQuery,

    // Actions de pagination
    setPage,
    setPageSize,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,

    // Actions d'édition
    startEditing,
    cancelEditing,
    saveCell,

    // Actions sur la sélection
    deleteSelected,
    duplicateSelected,
    exportSelected,

    // Autres
    setCompactMode,
    refreshData,
  };
}

// =============================================================================
// Export
// =============================================================================

export default useDataTable;
