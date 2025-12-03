/**
 * KG-Oversight - DataTablePagination
 * Contrôles de pagination pour la DataTable
 */

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

// =============================================================================
// Constantes
// =============================================================================

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

// =============================================================================
// Composant
// =============================================================================

export function DataTablePagination({
  page,
  pageSize,
  totalRows,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onFirstPage,
  onLastPage,
  onPreviousPage,
  onNextPage,
}: DataTablePaginationProps) {
  const startRow = (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRows);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalRows > 0 ? (
          <>
            Affichage de <span className="font-medium">{startRow}</span> à{' '}
            <span className="font-medium">{endRow}</span> sur{' '}
            <span className="font-medium">{totalRows}</span> résultat{totalRows > 1 ? 's' : ''}
          </>
        ) : (
          'Aucun résultat'
        )}
      </div>

      {/* Contrôles */}
      <div className="flex items-center gap-4">
        {/* Sélecteur de taille de page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Lignes par page :</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onFirstPage}
            disabled={!canGoPrevious}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Première page"
          >
            <ChevronsLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={!canGoPrevious}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Page précédente"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Numéro de page */}
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Page</span>
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={page}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= totalPages) {
                  onPageChange(value);
                }
              }}
              className="w-12 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              sur {totalPages || 1}
            </span>
          </div>

          <button
            type="button"
            onClick={onNextPage}
            disabled={!canGoNext}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Page suivante"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={onLastPage}
            disabled={!canGoNext}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Dernière page"
          >
            <ChevronsRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Export
// =============================================================================

export default DataTablePagination;
