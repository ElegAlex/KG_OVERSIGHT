/**
 * KG-Oversight - Data Management Components
 * Composants UI pour la gestion des données
 */

// Composant principal d'édition
export { EntityEditor } from './EntityEditor';

// Dialog de confirmation de suppression
export { DeleteConfirmDialog } from './DeleteConfirmDialog';

// Dialog de création d'entité
export { EntityCreatorDialog } from './EntityCreatorDialog';

// Sélecteur de type d'entité
export { TypeSelector } from './TypeSelector';

// Gestion des relations (Phase 11.5)
export { RelationList } from './RelationList';
export { RelationCreatorDialog } from './RelationCreatorDialog';

// DataTable (Phase 11.8)
export * from './DataTable';
export { DataTablePanel } from './DataTablePanel';

// Composants de champs
export * from './fields';
