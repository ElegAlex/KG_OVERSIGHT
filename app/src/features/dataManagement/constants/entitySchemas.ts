/**
 * KG-Oversight - Schémas des entités
 * Définition complète des 16 types de nœuds avec leurs champs
 * Utilisé pour la génération dynamique des formulaires et la validation
 */

import type { NodeType, EdgeType } from '@data/types';
import type { EntitySchema, FieldDefinition } from '../types';

// =============================================================================
// Groupes de champs
// =============================================================================

export const FIELD_GROUPS = {
  general: { label: 'Informations générales', order: 1 },
  qualification: { label: 'Qualification', order: 2 },
  evaluation: { label: 'Évaluation', order: 3 },
  dates: { label: 'Dates', order: 4 },
  details: { label: 'Détails', order: 5 },
  metrics: { label: 'Métriques', order: 6 },
} as const;

// =============================================================================
// Options communes
// =============================================================================

const CRITICITE_OPTIONS = [
  { value: 'Critique', label: 'Critique' },
  { value: 'Majeur', label: 'Majeur' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Mineur', label: 'Mineur' },
  { value: 'Observation', label: 'Observation' },
];

const STATUT_FINDING_OPTIONS = [
  { value: 'En cours', label: 'En cours' },
  { value: 'Clôturé', label: 'Clôturé' },
];

// =============================================================================
// Schémas des entités
// =============================================================================

export const ENTITY_SCHEMAS: Record<NodeType, EntitySchema> = {
  // ---------------------------------------------------------------------------
  // SousTraitant
  // ---------------------------------------------------------------------------
  SousTraitant: {
    type: 'SousTraitant',
    label: 'Sous-traitant',
    labelPlural: 'Sous-traitants',
    icon: 'Building2',
    color: '#8B5CF6',
    idPrefix: 'ST',
    fields: [
      {
        name: 'nom',
        label: 'Nom',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Nom du sous-traitant',
        validation: [
          { rule: 'required', message: 'Le nom est obligatoire' },
          { rule: 'minLength', value: 2, message: 'Minimum 2 caractères' },
        ],
      },
      {
        name: 'type_service',
        label: 'Type de service',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Laboratoire central', label: 'Laboratoire central' },
          { value: 'CRO', label: 'CRO' },
          { value: 'Logistique', label: 'Logistique' },
          { value: 'IT/Data', label: 'IT/Data' },
          { value: 'Manufacturing', label: 'Manufacturing' },
          { value: 'Packaging', label: 'Packaging' },
          { value: 'Bioanalyse', label: 'Bioanalyse' },
        ],
      },
      {
        name: 'pays',
        label: 'Pays',
        type: 'text',
        required: false,
        editable: true,
        group: 'general',
        placeholder: 'France',
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: true,
        editable: true,
        group: 'qualification',
        options: [
          { value: 'Approuvé', label: 'Approuvé' },
          { value: 'Déclaré', label: 'Déclaré' },
          { value: 'Sous surveillance', label: 'Sous surveillance' },
          { value: 'En évaluation', label: 'En évaluation' },
        ],
        defaultValue: 'En évaluation',
      },
      {
        name: 'niveau_actuel',
        label: 'Niveau',
        type: 'select',
        required: true,
        editable: true,
        group: 'qualification',
        options: [
          { value: 1, label: 'N1 (Direct)' },
          { value: 2, label: 'N2 (Indirect)' },
        ],
        defaultValue: 1,
        helpText: 'N1 = sous-traitant direct, N2 = sous-traitant de sous-traitant',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'qualification',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_creation',
        label: 'Date de création',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
    ],
    allowedRelations: {
      outgoing: ['EST_SOUS_TRAITANT_DE', 'EST_LIE_AU_CONTRAT', 'EST_COUVERT_PAR_QA', 'POSSEDE_SERVICE'],
      incoming: ['A_ETE_AUDITE_PAR', 'A_ETE_INSPECTE_PAR', 'IMPLIQUE_ST', 'KQI_MESURE_ST', 'QE_CONCERNE_ST', 'EVT_CONCERNE_ST'],
    },
  },

  // ---------------------------------------------------------------------------
  // Contrat
  // ---------------------------------------------------------------------------
  Contrat: {
    type: 'Contrat',
    label: 'Contrat',
    labelPlural: 'Contrats',
    icon: 'FileText',
    color: '#3B82F6',
    idPrefix: 'CTR',
    fields: [
      {
        name: 'nom',
        label: 'Nom / Référence',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Référence du contrat',
      },
      {
        name: 'type_contrat',
        label: 'Type de contrat',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'MSA', label: 'MSA (Master Service Agreement)' },
          { value: 'SOW', label: 'SOW (Statement of Work)' },
          { value: 'Amendment', label: 'Amendement' },
        ],
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Signé', label: 'Signé' },
          { value: 'En cours', label: 'En négociation' },
          { value: 'Archivé', label: 'Archivé' },
        ],
        defaultValue: 'En cours',
      },
      {
        name: 'date_debut',
        label: 'Date de début',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_fin',
        label: 'Date de fin',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
        validation: [
          { rule: 'dateAfter', ref: 'date_debut', message: 'Doit être après la date de début' },
        ],
      },
      {
        name: 'montant_annuel',
        label: 'Montant annuel',
        type: 'text',
        required: false,
        editable: true,
        group: 'details',
        placeholder: '100 000 €',
      },
      {
        name: 'version',
        label: 'Version',
        type: 'number',
        required: false,
        editable: true,
        group: 'details',
        defaultValue: 1,
      },
    ],
    allowedRelations: {
      outgoing: ['A_VERSION_SUIVANTE'],
      incoming: ['EST_LIE_AU_CONTRAT'],
    },
  },

  // ---------------------------------------------------------------------------
  // AccordQualite
  // ---------------------------------------------------------------------------
  AccordQualite: {
    type: 'AccordQualite',
    label: 'Accord Qualité',
    labelPlural: 'Accords Qualité',
    icon: 'ShieldCheck',
    color: '#06B6D4',
    idPrefix: 'QA',
    fields: [
      {
        name: 'nom',
        label: 'Nom / Référence',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Référence du QA',
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Signé', label: 'Signé' },
          { value: 'En révision', label: 'En révision' },
          { value: 'Archivé', label: 'Archivé' },
        ],
        defaultValue: 'En révision',
      },
      {
        name: 'date_debut',
        label: 'Date de signature',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_fin',
        label: 'Date d\'expiration',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'version',
        label: 'Version',
        type: 'number',
        required: false,
        editable: true,
        group: 'details',
        defaultValue: 1,
      },
      {
        name: 'revision_en_cours',
        label: 'Révision en cours',
        type: 'boolean',
        required: false,
        editable: true,
        group: 'details',
        defaultValue: false,
      },
    ],
    allowedRelations: {
      outgoing: ['QA_A_VERSION_SUIVANTE'],
      incoming: ['EST_COUVERT_PAR_QA'],
    },
  },

  // ---------------------------------------------------------------------------
  // Audit
  // ---------------------------------------------------------------------------
  Audit: {
    type: 'Audit',
    label: 'Audit',
    labelPlural: 'Audits',
    icon: 'ClipboardCheck',
    color: '#10B981',
    idPrefix: 'AUD',
    fields: [
      {
        name: 'nom',
        label: 'Nom / Référence',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Référence de l\'audit',
      },
      {
        name: 'type_audit',
        label: 'Type d\'audit',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Qualification', label: 'Qualification' },
          { value: 'Routine', label: 'Routine' },
          { value: 'For Cause', label: 'For Cause' },
          { value: 'Remote', label: 'Remote' },
        ],
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Planifié', label: 'Planifié' },
          { value: 'En cours', label: 'En cours' },
          { value: 'Clôturé', label: 'Clôturé' },
        ],
        defaultValue: 'Planifié',
      },
      {
        name: 'resultat',
        label: 'Résultat',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Satisfaisant', label: 'Satisfaisant' },
          { value: 'Satisfaisant avec observations', label: 'Satisfaisant avec observations' },
          { value: 'Non satisfaisant', label: 'Non satisfaisant' },
        ],
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_debut',
        label: 'Date de début',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_fin',
        label: 'Date de fin',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
        validation: [
          { rule: 'dateAfter', ref: 'date_debut', message: 'Doit être après la date de début' },
        ],
      },
      {
        name: 'declencheur',
        label: 'Déclencheur',
        type: 'textarea',
        required: false,
        editable: true,
        group: 'details',
        placeholder: 'Motif de déclenchement de l\'audit',
      },
    ],
    allowedRelations: {
      outgoing: ['GENERE_FINDING', 'AUDIT_DECLENCHE_ALERTE'],
      incoming: ['A_ETE_AUDITE_PAR', 'DECISION_JUSTIFIEE_PAR_AUDIT'],
    },
  },

  // ---------------------------------------------------------------------------
  // Inspection
  // ---------------------------------------------------------------------------
  Inspection: {
    type: 'Inspection',
    label: 'Inspection',
    labelPlural: 'Inspections',
    icon: 'Search',
    color: '#F97316',
    idPrefix: 'INS',
    fields: [
      {
        name: 'nom',
        label: 'Nom / Référence',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Référence de l\'inspection',
      },
      {
        name: 'autorite',
        label: 'Autorité',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'ANSM', label: 'ANSM' },
          { value: 'FDA', label: 'FDA' },
          { value: 'EMA', label: 'EMA' },
          { value: 'PMDA', label: 'PMDA' },
          { value: 'Autre', label: 'Autre' },
        ],
      },
      {
        name: 'type_inspection',
        label: 'Type d\'inspection',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Routine', label: 'Routine' },
          { value: 'For Cause', label: 'For Cause' },
          { value: 'Pre-Approval', label: 'Pre-Approval' },
        ],
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Planifié', label: 'Planifié' },
          { value: 'En cours', label: 'En cours' },
          { value: 'Clôturé', label: 'Clôturé' },
        ],
        defaultValue: 'Planifié',
      },
      {
        name: 'resultat',
        label: 'Résultat',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Conforme', label: 'Conforme' },
          { value: 'Non conforme', label: 'Non conforme' },
        ],
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_debut',
        label: 'Date de début',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_fin',
        label: 'Date de fin',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'nb_observations',
        label: 'Nb observations',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
        defaultValue: 0,
      },
      {
        name: 'nb_critiques',
        label: 'Nb critiques',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
        defaultValue: 0,
      },
    ],
    allowedRelations: {
      outgoing: ['INSPECTION_GENERE_FINDING'],
      incoming: ['A_ETE_INSPECTE_PAR', 'DECISION_JUSTIFIEE_PAR_INSPECTION'],
    },
  },

  // ---------------------------------------------------------------------------
  // Finding
  // ---------------------------------------------------------------------------
  Finding: {
    type: 'Finding',
    label: 'Finding',
    labelPlural: 'Findings',
    icon: 'AlertTriangle',
    color: '#F59E0B',
    idPrefix: 'FND',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Description détaillée du finding',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: true,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS,
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: true,
        editable: true,
        group: 'evaluation',
        options: STATUT_FINDING_OPTIONS,
        defaultValue: 'En cours',
      },
      {
        name: 'date_detection',
        label: 'Date de détection',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_cloture',
        label: 'Date de clôture',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
        validation: [
          { rule: 'dateAfter', ref: 'date_detection', message: 'Doit être après la date de détection' },
        ],
      },
      {
        name: 'capa_id',
        label: 'CAPA associée',
        type: 'text',
        required: false,
        editable: true,
        group: 'details',
        placeholder: 'Identifiant de la CAPA',
      },
      {
        name: 'concerne_st2',
        label: 'Concerne ST2',
        type: 'text',
        required: false,
        editable: true,
        group: 'details',
        helpText: 'ID du sous-traitant de niveau 2 concerné',
      },
    ],
    allowedRelations: {
      outgoing: [],
      incoming: ['GENERE_FINDING', 'INSPECTION_GENERE_FINDING', 'DECISION_JUSTIFIEE_PAR_FINDING'],
    },
  },

  // ---------------------------------------------------------------------------
  // EvenementQualite
  // ---------------------------------------------------------------------------
  EvenementQualite: {
    type: 'EvenementQualite',
    label: 'Événement Qualité',
    labelPlural: 'Événements Qualité',
    icon: 'AlertOctagon',
    color: '#EF4444',
    idPrefix: 'QE',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Description de l\'événement qualité',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: true,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: true,
        editable: true,
        group: 'evaluation',
        options: STATUT_FINDING_OPTIONS,
        defaultValue: 'En cours',
      },
      {
        name: 'impact',
        label: 'Impact',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Faible', label: 'Faible' },
          { value: 'Moyen', label: 'Moyen' },
          { value: 'Élevé', label: 'Élevé' },
        ],
      },
      {
        name: 'date_creation',
        label: 'Date de création',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_cloture',
        label: 'Date de clôture',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'nb_echantillons_impactes',
        label: 'Nb échantillons impactés',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
      },
      {
        name: 'retard_jours',
        label: 'Retard (jours)',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
      },
      {
        name: 'nb_erreurs',
        label: 'Nb erreurs',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
      },
    ],
    allowedRelations: {
      outgoing: ['QE_CONCERNE_ST', 'QE_DECLENCHE_ALERTE', 'SURVENU_DANS_ETUDE'],
      incoming: ['DECISION_JUSTIFIEE_PAR_QE', 'CAUSE_EVENEMENT'],
    },
  },

  // ---------------------------------------------------------------------------
  // Decision
  // ---------------------------------------------------------------------------
  Decision: {
    type: 'Decision',
    label: 'Décision',
    labelPlural: 'Décisions',
    icon: 'Gavel',
    color: '#EC4899',
    idPrefix: 'DEC',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Description de la décision',
      },
      {
        name: 'nature',
        label: 'Nature',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Maintien', label: 'Maintien' },
          { value: 'Surveillance renforcée', label: 'Surveillance renforcée' },
          { value: 'Suspension', label: 'Suspension' },
          { value: 'Retrait', label: 'Retrait' },
          { value: 'Requalification', label: 'Requalification' },
        ],
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'En cours', label: 'En cours' },
          { value: 'Appliquée', label: 'Appliquée' },
          { value: 'Archivé', label: 'Archivé' },
        ],
        defaultValue: 'En cours',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_decision',
        label: 'Date de décision',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'decideur',
        label: 'Décideur',
        type: 'text',
        required: false,
        editable: true,
        group: 'details',
        placeholder: 'Nom du décideur ou comité',
      },
      {
        name: 'duree_mois',
        label: 'Durée (mois)',
        type: 'number',
        required: false,
        editable: true,
        group: 'details',
        helpText: 'Durée de validité de la décision',
      },
    ],
    allowedRelations: {
      outgoing: ['DECISION_JUSTIFIEE_PAR_AUDIT', 'DECISION_JUSTIFIEE_PAR_QE', 'DECISION_JUSTIFIEE_PAR_INSPECTION', 'DECISION_JUSTIFIEE_PAR_FINDING', 'RESULTE_DE_EVALUATION'],
      incoming: [],
    },
  },

  // ---------------------------------------------------------------------------
  // EvaluationRisque
  // ---------------------------------------------------------------------------
  EvaluationRisque: {
    type: 'EvaluationRisque',
    label: 'Évaluation Risque',
    labelPlural: 'Évaluations Risque',
    icon: 'Shield',
    color: '#14B8A6',
    idPrefix: 'EVR',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        editable: true,
        group: 'general',
        placeholder: 'Commentaires sur l\'évaluation',
      },
      {
        name: 'score',
        label: 'Score de risque',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Low', label: 'Faible (Low)' },
          { value: 'Medium', label: 'Moyen (Medium)' },
          { value: 'High', label: 'Élevé (High)' },
        ],
      },
      {
        name: 'evolution',
        label: 'Évolution',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Amélioration', label: 'Amélioration' },
          { value: 'Stable', label: 'Stable' },
          { value: 'Dégradation', label: 'Dégradation' },
        ],
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'En cours', label: 'En cours' },
          { value: 'Clôturé', label: 'Clôturé' },
        ],
        defaultValue: 'En cours',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_evaluation',
        label: 'Date d\'évaluation',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'prochaine_evaluation',
        label: 'Prochaine évaluation',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'findings_critiques',
        label: 'Findings critiques',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
        defaultValue: 0,
      },
      {
        name: 'qe_critiques',
        label: 'QE critiques',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
        defaultValue: 0,
      },
      {
        name: 'kqi_alertes',
        label: 'Alertes KQI',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
        defaultValue: 0,
      },
      {
        name: 'inspection_recente',
        label: 'Inspection récente',
        type: 'boolean',
        required: false,
        editable: true,
        group: 'details',
        defaultValue: false,
      },
      {
        name: 'audit_for_cause',
        label: 'Audit For Cause',
        type: 'boolean',
        required: false,
        editable: true,
        group: 'details',
        defaultValue: false,
      },
    ],
    allowedRelations: {
      outgoing: ['A_FAIT_OBJET_EVALUATION'],
      incoming: ['RESULTE_DE_EVALUATION'],
    },
  },

  // ---------------------------------------------------------------------------
  // ReunionQualite
  // ---------------------------------------------------------------------------
  ReunionQualite: {
    type: 'ReunionQualite',
    label: 'Réunion Qualité',
    labelPlural: 'Réunions Qualité',
    icon: 'Users',
    color: '#6366F1',
    idPrefix: 'RQ',
    fields: [
      {
        name: 'nom',
        label: 'Nom',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Nom de la réunion',
      },
      {
        name: 'periodicite',
        label: 'Périodicité',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Mensuelle', label: 'Mensuelle' },
          { value: 'Trimestrielle', label: 'Trimestrielle' },
          { value: 'Semestrielle', label: 'Semestrielle' },
          { value: 'Extraordinaire', label: 'Extraordinaire' },
        ],
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Planifiée', label: 'Planifiée' },
          { value: 'Réalisé', label: 'Réalisée' },
          { value: 'Archivé', label: 'Archivée' },
        ],
        defaultValue: 'Planifiée',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_reunion',
        label: 'Date de réunion',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'trimestre',
        label: 'Trimestre',
        type: 'text',
        required: false,
        editable: true,
        group: 'details',
        placeholder: 'Q1 2025',
      },
      {
        name: 'motif',
        label: 'Motif',
        type: 'textarea',
        required: false,
        editable: true,
        group: 'details',
        placeholder: 'Motif de la réunion (si extraordinaire)',
      },
    ],
    allowedRelations: {
      outgoing: ['A_ETE_SUIVI_PAR'],
      incoming: [],
    },
  },

  // ---------------------------------------------------------------------------
  // EtudeClinique
  // ---------------------------------------------------------------------------
  EtudeClinique: {
    type: 'EtudeClinique',
    label: 'Étude Clinique',
    labelPlural: 'Études Cliniques',
    icon: 'FlaskConical',
    color: '#A855F7',
    idPrefix: 'ETU',
    fields: [
      {
        name: 'nom',
        label: 'Nom / Code',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Code de l\'étude',
      },
      {
        name: 'phase',
        label: 'Phase',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'I', label: 'Phase I' },
          { value: 'II', label: 'Phase II' },
          { value: 'III', label: 'Phase III' },
          { value: 'IV', label: 'Phase IV' },
        ],
      },
      {
        name: 'indication',
        label: 'Indication',
        type: 'text',
        required: false,
        editable: true,
        group: 'general',
        placeholder: 'Indication thérapeutique',
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'En démarrage', label: 'En démarrage' },
          { value: 'En cours', label: 'En cours' },
          { value: 'Clôturé', label: 'Clôturée' },
          { value: 'Archivé', label: 'Archivée' },
        ],
        defaultValue: 'En démarrage',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_debut',
        label: 'Date de début',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_fin',
        label: 'Date de fin',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'nb_patients',
        label: 'Nb patients',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
      },
    ],
    allowedRelations: {
      outgoing: ['IMPLIQUE_ST'],
      incoming: ['SURVENU_DANS_ETUDE'],
    },
  },

  // ---------------------------------------------------------------------------
  // DomaineService
  // ---------------------------------------------------------------------------
  DomaineService: {
    type: 'DomaineService',
    label: 'Domaine de Service',
    labelPlural: 'Domaines de Service',
    icon: 'Layers',
    color: '#64748B',
    idPrefix: 'DOM',
    fields: [
      {
        name: 'nom',
        label: 'Nom',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Nom du domaine',
      },
      {
        name: 'categorie',
        label: 'Catégorie',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Laboratoire', label: 'Laboratoire' },
          { value: 'CRO', label: 'CRO' },
          { value: 'IT/Data', label: 'IT/Data' },
          { value: 'Logistique', label: 'Logistique' },
        ],
      },
      {
        name: 'complexite',
        label: 'Complexité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Faible', label: 'Faible' },
          { value: 'Moyenne', label: 'Moyenne' },
          { value: 'Haute', label: 'Haute' },
          { value: 'Très haute', label: 'Très haute' },
        ],
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Actif', label: 'Actif' },
          { value: 'Archivé', label: 'Archivé' },
        ],
        defaultValue: 'Actif',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_creation',
        label: 'Date de création',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
    ],
    allowedRelations: {
      outgoing: [],
      incoming: ['POSSEDE_SERVICE'],
    },
  },

  // ---------------------------------------------------------------------------
  // ContexteReglementaire
  // ---------------------------------------------------------------------------
  ContexteReglementaire: {
    type: 'ContexteReglementaire',
    label: 'Contexte Réglementaire',
    labelPlural: 'Contextes Réglementaires',
    icon: 'Scale',
    color: '#0EA5E9',
    idPrefix: 'REG',
    fields: [
      {
        name: 'nom',
        label: 'Nom',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Nom du contexte réglementaire',
      },
      {
        name: 'reference',
        label: 'Référence',
        type: 'text',
        required: false,
        editable: true,
        group: 'general',
        placeholder: 'Référence réglementaire',
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Applicable', label: 'Applicable' },
          { value: 'En cours', label: 'En cours de mise en œuvre' },
          { value: 'Archivé', label: 'Archivé' },
        ],
        defaultValue: 'Applicable',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_application',
        label: 'Date d\'application',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'impact',
        label: 'Impact',
        type: 'textarea',
        required: false,
        editable: true,
        group: 'details',
        placeholder: 'Description de l\'impact',
      },
    ],
    allowedRelations: {
      outgoing: [],
      incoming: ['A_POUR_CONTEXTE'],
    },
  },

  // ---------------------------------------------------------------------------
  // Alerte
  // ---------------------------------------------------------------------------
  Alerte: {
    type: 'Alerte',
    label: 'Alerte',
    labelPlural: 'Alertes',
    icon: 'Bell',
    color: '#DC2626',
    idPrefix: 'ALR',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Description de l\'alerte',
      },
      {
        name: 'niveau',
        label: 'Niveau',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'HAUTE', label: 'Haute' },
          { value: 'MOYENNE', label: 'Moyenne' },
          { value: 'BASSE', label: 'Basse' },
        ],
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Résolue', label: 'Résolue' },
        ],
        defaultValue: 'Active',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'date_creation',
        label: 'Date de création',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_resolution',
        label: 'Date de résolution',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
      {
        name: 'regle_id',
        label: 'Règle déclencheuse',
        type: 'text',
        required: false,
        editable: false,
        group: 'details',
      },
      {
        name: 'declencheur',
        label: 'Déclencheur',
        type: 'text',
        required: false,
        editable: false,
        group: 'details',
      },
      {
        name: 'st_concerne',
        label: 'ST concerné',
        type: 'text',
        required: false,
        editable: true,
        group: 'details',
        helpText: 'ID du sous-traitant concerné',
      },
    ],
    allowedRelations: {
      outgoing: [],
      incoming: ['AUDIT_DECLENCHE_ALERTE', 'QE_DECLENCHE_ALERTE'],
    },
  },

  // ---------------------------------------------------------------------------
  // Evenement
  // ---------------------------------------------------------------------------
  Evenement: {
    type: 'Evenement',
    label: 'Événement',
    labelPlural: 'Événements',
    icon: 'Calendar',
    color: '#84CC16',
    idPrefix: 'EVT',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Description de l\'événement',
      },
      {
        name: 'type_evenement',
        label: 'Type',
        type: 'text',
        required: false,
        editable: true,
        group: 'general',
        placeholder: 'Type d\'événement',
      },
      {
        name: 'source',
        label: 'Source',
        type: 'text',
        required: false,
        editable: true,
        group: 'general',
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: STATUT_FINDING_OPTIONS,
        defaultValue: 'En cours',
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: CRITICITE_OPTIONS.filter((o) => o.value !== 'Observation'),
      },
      {
        name: 'impact',
        label: 'Impact',
        type: 'textarea',
        required: false,
        editable: true,
        group: 'details',
      },
      {
        name: 'date_creation',
        label: 'Date de création',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates',
      },
      {
        name: 'date_cloture',
        label: 'Date de clôture',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
      },
    ],
    allowedRelations: {
      outgoing: ['EVT_CONCERNE_ST'],
      incoming: ['CAUSE_EVENEMENT'],
    },
  },

  // ---------------------------------------------------------------------------
  // KQI
  // ---------------------------------------------------------------------------
  KQI: {
    type: 'KQI',
    label: 'KQI',
    labelPlural: 'KQIs',
    icon: 'BarChart3',
    color: '#22C55E',
    idPrefix: 'KQI',
    fields: [
      {
        name: 'indicateur',
        label: 'Indicateur',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Nom de l\'indicateur',
      },
      {
        name: 'sous_traitant_id',
        label: 'Sous-traitant (ID)',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
      },
      {
        name: 'sous_traitant_nom',
        label: 'Sous-traitant (Nom)',
        type: 'text',
        required: false,
        editable: true,
        group: 'general',
      },
      {
        name: 'periode',
        label: 'Période',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: 'Q1 2025',
      },
      {
        name: 'valeur',
        label: 'Valeur',
        type: 'number',
        required: true,
        editable: true,
        group: 'metrics',
      },
      {
        name: 'seuil_alerte',
        label: 'Seuil d\'alerte',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
      },
      {
        name: 'seuil_objectif',
        label: 'Seuil objectif',
        type: 'number',
        required: false,
        editable: true,
        group: 'metrics',
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'OK', label: 'OK' },
          { value: 'Attention', label: 'Attention' },
          { value: 'Alerte', label: 'Alerte' },
          { value: 'Critique', label: 'Critique' },
        ],
        defaultValue: 'OK',
      },
      {
        name: 'tendance',
        label: 'Tendance',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Amélioration', label: 'Amélioration' },
          { value: 'Stable', label: 'Stable' },
          { value: 'Dégradation', label: 'Dégradation' },
        ],
        defaultValue: 'Stable',
      },
    ],
    allowedRelations: {
      outgoing: ['KQI_MESURE_ST'],
      incoming: [],
    },
  },
};

