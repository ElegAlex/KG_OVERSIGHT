/**
 * KG-Oversight - Data Management Stores
 * Exports des stores Jotai pour la gestion des données
 */

// Clipboard
export {
  clipboardStateAtom,
  clipboardContentAtom,
  hasClipboardContentAtom,
  clipboardCountAtom,
  clipboardHistoryAtom,
  copyNodesAtom,
  copyEdgesAtom,
  clearClipboardAtom,
  clearClipboardHistoryAtom,
  restoreFromHistoryAtom,
} from './clipboardAtom';

export type {
  ClipboardContentType,
  ClipboardContent,
  ClipboardState,
} from './clipboardAtom';

// DataTable
export {
  dataTableStateAtom,
  selectedTypeAtom,
  sortConfigsAtom,
  filtersAtom,
  selectedRowsAtom,
  paginationAtom,
  editingCellAtom,
  searchQueryAtom,
  compactModeAtom,
  selectedCountAtom,
  hasActiveFiltersAtom,
  toggleRowSelectionAtom,
  selectAllRowsAtom,
  clearSelectionAtom,
  toggleSortAtom,
  addFilterAtom,
  removeFilterAtom,
  clearFiltersAtom,
  startEditingAtom,
  cancelEditingAtom,
  resetDataTableAtom,
} from './dataTableAtoms';

export type {
  SortDirection,
  SortConfig,
  FilterConfig,
  EditingCell,
  DataTableState,
} from './dataTableAtoms';
