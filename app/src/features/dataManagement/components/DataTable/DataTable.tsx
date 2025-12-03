/**
 * KG-Oversight - DataTable
 * Vue tabulaire des entités du Knowledge Graph
 *
 * Fonctionnalités :
 * - Affichage par type d'entité
 * - Tri multi-colonnes
 * - Recherche textuelle
 * - Édition inline (double-clic)
 * - Sélection multiple
 * - Export CSV
 * - Pagination
 */

import { useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useDataTable } from '../../hooks/useDataTable';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTableRow } from './DataTableRow';
import { DataTablePagination } from './DataTablePagination';

// =============================================================================
// Types
// =============================================================================

interface DataTableProps {
  /** Classe CSS additionnelle */
  className?: string;
}

// =============================================================================
// Composant
// =============================================================================

export function DataTable({ className = '' }: DataTableProps) {
  const {
    // État
    selectedType,
    setSelectedType,
    columns,
    rows,
    totalRows,
    totalPages,
    page,
    pageSize,
    selectedRows,
    selectedCount,
    editingCell,
    searchQuery,
    sortConfigs,
    filters,
    compactMode,
    isLoading,

    // Actions de sélection
    toggleRowSelection,
    selectAll,
    clearSelection,

    // Actions de tri/filtre
    toggleSort,
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
  } = useDataTable();

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleSelectAll = useCallback(() => {
    if (selectedCount === rows.length && rows.length > 0) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selectedCount, rows.length, selectAll, clearSelection]);

  const getSortIcon = useCallback(
    (columnKey: string) => {
      const sortConfig = sortConfigs.find((s) => s.column === columnKey);
      if (!sortConfig) {
        return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
      }
      if (sortConfig.direction === 'asc') {
        return <ArrowUp className="w-4 h-4 text-blue-600" />;
      }
      return <ArrowDown className="w-4 h-4 text-blue-600" />;
    },
    [sortConfigs]
  );

  // ==========================================================================
  // Rendu
  // ==========================================================================

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-950 ${className}`}>
      {/* Toolbar */}
      <DataTableToolbar
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedCount}
        totalRows={totalRows}
        compactMode={compactMode}
        onCompactModeChange={setCompactMode}
        filters={filters}
        onClearFilters={clearFilters}
        onDeleteSelected={deleteSelected}
        onDuplicateSelected={duplicateSelected}
        onExport={exportSelected}
        onRefresh={refreshData}
        isLoading={isLoading}
      />

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 dark:bg-gray-800 text-left">
              {/* Checkbox header */}
              <th
                className={`border-r border-b border-gray-200 dark:border-gray-700 text-center ${compactMode ? 'p-1' : 'p-2'}`}
                style={{ width: 40 }}
              >
                <input
                  type="checkbox"
                  checked={selectedCount === rows.length && rows.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>

              {/* ID header */}
              <th
                className={`border-r border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 ${compactMode ? 'p-1 text-xs' : 'p-2 text-sm'}`}
                style={{ width: 150 }}
              >
                ID
              </th>

              {/* Column headers */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`border-r border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 ${compactMode ? 'p-1 text-xs' : 'p-2 text-sm'} ${column.sortable ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700' : ''}`}
                  style={{ minWidth: column.minWidth || 100 }}
                  onClick={() => column.sortable && toggleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate">{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="p-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {searchQuery || filters.length > 0
                    ? 'Aucun résultat ne correspond à vos critères'
                    : 'Aucune donnée disponible'}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <DataTableRow
                  key={row.id}
                  rowId={row.id}
                  data={row.data}
                  columns={columns}
                  isSelected={row.isSelected}
                  editingCell={editingCell}
                  rowIndex={index}
                  compact={compactMode}
                  onToggleSelection={toggleRowSelection}
                  onStartEdit={startEditing}
                  onSaveCell={saveCell}
                  onCancelEdit={cancelEditing}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        totalRows={totalRows}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onFirstPage={goToFirstPage}
        onLastPage={goToLastPage}
        onPreviousPage={goToPreviousPage}
        onNextPage={goToNextPage}
      />
    </div>
  );
}

// =============================================================================
// Export
// =============================================================================

export default DataTable;
