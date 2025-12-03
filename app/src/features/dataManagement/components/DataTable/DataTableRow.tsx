/**
 * KG-Oversight - DataTableRow
 * Ligne de la DataTable avec sélection et cellules éditables
 */

import { memo } from 'react';
import type { GraphNode } from '@data/types';
import type { ColumnDefinition } from '../../hooks/useDataTable';
import type { EditingCell } from '../../stores/dataTableAtoms';
import { DataTableCell } from './DataTableCell';

// =============================================================================
// Types
// =============================================================================

interface DataTableRowProps {
  rowId: string;
  data: GraphNode;
  columns: ColumnDefinition[];
  isSelected: boolean;
  editingCell: EditingCell | null;
  rowIndex: number;
  compact?: boolean;
  onToggleSelection: (rowId: string) => void;
  onStartEdit: (rowId: string, column: string) => void;
  onSaveCell: (value: unknown) => Promise<boolean>;
  onCancelEdit: () => void;
}

// =============================================================================
// Composant
// =============================================================================

export const DataTableRow = memo(function DataTableRow({
  rowId,
  data,
  columns,
  isSelected,
  editingCell,
  rowIndex,
  compact = false,
  onToggleSelection,
  onStartEdit,
  onSaveCell,
  onCancelEdit,
}: DataTableRowProps) {
  const isRowEditing = editingCell?.rowId === rowId;
  const rowBg = rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800';
  const selectedBg = isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : '';

  return (
    <tr
      className={`${rowBg} ${selectedBg} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
    >
      {/* Checkbox de sélection */}
      <td className={`border-r border-gray-200 dark:border-gray-700 text-center ${compact ? 'p-1' : 'p-2'}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(rowId)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      {/* ID */}
      <td
        className={`border-r border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-500 dark:text-gray-400 ${compact ? 'p-1' : 'p-2'}`}
        title={rowId}
      >
        {rowId.length > 20 ? `${rowId.slice(0, 20)}...` : rowId}
      </td>

      {/* Colonnes de données */}
      {columns.map((column, colIndex) => {
        // Accès dynamique aux propriétés (les données sont chargées depuis CSV)
        const nodeAsRecord = data as Record<string, unknown>;

        // Résolution des colonnes virtuelles
        let value: unknown;
        if (column.key === '_label') {
          // _label = nom || description (selon le type d'entité)
          value = nodeAsRecord.nom ?? nodeAsRecord.description ?? '';
        } else {
          value = nodeAsRecord[column.key];
        }

        const isThisCellEditing = isRowEditing && editingCell?.column === column.key;

        return (
          <DataTableCell
            key={column.key}
            value={value}
            column={column}
            isEditing={isThisCellEditing}
            onStartEdit={() => onStartEdit(rowId, column.key)}
            onSave={onSaveCell}
            onCancel={onCancelEdit}
            onTabNext={() => {
              // Passer à la colonne suivante éditable
              const nextEditableCol = columns.slice(colIndex + 1).find((c) => c.editable);
              if (nextEditableCol) {
                onStartEdit(rowId, nextEditableCol.key);
              }
            }}
            compact={compact}
          />
        );
      })}
    </tr>
  );
});

// =============================================================================
// Export
// =============================================================================

export default DataTableRow;
