/**
 * KG-Oversight - Messages d'erreur et textes en français
 * Centralisation de tous les messages de l'application
 */

// =============================================================================
// Messages d'erreur
// =============================================================================

export const ERROR_MESSAGES = {
  // Fichiers et import
  FILE_READ_ERROR: 'Erreur lors de la lecture du fichier',
  FILE_PARSE_ERROR: 'Erreur lors de l\'analyse du fichier',
  FILE_TOO_LARGE: 'Le fichier est trop volumineux (max: {max})',
  FILE_INVALID_FORMAT: 'Format de fichier non supporté. Formats acceptés: {formats}',
  FILE_EMPTY: 'Le fichier est vide',

  // Validation
  VALIDATION_REQUIRED_FIELD: 'Le champ "{field}" est obligatoire',
  VALIDATION_INVALID_FORMAT: 'Format invalide pour le champ "{field}"',
  VALIDATION_INVALID_DATE: 'Date invalide. Format attendu: JJ/MM/AAAA ou AAAA-MM-JJ',
  VALIDATION_INVALID_NUMBER: 'Valeur numérique invalide',
  VALIDATION_INVALID_ENUM: 'Valeur non autorisée. Valeurs acceptées: {values}',
  VALIDATION_DUPLICATE_ID: 'Identifiant "{id}" déjà utilisé',
  VALIDATION_ORPHAN_NODE: 'Nœud "{node}" sans relation',
  VALIDATION_DANGLING_EDGE: 'Relation vers un nœud inexistant: "{node}"',

  // Graphe
  GRAPH_NODE_NOT_FOUND: 'Nœud "{id}" introuvable',
  GRAPH_EDGE_NOT_FOUND: 'Relation "{id}" introuvable',
  GRAPH_LAYOUT_ERROR: 'Erreur lors du calcul du layout',
  GRAPH_RENDER_ERROR: 'Erreur lors du rendu du graphe',

  // Export
  EXPORT_ERROR: 'Erreur lors de l\'export',
  EXPORT_NO_DATA: 'Aucune donnée à exporter',

  // Scénarios
  SCENARIO_NOT_FOUND: 'Scénario introuvable',
  SCENARIO_STEP_ERROR: 'Erreur lors du chargement de l\'étape',
  SCENARIO_NO_NODES: 'Aucun nœud correspondant aux critères',

  // Réseau
  NETWORK_ERROR: 'Erreur de connexion réseau',
  TIMEOUT_ERROR: 'Délai d\'attente dépassé',

  // Général
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
  OPERATION_FAILED: 'L\'opération a échoué',
  PERMISSION_DENIED: 'Permission refusée',
} as const;

// =============================================================================
// Messages de succès
// =============================================================================

export const SUCCESS_MESSAGES = {
  IMPORT_SUCCESS: '{count} élément(s) importé(s) avec succès',
  EXPORT_SUCCESS: 'Export réalisé avec succès',
  SAVE_SUCCESS: 'Données sauvegardées',
  DELETE_SUCCESS: 'Suppression effectuée',
  UPDATE_SUCCESS: 'Mise à jour effectuée',
} as const;

// =============================================================================
// Messages d'information
// =============================================================================

export const INFO_MESSAGES = {
  LOADING: 'Chargement en cours...',
  PROCESSING: 'Traitement en cours...',
  CALCULATING: 'Calcul en cours...',
  SEARCHING: 'Recherche en cours...',
  NO_RESULTS: 'Aucun résultat trouvé',
  NO_DATA: 'Aucune donnée disponible',
  NO_SELECTION: 'Aucun élément sélectionné',
  SELECT_NODE: 'Sélectionnez un nœud pour voir ses détails',
  DRAG_FILE: 'Déposez un fichier ou cliquez pour sélectionner',
} as const;

// =============================================================================
// Labels d'interface
// =============================================================================

export const UI_LABELS = {
  // Actions
  CONFIRM: 'Confirmer',
  CANCEL: 'Annuler',
  CLOSE: 'Fermer',
  SAVE: 'Enregistrer',
  DELETE: 'Supprimer',
  EDIT: 'Modifier',
  ADD: 'Ajouter',
  SEARCH: 'Rechercher',
  FILTER: 'Filtrer',
  RESET: 'Réinitialiser',
  REFRESH: 'Actualiser',
  EXPORT: 'Exporter',
  IMPORT: 'Importer',
  DOWNLOAD: 'Télécharger',
  UPLOAD: 'Téléverser',

  // Navigation
  NEXT: 'Suivant',
  PREVIOUS: 'Précédent',
  BACK: 'Retour',
  FIRST: 'Premier',
  LAST: 'Dernier',

  // États
  LOADING: 'Chargement...',
  SAVING: 'Enregistrement...',
  PROCESSING: 'Traitement...',
  COMPLETED: 'Terminé',
  FAILED: 'Échec',
  PENDING: 'En attente',

  // Graphe
  NODES: 'Nœuds',
  EDGES: 'Relations',
  SELECTED: 'Sélectionné(s)',
  FILTERED: 'Filtré(s)',
  HIGHLIGHTED: 'Mis en évidence',

  // Types de nœuds (français)
  NODE_TYPE_SousTraitant: 'Sous-traitant',
  NODE_TYPE_Contrat: 'Contrat',
  NODE_TYPE_AccordQualite: 'Accord Qualité',
  NODE_TYPE_Audit: 'Audit',
  NODE_TYPE_Inspection: 'Inspection',
  NODE_TYPE_Finding: 'Finding',
  NODE_TYPE_EvenementQualite: 'Événement Qualité',
  NODE_TYPE_Decision: 'Décision',
  NODE_TYPE_EvaluationRisque: 'Évaluation de Risque',
  NODE_TYPE_ReunionQualite: 'Réunion Qualité',
  NODE_TYPE_EtudeClinique: 'Étude Clinique',
  NODE_TYPE_DomaineService: 'Domaine de Service',
  NODE_TYPE_ContexteReglementaire: 'Contexte Réglementaire',
  NODE_TYPE_Alerte: 'Alerte',
  NODE_TYPE_Evenement: 'Événement',
  NODE_TYPE_KQI: 'KQI',

  // Criticité
  CRITICITE_Critique: 'Critique',
  CRITICITE_Majeur: 'Majeur',
  CRITICITE_Standard: 'Standard',
  CRITICITE_Mineur: 'Mineur',

  // Statuts
  STATUT_Actif: 'Actif',
  STATUT_Inactif: 'Inactif',
  STATUT_EnCours: 'En cours',
  STATUT_Termine: 'Terminé',
  STATUT_Archive: 'Archivé',
} as const;

// =============================================================================
// Fonction utilitaire pour formater les messages
// =============================================================================

export function formatMessage(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

// =============================================================================
// Hook pour les messages (optionnel, pour future i18n)
// =============================================================================

export function useMessages() {
  return {
    error: ERROR_MESSAGES,
    success: SUCCESS_MESSAGES,
    info: INFO_MESSAGES,
    ui: UI_LABELS,
    format: formatMessage,
  };
}

export default {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  UI_LABELS,
  formatMessage,
};
