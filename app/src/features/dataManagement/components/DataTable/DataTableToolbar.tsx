/**
 * KG-Oversight - DataTableToolbar
 * Barre d'outils pour la DataTable
 *
 * Comprend :
 * - Sélecteur de type d'entité
 * - Recherche textuelle
 * - Actions groupées (supprimer, dupliquer, exporter)
 * - Toggle mode compact
 */

import { useState, type ChangeEvent } from 'react';
import {
  Search,
  Trash2,
  Copy,
  Download,
  RefreshCw,
  Rows3,
  Rows4,
  X,
  Filter,
} from 'lucide-react';
import type { NodeType } from '@data/types';
import { ENTITY_SCHEMAS, NODE_TYPE_GROUPS } from '../../constants/entitySchemas';
import type { FilterConfig } from '../../stores/dataTableAtoms';

// =============================================================================
// Types
// =============================================================================

interface DataTableToolbarProps {
  selectedType: NodeType;
  onTypeChange: (type: NodeType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  totalRows: number;
  compactMode: boolean;
  onCompactModeChange: (compact: boolean) => void;
  filters: FilterConfig[];
  onClearFilters: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onExport: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

// =============================================================================
// Composant
// =============================================================================

export function DataTableToolbar({
  selectedType,
  onTypeChange,
  searchQuery,
  onSearchChange,
  selectedCount,
  totalRows,
  compactMode,
  onCompactModeChange,
  filters,
  onClearFilters,
  onDeleteSelected,
  onDuplicateSelected,
  onExport,
  onRefresh,
  isLoading = false,
}: DataTableToolbarProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const hasFilters = filters.length > 0 || searchQuery.length > 0;

  const currentSchema = ENTITY_SCHEMAS[selectedType];

  return (
    <div className="flex flex-col gap-2 p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Ligne principale */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sélecteur de type */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentSchema?.color || '#6b7280' }}
            />
            <span className="font-medium">{currentSchema?.labelPlural || selectedType}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">({totalRows})</span>
          </button>

          {showTypeSelector && (
            <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
              {NODE_TYPE_GROUPS.map((group) => (
                <div key={group.name}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-900">
                    {group.name}
                  </div>
                  {group.types.map((type) => {
                    const schema = ENTITY_SCHEMAS[type as NodeType];
                    if (!schema) return null;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          onTypeChange(type as NodeType);
                          setShowTypeSelector(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          type === selectedType ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: schema.color }}
                        />
                        <span>{schema.labelPlural}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recherche */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Indicateur de sélection */}
          {selectedCount > 0 && (
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-2">
            <button
              type="button"
              onClick={onDuplicateSelected}
              disabled={selectedCount === 0 || isLoading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Dupliquer la sélection"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={selectedCount === 0 || isLoading}
              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Supprimer la sélection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={isLoading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
              title="Exporter en CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-2">
            {/* Mode compact */}
            <button
              type="button"
              onClick={() => onCompactModeChange(!compactMode)}
              className={`p-2 rounded ${
                compactMode
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={compactMode ? 'Mode normal' : 'Mode compact'}
            >
              {compactMode ? <Rows4 className="w-4 h-4" /> : <Rows3 className="w-4 h-4" />}
            </button>

            {/* Rafraîchir */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Ligne des filtres actifs */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtres actifs :</span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              Recherche: "{searchQuery}"
            </span>
          )}

          {filters.map((filter, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
            >
              {filter.column} {filter.operator} {String(filter.value)}
            </span>
          ))}

          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Effacer tout
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Export
// =============================================================================

export default DataTableToolbar;
