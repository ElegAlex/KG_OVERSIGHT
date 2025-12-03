/**
 * KG-Oversight - Schémas des relations
 * Définition des 26 types de relations avec leurs contraintes
 * Utilisé pour la création et validation des relations
 */

import type { NodeType, EdgeType } from '@data/types';

// =============================================================================
// Types
// =============================================================================

export interface RelationSchema {
  type: EdgeType;
  label: string;
  labelReverse: string;
  description: string;
  sourceTypes: NodeType[];
  targetTypes: NodeType[];
  hasProperties: boolean;
  properties?: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    required: boolean;
  }[];
}

// =============================================================================
// Schémas des relations
// =============================================================================

export const RELATION_SCHEMAS: Record<EdgeType, RelationSchema> = {
  // Organisation
  EST_SOUS_TRAITANT_DE: {
    type: 'EST_SOUS_TRAITANT_DE',
    label: 'Est sous-traitant de',
    labelReverse: 'A pour sous-traitant',
    description: 'Relation de sous-traitance entre deux sous-traitants (ST2 vers ST1)',
    sourceTypes: ['SousTraitant'],
    targetTypes: ['SousTraitant'],
    hasProperties: true,
    properties: [
      { name: 'niveau', label: 'Niveau', type: 'number', required: false },
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  EST_LIE_AU_CONTRAT: {
    type: 'EST_LIE_AU_CONTRAT',
    label: 'Est lié au contrat',
    labelReverse: 'Concerne le sous-traitant',
    description: 'Lie un sous-traitant à un contrat',
    sourceTypes: ['SousTraitant'],
    targetTypes: ['Contrat'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  EST_COUVERT_PAR_QA: {
    type: 'EST_COUVERT_PAR_QA',
    label: 'Est couvert par QA',
    labelReverse: 'Couvre le sous-traitant',
    description: 'Lie un sous-traitant à un accord qualité',
    sourceTypes: ['SousTraitant'],
    targetTypes: ['AccordQualite'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  A_VERSION_SUIVANTE: {
    type: 'A_VERSION_SUIVANTE',
    label: 'A pour version suivante',
    labelReverse: 'Est version précédente de',
    description: 'Versionnement des contrats',
    sourceTypes: ['Contrat'],
    targetTypes: ['Contrat'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  QA_A_VERSION_SUIVANTE: {
    type: 'QA_A_VERSION_SUIVANTE',
    label: 'A pour version suivante',
    labelReverse: 'Est version précédente de',
    description: 'Versionnement des accords qualité',
    sourceTypes: ['AccordQualite'],
    targetTypes: ['AccordQualite'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  POSSEDE_SERVICE: {
    type: 'POSSEDE_SERVICE',
    label: 'Possède le service',
    labelReverse: 'Appartient au sous-traitant',
    description: 'Lie un sous-traitant à ses domaines de service',
    sourceTypes: ['SousTraitant'],
    targetTypes: ['DomaineService'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  // Audits et Inspections
  A_ETE_AUDITE_PAR: {
    type: 'A_ETE_AUDITE_PAR',
    label: 'A été audité par',
    labelReverse: 'Audite le sous-traitant',
    description: 'Lie un audit à un sous-traitant',
    sourceTypes: ['Audit'],
    targetTypes: ['SousTraitant'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  A_ETE_INSPECTE_PAR: {
    type: 'A_ETE_INSPECTE_PAR',
    label: 'A été inspecté par',
    labelReverse: 'Inspecte le sous-traitant',
    description: 'Lie une inspection à un sous-traitant',
    sourceTypes: ['Inspection'],
    targetTypes: ['SousTraitant'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  GENERE_FINDING: {
    type: 'GENERE_FINDING',
    label: 'Génère le finding',
    labelReverse: 'Provient de l\'audit',
    description: 'Lie un audit à ses findings',
    sourceTypes: ['Audit'],
    targetTypes: ['Finding'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  INSPECTION_GENERE_FINDING: {
    type: 'INSPECTION_GENERE_FINDING',
    label: 'Génère le finding',
    labelReverse: 'Provient de l\'inspection',
    description: 'Lie une inspection à ses findings',
    sourceTypes: ['Inspection'],
    targetTypes: ['Finding'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  // Événements qualité
  QE_CONCERNE_ST: {
    type: 'QE_CONCERNE_ST',
    label: 'Concerne le sous-traitant',
    labelReverse: 'A pour événement qualité',
    description: 'Lie un événement qualité à un sous-traitant',
    sourceTypes: ['EvenementQualite'],
    targetTypes: ['SousTraitant'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  SURVENU_DANS_ETUDE: {
    type: 'SURVENU_DANS_ETUDE',
    label: 'Survenu dans l\'étude',
    labelReverse: 'A pour événement qualité',
    description: 'Lie un événement qualité à une étude clinique',
    sourceTypes: ['EvenementQualite'],
    targetTypes: ['EtudeClinique'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  QE_DECLENCHE_ALERTE: {
    type: 'QE_DECLENCHE_ALERTE',
    label: 'Déclenche l\'alerte',
    labelReverse: 'Déclenchée par événement qualité',
    description: 'Lie un événement qualité à une alerte',
    sourceTypes: ['EvenementQualite'],
    targetTypes: ['Alerte'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  AUDIT_DECLENCHE_ALERTE: {
    type: 'AUDIT_DECLENCHE_ALERTE',
    label: 'Déclenche l\'alerte',
    labelReverse: 'Déclenchée par audit',
    description: 'Lie un audit à une alerte',
    sourceTypes: ['Audit'],
    targetTypes: ['Alerte'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  // Décisions
  DECISION_JUSTIFIEE_PAR_AUDIT: {
    type: 'DECISION_JUSTIFIEE_PAR_AUDIT',
    label: 'Justifiée par l\'audit',
    labelReverse: 'Justifie la décision',
    description: 'Lie une décision à un audit',
    sourceTypes: ['Decision'],
    targetTypes: ['Audit'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  DECISION_JUSTIFIEE_PAR_QE: {
    type: 'DECISION_JUSTIFIEE_PAR_QE',
    label: 'Justifiée par l\'événement qualité',
    labelReverse: 'Justifie la décision',
    description: 'Lie une décision à un événement qualité',
    sourceTypes: ['Decision'],
    targetTypes: ['EvenementQualite'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  DECISION_JUSTIFIEE_PAR_INSPECTION: {
    type: 'DECISION_JUSTIFIEE_PAR_INSPECTION',
    label: 'Justifiée par l\'inspection',
    labelReverse: 'Justifie la décision',
    description: 'Lie une décision à une inspection',
    sourceTypes: ['Decision'],
    targetTypes: ['Inspection'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  DECISION_JUSTIFIEE_PAR_FINDING: {
    type: 'DECISION_JUSTIFIEE_PAR_FINDING',
    label: 'Justifiée par le finding',
    labelReverse: 'Justifie la décision',
    description: 'Lie une décision à un finding',
    sourceTypes: ['Decision'],
    targetTypes: ['Finding'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  RESULTE_DE_EVALUATION: {
    type: 'RESULTE_DE_EVALUATION',
    label: 'Résulte de l\'évaluation',
    labelReverse: 'A pour décision résultante',
    description: 'Lie une décision à une évaluation de risque',
    sourceTypes: ['Decision'],
    targetTypes: ['EvaluationRisque'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  // Évaluations
  A_FAIT_OBJET_EVALUATION: {
    type: 'A_FAIT_OBJET_EVALUATION',
    label: 'A fait l\'objet d\'évaluation',
    labelReverse: 'Évalue le sous-traitant',
    description: 'Lie une évaluation de risque à un sous-traitant',
    sourceTypes: ['EvaluationRisque'],
    targetTypes: ['SousTraitant'],
    hasProperties: true,
    properties: [
      { name: 'score_evaluation', label: 'Score', type: 'number', required: false },
      { name: 'en_reevaluation', label: 'En réévaluation', type: 'boolean', required: false },
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  A_POUR_CONTEXTE: {
    type: 'A_POUR_CONTEXTE',
    label: 'A pour contexte réglementaire',
    labelReverse: 'S\'applique à',
    description: 'Lie une entité à un contexte réglementaire',
    sourceTypes: ['SousTraitant', 'Audit', 'Inspection'],
    targetTypes: ['ContexteReglementaire'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  A_ETE_SUIVI_PAR: {
    type: 'A_ETE_SUIVI_PAR',
    label: 'A été suivi en réunion',
    labelReverse: 'Suit le sujet',
    description: 'Lie un sujet à une réunion qualité',
    sourceTypes: ['ReunionQualite'],
    targetTypes: ['SousTraitant', 'Audit', 'Finding', 'EvenementQualite'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  // Études cliniques
  IMPLIQUE_ST: {
    type: 'IMPLIQUE_ST',
    label: 'Implique le sous-traitant',
    labelReverse: 'Participe à l\'étude',
    description: 'Lie une étude clinique à ses sous-traitants',
    sourceTypes: ['EtudeClinique'],
    targetTypes: ['SousTraitant'],
    hasProperties: true,
    properties: [
      { name: 'role', label: 'Rôle', type: 'text', required: false },
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  // Événements
  CAUSE_EVENEMENT: {
    type: 'CAUSE_EVENEMENT',
    label: 'Cause l\'événement',
    labelReverse: 'Causé par',
    description: 'Lie une cause à un événement',
    sourceTypes: ['EvenementQualite', 'Finding'],
    targetTypes: ['Evenement'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  EVT_CONCERNE_ST: {
    type: 'EVT_CONCERNE_ST',
    label: 'Concerne le sous-traitant',
    labelReverse: 'A pour événement',
    description: 'Lie un événement à un sous-traitant',
    sourceTypes: ['Evenement'],
    targetTypes: ['SousTraitant'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },

  // KQI
  KQI_MESURE_ST: {
    type: 'KQI_MESURE_ST',
    label: 'Mesure le sous-traitant',
    labelReverse: 'Est mesuré par',
    description: 'Lie un KQI à un sous-traitant',
    sourceTypes: ['KQI'],
    targetTypes: ['SousTraitant'],
    hasProperties: true,
    properties: [
      { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
    ],
  },
};

// =============================================================================
// Fonctions utilitaires
// =============================================================================

/**
 * Récupère le schéma d'une relation par son type
 */
export function getRelationSchema(type: EdgeType): RelationSchema | undefined {
  return RELATION_SCHEMAS[type];
}

/**
 * Récupère le label d'une relation
 */
export function getRelationLabel(type: EdgeType): string {
  return RELATION_SCHEMAS[type]?.label ?? type.replace(/_/g, ' ').toLowerCase();
}

/**
 * Récupère le label inversé d'une relation (vue depuis la cible)
 */
export function getRelationLabelReverse(type: EdgeType): string {
  return RELATION_SCHEMAS[type]?.labelReverse ?? type.replace(/_/g, ' ').toLowerCase();
}

/**
 * Récupère les relations sortantes autorisées pour un type de nœud
 */
export function getOutgoingRelationsForType(nodeType: NodeType): EdgeType[] {
  return Object.entries(RELATION_SCHEMAS)
    .filter(([, schema]) => schema.sourceTypes.includes(nodeType))
    .map(([type]) => type as EdgeType);
}

/**
 * Récupère les relations entrantes autorisées pour un type de nœud
 */
export function getIncomingRelationsForType(nodeType: NodeType): EdgeType[] {
  return Object.entries(RELATION_SCHEMAS)
    .filter(([, schema]) => schema.targetTypes.includes(nodeType))
    .map(([type]) => type as EdgeType);
}

/**
 * Récupère les types de cibles valides pour une relation depuis un type source
 */
export function getValidTargetTypes(
  sourceType: NodeType,
  relationType: EdgeType
): NodeType[] {
  const schema = RELATION_SCHEMAS[relationType];
  if (!schema) return [];
  if (!schema.sourceTypes.includes(sourceType)) return [];
  return schema.targetTypes;
}

/**
 * Vérifie si une relation est valide entre deux types de nœuds
 */
export function isRelationValidBetweenTypes(
  sourceType: NodeType,
  targetType: NodeType,
  relationType: EdgeType
): boolean {
  const schema = RELATION_SCHEMAS[relationType];
  if (!schema) return false;
  return (
    schema.sourceTypes.includes(sourceType) &&
    schema.targetTypes.includes(targetType)
  );
}

/**
 * Récupère toutes les relations possibles entre deux types de nœuds
 */
export function getPossibleRelationsBetweenTypes(
  sourceType: NodeType,
  targetType: NodeType
): EdgeType[] {
  return Object.entries(RELATION_SCHEMAS)
    .filter(([, schema]) =>
      schema.sourceTypes.includes(sourceType) &&
      schema.targetTypes.includes(targetType)
    )
    .map(([type]) => type as EdgeType);
}

export default RELATION_SCHEMAS;
