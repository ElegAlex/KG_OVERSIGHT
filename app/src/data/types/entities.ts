/**
 * KG-Oversight - Types d'entités du Knowledge Graph
 * Basé sur le schéma Kuzu (16 types de nœuds, 18+ types de relations)
 */

// =============================================================================
// Types de base
// =============================================================================

export type NodeType =
  | 'SousTraitant'
  | 'Contrat'
  | 'AccordQualite'
  | 'Audit'
  | 'Inspection'
  | 'Finding'
  | 'EvenementQualite'
  | 'Decision'
  | 'EvaluationRisque'
  | 'ReunionQualite'
  | 'EtudeClinique'
  | 'DomaineService'
  | 'ContexteReglementaire'
  | 'Alerte'
  | 'Evenement'
  | 'KQI';

export type EdgeType =
  | 'EST_LIE_AU_CONTRAT'
  | 'EST_COUVERT_PAR_QA'
  | 'A_VERSION_SUIVANTE'
  | 'QA_A_VERSION_SUIVANTE'
  | 'EST_SOUS_TRAITANT_DE'
  | 'A_ETE_AUDITE_PAR'
  | 'A_ETE_INSPECTE_PAR'
  | 'GENERE_FINDING'
  | 'INSPECTION_GENERE_FINDING'
  | 'QE_CONCERNE_ST'
  | 'SURVENU_DANS_ETUDE'
  | 'DECISION_JUSTIFIEE_PAR_AUDIT'
  | 'DECISION_JUSTIFIEE_PAR_QE'
  | 'DECISION_JUSTIFIEE_PAR_INSPECTION'
  | 'DECISION_JUSTIFIEE_PAR_FINDING'
  | 'RESULTE_DE_EVALUATION'
  | 'A_POUR_CONTEXTE'
  | 'POSSEDE_SERVICE'
  | 'A_FAIT_OBJET_EVALUATION'
  | 'A_ETE_SUIVI_PAR'
  | 'QE_DECLENCHE_ALERTE'
  | 'AUDIT_DECLENCHE_ALERTE'
  | 'CAUSE_EVENEMENT'
  | 'EVT_CONCERNE_ST'
  | 'IMPLIQUE_ST'
  | 'KQI_MESURE_ST';

export type Criticite = 'Critique' | 'Majeur' | 'Standard' | 'Mineur';
export type StatutST = 'Approuvé' | 'Déclaré' | 'Sous surveillance' | 'En évaluation';
export type NiveauAlerte = 'HAUTE' | 'MOYENNE' | 'BASSE';

/** Statuts génériques pour le filtrage */
export type StatutGenerique =
  | 'Actif'
  | 'Active'
  | 'Clôturé'
  | 'En cours'
  | 'Planifié'
  | 'Planifiée'
  | 'Archivé'
  | 'Réalisé'
  | 'Appliquée'
  | 'Résolue'
  | 'Signé'
  | 'Applicable'
  | 'En démarrage'
  | 'En évaluation'
  | 'En révision'
  | 'En réévaluation'
  | 'Non évalué'
  | 'Sous surveillance'
  | 'Approuvé'
  | 'Déclaré';

/** Catégories de statuts pour le filtrage simplifié */
export type CategorieStatut = 'actif' | 'cloture' | 'en_cours' | 'planifie' | 'archive';
export type ScoreRisque = 'Low' | 'Medium' | 'High';
export type Tendance = 'Amélioration' | 'Stable' | 'Dégradation';

// =============================================================================
// Interface de base pour tous les nœuds
// =============================================================================

export interface BaseNode {
  id: string;
  _type: NodeType;
  nom?: string;
  description?: string;
  statut?: string;
  criticite?: Criticite | '';
  source_donnees?: string;
}

// =============================================================================
// Entités typées
// =============================================================================

export interface SousTraitant extends BaseNode {
  _type: 'SousTraitant';
  nom: string;
  statut: StatutST;
  date_creation?: string;
  type_service?: string;
  pays?: string;
  niveau_actuel: 1 | 2;
}

export interface Contrat extends BaseNode {
  _type: 'Contrat';
  nom: string;
  date_debut?: string;
  date_fin?: string;
  type_contrat?: string;
  montant_annuel?: string;
  version?: number;
}

export interface AccordQualite extends BaseNode {
  _type: 'AccordQualite';
  nom: string;
  date_debut?: string;
  date_fin?: string;
  version?: number;
  revision_en_cours?: boolean;
}

export interface Audit extends BaseNode {
  _type: 'Audit';
  nom: string;
  date_debut?: string;
  date_fin?: string;
  type_audit?: 'Qualification' | 'Routine' | 'For Cause' | 'Remote';
  resultat?: 'Satisfaisant' | 'Satisfaisant avec observations' | 'Non satisfaisant';
  declencheur?: string;
}

