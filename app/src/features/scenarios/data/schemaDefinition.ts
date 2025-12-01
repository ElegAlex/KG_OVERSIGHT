/**
 * KG-Oversight - Définition du schéma ERD du Knowledge Graph
 * Modèle entités-relations pour l'éditeur de scénarios
 */

import type { NodeType, EdgeType } from '@data/types/entities';

// =============================================================================
// Types pour le schéma ERD
// =============================================================================

export interface SchemaEntity {
  type: NodeType;
  label: string;
  description: string;
  category: 'core' | 'quality' | 'compliance' | 'monitoring';
  color: string;
  icon: string;
  attributes: string[];
}

export interface SchemaRelation {
  type: EdgeType;
  label: string;
  description: string;
  source: NodeType;
  target: NodeType;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
}

// =============================================================================
// Définition des entités
// =============================================================================

export const schemaEntities: SchemaEntity[] = [
  // Core entities
  {
    type: 'SousTraitant',
    label: 'Sous-traitant',
    description: 'Fournisseur ou prestataire externe',
    category: 'core',
    color: '#6366f1',
    icon: 'Building2',
    attributes: ['nom', 'statut', 'niveau_actuel', 'pays', 'type_service'],
  },
  {
    type: 'Contrat',
    label: 'Contrat',
    description: 'Accord contractuel avec un sous-traitant',
    category: 'core',
    color: '#8b5cf6',
    icon: 'FileText',
    attributes: ['nom', 'date_debut', 'date_fin', 'type_contrat', 'montant_annuel'],
  },
  {
    type: 'AccordQualite',
    label: 'Accord Qualité',
    description: 'Quality Agreement définissant les responsabilités',
    category: 'core',
    color: '#a855f7',
    icon: 'FileCheck',
    attributes: ['nom', 'date_debut', 'date_fin', 'version'],
  },
  {
    type: 'EtudeClinique',
    label: 'Étude Clinique',
    description: 'Essai clinique impliquant des sous-traitants',
    category: 'core',
    color: '#ec4899',
    icon: 'FlaskConical',
    attributes: ['nom', 'phase', 'indication', 'nb_patients', 'statut'],
  },
  {
    type: 'DomaineService',
    label: 'Domaine de Service',
    description: 'Type de service fourni par un sous-traitant',
    category: 'core',
    color: '#f43f5e',
    icon: 'Layers',
    attributes: ['nom', 'categorie', 'complexite'],
  },

  // Quality entities
  {
    type: 'Audit',
    label: 'Audit',
    description: 'Audit qualité d\'un sous-traitant',
    category: 'quality',
    color: '#22c55e',
    icon: 'ClipboardCheck',
    attributes: ['nom', 'type_audit', 'date_debut', 'date_fin', 'resultat'],
  },
  {
    type: 'Inspection',
    label: 'Inspection',
    description: 'Inspection réglementaire par une autorité',
    category: 'quality',
    color: '#10b981',
    icon: 'Search',
    attributes: ['nom', 'autorite', 'type_inspection', 'resultat', 'nb_observations'],
  },
  {
    type: 'Finding',
    label: 'Finding',
    description: 'Écart ou observation identifié lors d\'un audit/inspection',
    category: 'quality',
    color: '#14b8a6',
    icon: 'AlertTriangle',
    attributes: ['description', 'criticite', 'statut', 'date_detection', 'capa_id'],
  },
  {
    type: 'EvenementQualite',
    label: 'Événement Qualité',
    description: 'Déviation, CAPA, ou incident qualité',
    category: 'quality',
    color: '#06b6d4',
    icon: 'AlertCircle',
    attributes: ['description', 'criticite', 'impact', 'statut', 'date_creation'],
  },
  {
    type: 'ReunionQualite',
    label: 'Réunion Qualité',
    description: 'Comité ou revue qualité périodique',
    category: 'quality',
    color: '#0891b2',
    icon: 'Users',
    attributes: ['nom', 'date_reunion', 'periodicite', 'motif'],
  },

  // Compliance entities
  {
    type: 'Decision',
    label: 'Décision',
    description: 'Décision formelle concernant un sous-traitant',
    category: 'compliance',
    color: '#f59e0b',
    icon: 'Gavel',
    attributes: ['description', 'nature', 'decideur', 'date_decision'],
  },
  {
    type: 'EvaluationRisque',
    label: 'Évaluation Risque',
    description: 'Évaluation du niveau de risque d\'un sous-traitant',
    category: 'compliance',
    color: '#f97316',
    icon: 'Shield',
    attributes: ['description', 'score', 'date_evaluation', 'evolution'],
  },
  {
    type: 'ContexteReglementaire',
    label: 'Contexte Réglementaire',
    description: 'Référentiel ou exigence réglementaire applicable',
    category: 'compliance',
    color: '#ef4444',
    icon: 'Scale',
    attributes: ['nom', 'reference', 'date_application', 'impact'],
  },

  // Monitoring entities
  {
    type: 'KQI',
    label: 'KQI',
    description: 'Key Quality Indicator - indicateur de performance',
    category: 'monitoring',
    color: '#3b82f6',
    icon: 'BarChart3',
    attributes: ['indicateur', 'valeur', 'seuil_alerte', 'seuil_objectif', 'tendance'],
  },
  {
    type: 'Alerte',
    label: 'Alerte',
    description: 'Alerte générée par le système de surveillance',
    category: 'monitoring',
    color: '#ef4444',
    icon: 'Bell',
    attributes: ['description', 'niveau', 'date_creation', 'regle_id'],
  },
  {
    type: 'Evenement',
    label: 'Événement',
    description: 'Événement générique dans le système',
    category: 'monitoring',
    color: '#64748b',
    icon: 'Calendar',
    attributes: ['description', 'type_evenement', 'date_creation', 'source'],
  },
];

