/**
 * KG-Oversight - Data Management Feature Module
 * Gestion complète des données du Knowledge Graph (CRUD)
 *
 * Ce module fournit :
 * - Services CRUD pour nœuds et arêtes
 * - Validation des entités selon leur schéma
 * - Génération d'identifiants uniques
 * - Hooks React pour l'intégration UI
 * - Composants d'édition d'entités
 * - Types et schémas des 16 types d'entités
 * - Clipboard pour copier/coller des entités (Phase 11.7)
 */

// Types
export * from './types';

// Constants (Schemas)
export * from './constants/entitySchemas';

// Services
export * from './services';

// Hooks
export * from './hooks';

// Stores (Jotai atoms)
export * from './stores';

// Components
export * from './components';