export interface Inspection extends BaseNode {
  _type: 'Inspection';
  nom: string;
  date_debut?: string;
  date_fin?: string;
  autorite?: string;
  type_inspection?: 'Routine' | 'For Cause' | 'Pre-Approval';
  resultat?: 'Conforme' | 'Non conforme';
  nb_observations?: number;
  nb_critiques?: number;
}

export interface Finding extends BaseNode {
  _type: 'Finding';
  description: string;
  date_detection?: string;
  date_cloture?: string;
  capa_id?: string;
  concerne_st2?: string;
}

export interface EvenementQualite extends BaseNode {
  _type: 'EvenementQualite';
  description: string;
  date_creation?: string;
  date_cloture?: string;
  impact?: 'Faible' | 'Moyen' | 'Élevé';
  nb_echantillons_impactes?: number;
  retard_jours?: number;
  nb_erreurs?: number;
  delai_detection_mois?: number;
}

export interface Decision extends BaseNode {
  _type: 'Decision';
  description: string;
  date_decision?: string;
  decideur?: string;
  nature?: string;
  duree_mois?: number;
}

export interface EvaluationRisque extends BaseNode {
  _type: 'EvaluationRisque';
  description: string;
  date_evaluation?: string;
  score?: ScoreRisque;
  evolution?: string;
  findings_critiques?: number;
  qe_critiques?: number;
  kqi_alertes?: number;
  inspection_recente?: boolean;
  audit_for_cause?: boolean;
  prochaine_evaluation?: string;
}

export interface ReunionQualite extends BaseNode {
  _type: 'ReunionQualite';
  nom: string;
  date_reunion?: string;
  trimestre?: string;
  semestre?: string;
  periodicite?: 'Trimestrielle' | 'Semestrielle' | 'Mensuelle' | 'Extraordinaire';
  motif?: string;
}

export interface EtudeClinique extends BaseNode {
  _type: 'EtudeClinique';
  nom: string;
  date_debut?: string;
  date_fin?: string;
  phase?: 'I' | 'II' | 'III' | 'IV';
  indication?: string;
  nb_patients?: number;
}

export interface DomaineService extends BaseNode {
  _type: 'DomaineService';
  nom: string;
  date_creation?: string;
  categorie?: 'Laboratoire' | 'CRO' | 'IT/Data' | 'Logistique';
  complexite?: 'Faible' | 'Moyenne' | 'Haute' | 'Très haute';
}

export interface ContexteReglementaire extends BaseNode {
  _type: 'ContexteReglementaire';
  nom: string;
  date_application?: string;
  reference?: string;
  impact?: string;
}

export interface Alerte extends BaseNode {
  _type: 'Alerte';
  description: string;
  date_creation?: string;
  date_resolution?: string;
  niveau?: NiveauAlerte;
  regle_id?: string;
  declencheur?: string;
  st_concerne?: string;
}

export interface Evenement extends BaseNode {
  _type: 'Evenement';
  description: string;
  date_creation?: string;
  date_cloture?: string;
  type_evenement?: string;
  source?: string;
  impact?: string;
}

export interface KQI extends BaseNode {
  _type: 'KQI';
  sous_traitant_id: string;
  sous_traitant_nom: string;
  indicateur: string;
  periode: string;
  valeur: number;
  seuil_alerte: number;
  seuil_objectif: number;
  statut: 'OK' | 'Attention' | 'Alerte' | 'Critique';
  tendance: Tendance;
}

// =============================================================================
// Type union pour tous les nœuds
// =============================================================================

export type GraphNode =
  | SousTraitant
  | Contrat
  | AccordQualite
  | Audit
  | Inspection
  | Finding
  | EvenementQualite
  | Decision
  | EvaluationRisque
  | ReunionQualite
  | EtudeClinique
  | DomaineService
  | ContexteReglementaire
  | Alerte
  | Evenement
  | KQI;

// =============================================================================
// Interface pour les arêtes
// =============================================================================

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  _type: EdgeType;
  date_lien?: string;
  validite?: string;
  // Attributs spécifiques selon le type
  niveau?: 1 | 2;
  role?: string;
  via?: string;
  contexte_etudes?: string[];
  score_evaluation?: number;
  en_reevaluation?: boolean;
  impact?: string;
}

// =============================================================================
// Structure graphe complète
// =============================================================================

export interface KnowledgeGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

// =============================================================================
// Types pour la visualisation Sigma.js
// =============================================================================

export interface SigmaNodeAttributes {
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  nodeType: NodeType;  // Notre type métier (ne pas utiliser 'type' qui est réservé par Sigma.js)
  hidden?: boolean;
  highlighted?: boolean;
  forceLabel?: boolean;
}

export interface SigmaEdgeAttributes {
  size?: number;
  color?: string;
  type?: string;
  hidden?: boolean;
}
