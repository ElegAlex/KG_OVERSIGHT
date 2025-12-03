/**
 * KG-Oversight - DataTableCell
 * Cellule éditable pour la DataTable
 *
 * Supporte :
 * - Double-clic pour édition
 * - Validation en temps réel
 * - Entrée pour sauvegarder, Échap pour annuler
 * - Tab pour passer à la cellule suivante
 */

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import { Check, X } from 'lucide-react';
import type { ColumnDefinition } from '../../hooks/useDataTable';

// =============================================================================
// Types
// =============================================================================

interface DataTableCellProps {
  value: unknown;
  column: ColumnDefinition;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: unknown) => Promise<boolean>;
  onCancel: () => void;
  onTabNext?: () => void;
  compact?: boolean;
}

// =============================================================================
// Composant
// =============================================================================

export function DataTableCell({
  value,
  column,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onTabNext,
  compact = false,
}: DataTableCellProps) {
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  // Initialiser la valeur d'édition
  useEffect(() => {
    if (isEditing) {
      setEditValue(formatValueForEdit(value, column.type));
      setError(null);
      // Focus avec délai pour le rendu
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current instanceof HTMLInputElement) {
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isEditing, value, column.type]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleDoubleClick = useCallback(() => {
    if (column.editable && !isEditing) {
      onStartEdit();
    }
  }, [column.editable, isEditing, onStartEdit]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const parsedValue = parseValueFromEdit(editValue, column.type);
      const success = await onSave(parsedValue);

      if (!success) {
        setError('Erreur de validation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsSaving(false);
    }
  }, [editValue, column.type, onSave]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSave().then(() => {
          onTabNext?.();
        });
      }
    },
    [handleSave, onCancel, onTabNext]
  );

  // ==========================================================================
  // Rendu
  // ==========================================================================

  // Mode édition
  if (isEditing) {
    return (
      <td
        className={`relative border-r border-gray-200 dark:border-gray-700 ${compact ? 'p-1' : 'p-2'}`}
      >
        <div className="flex items-center gap-1">
          {renderEditInput()}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
            title="Sauvegarder (Entrée)"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
            title="Annuler (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <div className="absolute left-0 top-full z-10 mt-1 px-2 py-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/50 rounded shadow">
            {error}
          </div>
        )}
      </td>
    );
  }

  // Mode affichage
  return (
    <td
      className={`border-r border-gray-200 dark:border-gray-700 truncate max-w-[200px] ${compact ? 'p-1 text-sm' : 'p-2'} ${column.editable ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
      onDoubleClick={handleDoubleClick}
      title={column.editable ? 'Double-clic pour modifier' : undefined}
    >
      {formatValueForDisplay(value, column.type)}
    </td>
  );

  // ==========================================================================
  // Rendu conditionnel du champ d'édition
  // ==========================================================================

  function renderEditInput() {
    switch (column.type) {
      case 'select':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">-- Sélectionner --</option>
            {column.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        );

      case 'date':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        );

      case 'number':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        );

      default:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        );
    }
  }
}

// =============================================================================
// Helpers
// =============================================================================

function formatValueForDisplay(value: unknown, type: string): string {
  if (value === null || value === undefined) return '—';

  switch (type) {
    case 'boolean':
      return value ? 'Oui' : 'Non';
    case 'date':
      if (typeof value === 'string' && value) {
        try {
          return new Date(value).toLocaleDateString('fr-FR');
        } catch {
          return value;
        }
      }
      return String(value);
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value);
    default:
      return String(value);
  }
}

function formatValueForEdit(value: unknown, type: string): string {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'date':
      if (typeof value === 'string' && value) {
        // Convertir en format YYYY-MM-DD pour input date
        try {
          const date = new Date(value);
          return date.toISOString().split('T')[0];
        } catch {
          return value;
        }
      }
      return '';
    default:
      return String(value);
  }
}

function parseValueFromEdit(value: string, type: string): unknown {
  if (value === '') return null;

  switch (type) {
    case 'boolean':
      return value === 'true';
    case 'number':
      const num = parseFloat(value);
      if (isNaN(num)) throw new Error('Nombre invalide');
      return num;
    case 'date':
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error('Date invalide');
        return value; // Garder au format ISO
      }
      return null;
    default:
      return value;
  }
}

// =============================================================================
// Export
// =============================================================================

export default DataTableCell;