// =============================================================================
// Fonctions utilitaires
// =============================================================================

/**
 * Récupère le schéma d'une entité par son type
 */
export function getEntitySchema(type: NodeType): EntitySchema {
  return ENTITY_SCHEMAS[type];
}

/**
 * Récupère tous les schémas groupés par catégorie
 */
export function getSchemasByCategory(): Record<string, EntitySchema[]> {
  return {
    'Organisation': [
      ENTITY_SCHEMAS.SousTraitant,
      ENTITY_SCHEMAS.Contrat,
      ENTITY_SCHEMAS.AccordQualite,
      ENTITY_SCHEMAS.DomaineService,
    ],
    'Événements qualité': [
      ENTITY_SCHEMAS.Audit,
      ENTITY_SCHEMAS.Inspection,
      ENTITY_SCHEMAS.Finding,
      ENTITY_SCHEMAS.EvenementQualite,
      ENTITY_SCHEMAS.Decision,
      ENTITY_SCHEMAS.EvaluationRisque,
    ],
    'Études et réunions': [
      ENTITY_SCHEMAS.EtudeClinique,
      ENTITY_SCHEMAS.ReunionQualite,
    ],
    'Suivi': [
      ENTITY_SCHEMAS.Alerte,
      ENTITY_SCHEMAS.Evenement,
      ENTITY_SCHEMAS.KQI,
      ENTITY_SCHEMAS.ContexteReglementaire,
    ],
  };
}

