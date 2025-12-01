/**
 * KG-Oversight - Data Management Services
 * Point d'entrée pour tous les services de gestion des données
 */

// Services
export * from './dataService';
export * from './idGenerator';
export * from './validationService';

// Exports par défaut
export { default as dataService } from './dataService';
export { default as idGenerator } from './idGenerator';
export { default as validationService } from './validationService';
