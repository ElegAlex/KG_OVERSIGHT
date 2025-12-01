/**
 * KG-Oversight - Types pour le Data Management
 * Définitions des interfaces pour les opérations CRUD
 */

import type { GraphNode, GraphEdge, NodeType, EdgeType } from '@data/types';

// =============================================================================
// Résultats des opérations
// =============================================================================

export interface DataServiceError {
  code: string;
  message: string;
  field?: string;
}

export interface DataServiceResult<T> {
  success: boolean;
  data?: T;
  error?: DataServiceError;
}

export interface DeleteResult {
  deletedNodes: string[];
  deletedEdges: string[];
  preservedNodes: string[];
}

// =============================================================================
// Options des opérations
// =============================================================================

export interface CreateNodeOptions {
  customId?: string;
  skipValidation?: boolean;
}

export interface UpdateNodeOptions {
  skipValidation?: boolean;
}

export interface DeleteNodeOptions {
  cascade?: boolean;
  dryRun?: boolean;
}

// =============================================================================
// Import / Merge
// =============================================================================

export type ImportStrategy = 'replace' | 'merge' | 'add_only';

export interface ImportOptions {
  strategy: ImportStrategy;
  onConflict?: (conflict: ImportConflict) => ConflictResolution;
  dryRun?: boolean;
}

export interface FieldDifference {
  field: string;
  existingValue: unknown;
  incomingValue: unknown;
  isSignificant: boolean;
}

export interface ImportConflict {
  id: string;
  type: NodeType;
  existing: GraphNode;
  incoming: GraphNode;
  differences: FieldDifference[];
  severity: 'minor' | 'major';
}

export type ConflictResolution =
  | { action: 'keep_existing' }
  | { action: 'use_incoming' }
  | { action: 'merge'; fieldChoices: Record<string, 'existing' | 'incoming'> }
  | { action: 'skip' };

export interface ImportReport {
  strategy: ImportStrategy;
  timestamp: string;
  duration: number;
  nodes: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  edges: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  conflicts: {
    total: number;
    resolved: number;
    skipped: number;
  };
  errors: ImportError[];
}

export interface ImportError {
  entityId: string;
  entityType: NodeType | EdgeType;
  errorCode: string;
  message: string;
  field?: string;
}

// =============================================================================
// Validation
// =============================================================================

export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'oneOf'
  | 'date'
  | 'dateAfter'
  | 'dateBefore'
  | 'number'
  | 'min'
  | 'max'
  | 'entityRef'
  | 'unique';

export interface ValidationRule {
  field: string;
  rule: ValidationRuleType;
  value?: unknown;
  ref?: string;
  message: string;
}

export interface ValidationError {
  field: string;
  rule: ValidationRuleType;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// Schéma des entités
// =============================================================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'boolean'
  | 'entityRef';

export interface FieldOption {
  value: string | number;
  label: string;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  editable: boolean;
  options?: FieldOption[];
  entityRefType?: NodeType;
  validation?: Omit<ValidationRule, 'field'>[];
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  group: string;
}

export interface EntitySchema {
  type: NodeType;
  label: string;
  labelPlural: string;
  icon: string;
  color: string;
  fields: FieldDefinition[];
  idPrefix: string;
  allowedRelations: {
    outgoing: EdgeType[];
    incoming: EdgeType[];
  };
}

// =============================================================================
// Clipboard
// =============================================================================

export interface ClipboardContent {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceTimestamp: string;
  includesRelations: boolean;
}

// =============================================================================
// UI State
// =============================================================================

export interface EditingState {
  isEditing: boolean;
  entityId: string | null;
  entityType: NodeType | null;
  originalValues: Record<string, unknown>;
  currentValues: Record<string, unknown>;
  isDirty: boolean;
  validationErrors: ValidationError[];
}

export interface DataTableState {
  selectedType: NodeType;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, unknown>;
  selectedRows: Set<string>;
  page: number;
  pageSize: number;
  editingCell: { rowId: string; column: string } | null;
}