/**
 * Récupère les champs obligatoires d'un type d'entité
 */
export function getRequiredFields(type: NodeType): FieldDefinition[] {
  return ENTITY_SCHEMAS[type].fields.filter((f) => f.required);
}

/**
 * Récupère les champs éditables d'un type d'entité
 */
export function getEditableFields(type: NodeType): FieldDefinition[] {
  return ENTITY_SCHEMAS[type].fields.filter((f) => f.editable);
}

/**
 * Récupère les champs groupés par groupe
 */
export function getFieldsByGroup(type: NodeType): Record<string, FieldDefinition[]> {
  const schema = ENTITY_SCHEMAS[type];
  const grouped: Record<string, FieldDefinition[]> = {};

  for (const field of schema.fields) {
    if (!grouped[field.group]) {
      grouped[field.group] = [];
    }
    grouped[field.group].push(field);
  }

  return grouped;
}

/**
 * Vérifie si une relation est autorisée entre deux types
 */
export function isRelationAllowed(
  sourceType: NodeType,
  targetType: NodeType,
  relationType: EdgeType
): boolean {
  const sourceSchema = ENTITY_SCHEMAS[sourceType];
  const targetSchema = ENTITY_SCHEMAS[targetType];

  return (
    sourceSchema.allowedRelations.outgoing.includes(relationType) ||
    targetSchema.allowedRelations.incoming.includes(relationType)
  );
}

// =============================================================================
// Groupes de types d'entités (pour DataTable et TypeSelector)
// =============================================================================

export interface NodeTypeGroup {
  name: string;
  types: NodeType[];
}

export const NODE_TYPE_GROUPS: NodeTypeGroup[] = [
  {
    name: 'Organisation',
    types: ['SousTraitant', 'Contrat', 'AccordQualite', 'DomaineService'],
  },
  {
    name: 'Événements qualité',
    types: ['Audit', 'Inspection', 'Finding', 'EvenementQualite', 'Decision', 'EvaluationRisque'],
  },
  {
    name: 'Études et réunions',
    types: ['EtudeClinique', 'ReunionQualite'],
  },
  {
    name: 'Suivi',
    types: ['Alerte', 'Evenement', 'KQI', 'ContexteReglementaire'],
  },
];

/**
 * Liste de tous les types de nœuds
 */
export const ALL_NODE_TYPES: NodeType[] = NODE_TYPE_GROUPS.flatMap((g) => g.types);

export default ENTITY_SCHEMAS;
