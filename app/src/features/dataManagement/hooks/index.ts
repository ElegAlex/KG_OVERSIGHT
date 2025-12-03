/**
 * KG-Oversight - Data Management Hooks
 * Point d'entrée pour tous les hooks de gestion des données
 */

export {
  useDataMutations,
  useEntityValidation,
  useNodeWithRelations,
} from './useDataMutations';

export { useClipboard } from './useClipboard';

export { useDataTable } from './useDataTable';
export type { ColumnDefinition, DataTableRow, UseDataTableReturn } from './useDataTable';