// =============================================================================
// Définition des relations
// =============================================================================

export const schemaRelations: SchemaRelation[] = [
  // Relations Contrat/QA
  {
    type: 'EST_LIE_AU_CONTRAT',
    label: 'Est lié au contrat',
    description: 'Le sous-traitant est lié par ce contrat',
    source: 'SousTraitant',
    target: 'Contrat',
    cardinality: '1:N',
  },
  {
    type: 'EST_COUVERT_PAR_QA',
    label: 'Est couvert par QA',
    description: 'Le contrat est couvert par cet accord qualité',
    source: 'Contrat',
    target: 'AccordQualite',
    cardinality: '1:1',
  },
  {
    type: 'A_VERSION_SUIVANTE',
    label: 'A version suivante',
    description: 'Version suivante du contrat',
    source: 'Contrat',
    target: 'Contrat',
    cardinality: '1:1',
  },
  {
    type: 'QA_A_VERSION_SUIVANTE',
    label: 'QA version suivante',
    description: 'Version suivante de l\'accord qualité',
    source: 'AccordQualite',
    target: 'AccordQualite',
    cardinality: '1:1',
  },

  // Relations sous-traitance
  {
    type: 'EST_SOUS_TRAITANT_DE',
    label: 'Est sous-traitant de',
    description: 'Relation de sous-traitance N1/N2',
    source: 'SousTraitant',
    target: 'SousTraitant',
    cardinality: 'N:M',
  },
  {
    type: 'IMPLIQUE_ST',
    label: 'Implique ST',
    description: 'L\'étude clinique implique ce sous-traitant',
    source: 'EtudeClinique',
    target: 'SousTraitant',
    cardinality: 'N:M',
  },
  {
    type: 'POSSEDE_SERVICE',
    label: 'Possède service',
    description: 'Le sous-traitant fournit ce domaine de service',
    source: 'SousTraitant',
    target: 'DomaineService',
    cardinality: '1:N',
  },

  // Relations Audit/Inspection
  {
    type: 'A_ETE_AUDITE_PAR',
    label: 'A été audité par',
    description: 'Le sous-traitant a été audité',
    source: 'SousTraitant',
    target: 'Audit',
    cardinality: '1:N',
  },
  {
    type: 'A_ETE_INSPECTE_PAR',
    label: 'A été inspecté par',
    description: 'Le sous-traitant a été inspecté',
    source: 'SousTraitant',
    target: 'Inspection',
    cardinality: '1:N',
  },
  {
    type: 'GENERE_FINDING',
    label: 'Génère finding',
    description: 'L\'audit a généré ce finding',
    source: 'Audit',
    target: 'Finding',
    cardinality: '1:N',
  },
  {
    type: 'INSPECTION_GENERE_FINDING',
    label: 'Inspection génère finding',
    description: 'L\'inspection a généré ce finding',
    source: 'Inspection',
    target: 'Finding',
    cardinality: '1:N',
  },

  // Relations Événements Qualité
  {
    type: 'QE_CONCERNE_ST',
    label: 'QE concerne ST',
    description: 'L\'événement qualité concerne ce sous-traitant',
    source: 'EvenementQualite',
    target: 'SousTraitant',
    cardinality: 'N:1',
  },
  {
    type: 'SURVENU_DANS_ETUDE',
    label: 'Survenu dans étude',
    description: 'L\'événement est survenu dans cette étude',
    source: 'EvenementQualite',
    target: 'EtudeClinique',
    cardinality: 'N:1',
  },
  {
    type: 'A_ETE_SUIVI_PAR',
    label: 'A été suivi par',
    description: 'L\'événement a été discuté en réunion qualité',
    source: 'EvenementQualite',
    target: 'ReunionQualite',
    cardinality: 'N:M',
  },

  // Relations Décisions
  {
    type: 'DECISION_JUSTIFIEE_PAR_AUDIT',
    label: 'Justifiée par audit',
    description: 'La décision est justifiée par cet audit',
    source: 'Decision',
    target: 'Audit',
    cardinality: 'N:M',
  },
  {
    type: 'DECISION_JUSTIFIEE_PAR_QE',
    label: 'Justifiée par QE',
    description: 'La décision est justifiée par cet événement qualité',
    source: 'Decision',
    target: 'EvenementQualite',
    cardinality: 'N:M',
  },
  {
    type: 'DECISION_JUSTIFIEE_PAR_INSPECTION',
    label: 'Justifiée par inspection',
    description: 'La décision est justifiée par cette inspection',
    source: 'Decision',
    target: 'Inspection',
    cardinality: 'N:M',
  },
  {
    type: 'DECISION_JUSTIFIEE_PAR_FINDING',
    label: 'Justifiée par finding',
    description: 'La décision est justifiée par ce finding',
    source: 'Decision',
    target: 'Finding',
    cardinality: 'N:M',
  },
  {
    type: 'RESULTE_DE_EVALUATION',
    label: 'Résulte de évaluation',
    description: 'La décision résulte de cette évaluation de risque',
    source: 'Decision',
    target: 'EvaluationRisque',
    cardinality: 'N:1',
  },

  // Relations Évaluation/Contexte
  {
    type: 'A_FAIT_OBJET_EVALUATION',
    label: 'A fait objet évaluation',
    description: 'Le sous-traitant a fait l\'objet de cette évaluation',
    source: 'SousTraitant',
    target: 'EvaluationRisque',
    cardinality: '1:N',
  },
  {
    type: 'A_POUR_CONTEXTE',
    label: 'A pour contexte',
    description: 'S\'applique dans ce contexte réglementaire',
    source: 'SousTraitant',
    target: 'ContexteReglementaire',
    cardinality: 'N:M',
  },

  // Relations Alertes
  {
    type: 'QE_DECLENCHE_ALERTE',
    label: 'QE déclenche alerte',
    description: 'L\'événement qualité a déclenché cette alerte',
    source: 'EvenementQualite',
    target: 'Alerte',
    cardinality: '1:N',
  },
  {
    type: 'AUDIT_DECLENCHE_ALERTE',
    label: 'Audit déclenche alerte',
    description: 'L\'audit a déclenché cette alerte',
    source: 'Audit',
    target: 'Alerte',
    cardinality: '1:N',
  },

  // Relations Événements
  {
    type: 'CAUSE_EVENEMENT',
    label: 'Cause événement',
    description: 'Cette entité a causé l\'événement',
    source: 'EvenementQualite',
    target: 'Evenement',
    cardinality: '1:N',
  },
  {
    type: 'EVT_CONCERNE_ST',
    label: 'Événement concerne ST',
    description: 'L\'événement concerne ce sous-traitant',
    source: 'Evenement',
    target: 'SousTraitant',
    cardinality: 'N:1',
  },

  // Relations KQI
  {
    type: 'KQI_MESURE_ST',
    label: 'KQI mesure ST',
    description: 'Ce KQI mesure la performance du sous-traitant',
    source: 'KQI',
    target: 'SousTraitant',
    cardinality: 'N:1',
  },
];

