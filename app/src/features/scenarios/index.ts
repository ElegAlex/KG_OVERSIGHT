/**
 * KG-Oversight - Feature Scenarios
 * Export de tous les modules de scénarios guidés
 */

// Types
export * from './types/scenario';
export * from './types/editor';

// Store - Player
export * from './stores/scenarioStore';

// Store - Editor (scénarios d'exploration)
export {
  isEditorOpenAtom,
  editorStateAtom,
  editorModeAtom,
  editorNodesAtom,
  editorConnectionsAtom,
  selectedNodeAtom,
  editorMetadataAtom,
  editorViewportAtom,
  canUndoAtom,
  canRedoAtom,
  isScenarioValidAtom,
  customScenariosAtom,
  openEditorAtom,
  closeEditorAtom,
  resetEditorAtom,
  addNodeAtom,
  deleteNodeAtom,
  moveNodeAtom,
  selectNodeAtom,
  updateNodeDataAtom,
  addConnectionAtom,
  deleteConnectionAtom,
  startConnectingAtom,
  cancelConnectingAtom,
  updateMetadataAtom,
  updateViewportAtom,
  undoAtom,
  redoAtom,
  loadScenarioForEditAtom,
  exportScenarioAtom,
  saveScenarioAtom,
  deleteCustomScenarioAtom,
} from './stores/editorStore';

// Store - Editor ERD (scénarios basés sur le modèle entités-relations)
export {
  isERDEditorOpenAtom,
  erdEditorStateAtom,
  erdPathAtom,
  erdMetadataAtom,
  lastEntityInPathAtom,
  availableRelationsAtom,
  connectedEntitiesAtom,
  isERDScenarioValidAtom,
  erdCustomScenariosAtom,
  openERDEditorAtom,
  closeERDEditorAtom,
  resetERDEditorAtom,
  addEntityToPathAtom,
  removeStepFromPathAtom,
  updateStepAtom,
  selectStepForEditAtom,
  updateERDMetadataAtom,
  setSchemaViewModeAtom,
  exportERDScenarioAtom,
  saveERDScenarioAtom,
  loadERDScenarioForEditAtom,
  deleteERDScenarioAtom,
} from './stores/erdEditorStore';

// Data
export { predefinedScenarios, getScenarioById, getScenariosByCategory } from './data/predefinedScenarios';
export {
  schemaEntities,
  schemaRelations,
  getEntityByType,
  getRelationsBySource,
  getRelationsByTarget,
  getRelationBetween,
  getConnectedEntities,
  categoryColors,
  categoryLabels,
} from './data/schemaDefinition';

// Components
export { ScenarioPlayer } from './components/ScenarioPlayer';
export { ScenarioSelector } from './components/ScenarioSelector';
export { ScenarioEditor } from './components/ScenarioEditor';
export { StepConfigPanel } from './components/StepConfigPanel';
export { ERDScenarioEditor } from './components/ERDScenarioEditor';