// =============================================================================
// Helpers
// =============================================================================

export const getEntityByType = (type: NodeType): SchemaEntity | undefined => {
  return schemaEntities.find((e) => e.type === type);
};

export const getRelationsBySource = (source: NodeType): SchemaRelation[] => {
  return schemaRelations.filter((r) => r.source === source);
};

export const getRelationsByTarget = (target: NodeType): SchemaRelation[] => {
  return schemaRelations.filter((r) => r.target === target);
};

export const getRelationBetween = (source: NodeType, target: NodeType): SchemaRelation | undefined => {
  return schemaRelations.find((r) => r.source === source && r.target === target);
};

export const getConnectedEntities = (type: NodeType): NodeType[] => {
  const connected = new Set<NodeType>();

  for (const rel of schemaRelations) {
    if (rel.source === type) connected.add(rel.target);
    if (rel.target === type) connected.add(rel.source);
  }

  return Array.from(connected);
};

export const categoryColors: Record<SchemaEntity['category'], string> = {
  core: '#8b5cf6',
  quality: '#22c55e',
  compliance: '#f59e0b',
  monitoring: '#3b82f6',
};

export const categoryLabels: Record<SchemaEntity['category'], string> = {
  core: 'Entités principales',
  quality: 'Qualité',
  compliance: 'Conformité',
  monitoring: 'Surveillance',
};
