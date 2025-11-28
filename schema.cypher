-- ============================================================================
-- KG-OVERSIGHT - SCHÉMA KUZU (CYPHER DDL)
-- Version: 1.0
-- Date: 2025-11-28
-- Compatible: Kuzu 0.7+
-- ============================================================================

-- ============================================================================
-- TABLES DE NŒUDS (16 types)
-- ============================================================================

-- Sous-traitants (CRO, laboratoires, logistique, etc.)
CREATE NODE TABLE SousTraitant (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Approuvé, Déclaré, Sous surveillance, En évaluation
    criticite STRING,           -- Critique, Majeur, Standard, Mineur
    date_creation DATE,
    type_service STRING,        -- CRO Full Service, Laboratoire Bioanalyse, etc.
    pays STRING,
    niveau_actuel INT16,        -- 1 = N1 (direct), 2 = N2 (sous-traitant de ST)
    source_donnees STRING
);

-- Contrats
CREATE NODE TABLE Contrat (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Actif, Archivé
    date_debut DATE,
    date_fin DATE,
    type_contrat STRING,        -- MSA, Service Agreement
    montant_annuel STRING,
    version INT16,
    source_donnees STRING
);

-- Accords Qualité (Quality Agreements)
CREATE NODE TABLE AccordQualite (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Signé, Archivé, En révision
    date_debut DATE,
    date_fin DATE,
    version INT16,
    revision_en_cours BOOLEAN,
    source_donnees STRING
);

-- Audits
CREATE NODE TABLE Audit (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Planifié, En cours, Clôturé
    criticite STRING,
    date_debut DATE,
    date_fin DATE,
    type_audit STRING,          -- Qualification, Routine, For Cause, Remote
    resultat STRING,            -- Satisfaisant, Satisfaisant avec observations, Non satisfaisant
    declencheur STRING,         -- ID de l'événement déclencheur (pour audit for cause)
    source_donnees STRING
);

-- Inspections réglementaires
CREATE NODE TABLE Inspection (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Planifié, En cours, Clôturé
    criticite STRING,
    date_debut DATE,
    date_fin DATE,
    autorite STRING,            -- ANSM, EMA, FDA, etc.
    type_inspection STRING,     -- Routine, For Cause, Pre-Approval
    resultat STRING,            -- Conforme, Non conforme
    nb_observations INT16,
    nb_critiques INT16,
    source_donnees STRING
);

-- Findings (écarts/observations)
CREATE NODE TABLE Finding (
    id STRING PRIMARY KEY,
    description STRING NOT NULL,
    statut STRING,              -- En cours, Clôturé
    criticite STRING,           -- Critique, Majeur, Mineur, Observation
    date_detection DATE,
    date_cloture DATE,
    capa_id STRING,             -- Référence CAPA associée
    concerne_st2 STRING,        -- ID du ST2 concerné si applicable
    source_donnees STRING
);

-- Événements Qualité (déviations, incidents)
CREATE NODE TABLE EvenementQualite (
    id STRING PRIMARY KEY,
    description STRING NOT NULL,
    statut STRING,              -- En cours, Clôturé
    criticite STRING,
    date_creation DATE,
    date_cloture DATE,
    impact STRING,              -- Faible, Moyen, Élevé
    nb_echantillons_impactes INT32,
    retard_jours INT16,
    nb_erreurs INT16,
    delai_detection_mois INT16,
    source_donnees STRING
);

-- Décisions managériales
CREATE NODE TABLE Decision (
    id STRING PRIMARY KEY,
    description STRING NOT NULL,
    statut STRING,              -- Appliquée, En cours
    criticite STRING,
    date_decision DATE,
    decideur STRING,
    nature STRING,              -- Approbation, Surveillance renforcée, Audit For Cause, etc.
    duree_mois INT16,
    source_donnees STRING
);

-- Évaluations de risque périodiques
CREATE NODE TABLE EvaluationRisque (
    id STRING PRIMARY KEY,
    description STRING NOT NULL,
    statut STRING,              -- En cours, Clôturé
    criticite STRING,
    date_evaluation DATE,
    score STRING,               -- Low, Medium, High
    evolution STRING,           -- Low→Medium, Medium→High, etc.
    findings_critiques INT16,
    qe_critiques INT16,
    kqi_alertes INT16,
    inspection_recente BOOLEAN,
    audit_for_cause BOOLEAN,
    prochaine_evaluation DATE,
    source_donnees STRING
);

-- Réunions Qualité (QOM)
CREATE NODE TABLE ReunionQualite (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Réalisé, Planifié
    criticite STRING,
    date_reunion DATE,
    trimestre STRING,           -- 2024-Q1, 2024-Q2, etc.
    semestre STRING,            -- 2024-S1, 2024-S2
    periodicite STRING,         -- Trimestrielle, Semestrielle, Mensuelle, Extraordinaire
    motif STRING,               -- Pour réunions extraordinaires
    source_donnees STRING
);

-- Études cliniques
CREATE NODE TABLE EtudeClinique (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Active, En démarrage, Planifiée, Clôturée
    criticite STRING,
    date_debut DATE,
    date_fin DATE,
    phase STRING,               -- I, II, III, IV
    indication STRING,          -- Oncologie, Cardiovasculaire, Neurologie, etc.
    nb_patients INT32,
    source_donnees STRING
);

-- Domaines de service
CREATE NODE TABLE DomaineService (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Actif, En réévaluation, Non évalué
    criticite STRING,
    date_creation DATE,
    categorie STRING,           -- Laboratoire, CRO, IT/Data, Logistique
    complexite STRING,          -- Faible, Moyenne, Haute, Très haute
    source_donnees STRING
);

-- Contexte réglementaire
CREATE NODE TABLE ContexteReglementaire (
    id STRING PRIMARY KEY,
    nom STRING NOT NULL,
    statut STRING,              -- Applicable, Abrogé
    criticite STRING,
    date_application DATE,
    reference STRING,           -- ICH E6(R3), EU 536/2014, etc.
    impact STRING,
    source_donnees STRING
);

-- Alertes générées par le système
CREATE NODE TABLE Alerte (
    id STRING PRIMARY KEY,
    description STRING NOT NULL,
    statut STRING,              -- Active, Acquittée, Résolue
    criticite STRING,
    date_creation DATE,
    date_resolution DATE,
    niveau STRING,              -- HAUTE, MOYENNE, BASSE
    regle_id STRING,            -- RGL-001, RGL-002, etc.
    declencheur STRING,         -- ID de l'élément déclencheur
    st_concerne STRING,         -- ID du ST concerné
    source_donnees STRING
);

-- Événements externes (réglementaires, demandes clients)
CREATE NODE TABLE Evenement (
    id STRING PRIMARY KEY,
    description STRING NOT NULL,
    statut STRING,              -- Actif, Clôturé, Planifié, En cours
    criticite STRING,
    date_creation DATE,
    date_cloture DATE,
    type_evenement STRING,      -- Réglementaire, Demande interne, Demande client, etc.
    source STRING,
    impact STRING,
    source_donnees STRING
);

-- ============================================================================
-- TABLES DE RELATIONS (18 types)
-- ============================================================================

-- Sous-traitant ↔ Contrat
CREATE REL TABLE EST_LIE_AU_CONTRAT (
    FROM SousTraitant TO Contrat,
    date_lien DATE,
    validite STRING              -- Active, Archivée
);

-- Sous-traitant ↔ Accord Qualité
CREATE REL TABLE EST_COUVERT_PAR_QA (
    FROM SousTraitant TO AccordQualite,
    date_lien DATE,
    validite STRING
);

-- Contrat/QA versioning
CREATE REL TABLE A_VERSION_SUIVANTE (
    FROM Contrat TO Contrat,
    date_lien DATE
);

CREATE REL TABLE QA_A_VERSION_SUIVANTE (
    FROM AccordQualite TO AccordQualite,
    date_lien DATE
);

-- Sous-traitant N2 → Sous-traitant N1
CREATE REL TABLE EST_SOUS_TRAITANT_DE (
    FROM SousTraitant TO SousTraitant,
    date_lien DATE,
    contexte_etudes STRING[]     -- Liste des IDs d'études concernées
);

-- Sous-traitant ↔ Audit
CREATE REL TABLE A_ETE_AUDITE_PAR (
    FROM SousTraitant TO Audit,
    date_lien DATE
);

-- Sous-traitant ↔ Inspection
CREATE REL TABLE A_ETE_INSPECTE_PAR (
    FROM SousTraitant TO Inspection,
    date_lien DATE
);

-- Audit/Inspection → Finding
CREATE REL TABLE GENERE_FINDING (
    FROM Audit TO Finding,
    date_lien DATE
);

CREATE REL TABLE INSPECTION_GENERE_FINDING (
    FROM Inspection TO Finding,
    date_lien DATE
);

-- Événement Qualité ↔ Sous-traitant
CREATE REL TABLE QE_CONCERNE_ST (
    FROM EvenementQualite TO SousTraitant,
    date_lien DATE
);

-- Événement Qualité ↔ Étude
CREATE REL TABLE SURVENU_DANS_ETUDE (
    FROM EvenementQualite TO EtudeClinique,
    date_lien DATE
);

-- Décision → Justification (Audit, QE, Inspection)
CREATE REL TABLE DECISION_JUSTIFIEE_PAR_AUDIT (
    FROM Decision TO Audit,
    date_lien DATE
);

CREATE REL TABLE DECISION_JUSTIFIEE_PAR_QE (
    FROM Decision TO EvenementQualite,
    date_lien DATE
);

CREATE REL TABLE DECISION_JUSTIFIEE_PAR_INSPECTION (
    FROM Decision TO Inspection,
    date_lien DATE
);

CREATE REL TABLE DECISION_JUSTIFIEE_PAR_FINDING (
    FROM Decision TO Finding,
    date_lien DATE
);

-- Décision → Évaluation de risque
CREATE REL TABLE RESULTE_DE_EVALUATION (
    FROM Decision TO EvaluationRisque,
    date_lien DATE
);

-- Décision → Contexte réglementaire
CREATE REL TABLE A_POUR_CONTEXTE (
    FROM Decision TO ContexteReglementaire,
    date_lien DATE
);

-- Sous-traitant → Domaine de service
CREATE REL TABLE POSSEDE_SERVICE (
    FROM SousTraitant TO DomaineService,
    date_lien DATE,
    score_evaluation INT16,
    en_reevaluation BOOLEAN
);

-- Sous-traitant → Évaluation de risque
CREATE REL TABLE A_FAIT_OBJET_EVALUATION (
    FROM SousTraitant TO EvaluationRisque,
    date_lien DATE
);

-- Sous-traitant → Réunion Qualité
CREATE REL TABLE A_ETE_SUIVI_PAR (
    FROM SousTraitant TO ReunionQualite,
    date_lien DATE
);

-- Déclencheurs d'alertes
CREATE REL TABLE QE_DECLENCHE_ALERTE (
    FROM EvenementQualite TO Alerte,
    date_lien DATE
);

CREATE REL TABLE AUDIT_DECLENCHE_ALERTE (
    FROM Audit TO Alerte,
    date_lien DATE
);

-- Contexte réglementaire → Événement
CREATE REL TABLE CAUSE_EVENEMENT (
    FROM ContexteReglementaire TO Evenement,
    date_lien DATE,
    impact STRING
);

-- Événement → Sous-traitant
CREATE REL TABLE EVT_CONCERNE_ST (
    FROM Evenement TO SousTraitant,
    date_lien DATE,
    impact STRING
);

-- Étude → Sous-traitant (relation centrale avec attributs riches)
CREATE REL TABLE IMPLIQUE_ST (
    FROM EtudeClinique TO SousTraitant,
    date_lien DATE,
    niveau INT16,                -- 1 ou 2
    role STRING,                 -- Gestion opérationnelle, Analyses bioanalytiques, etc.
    via STRING                   -- ID du ST N1 pour les ST N2 (null pour N1)
);

-- ============================================================================
-- INDEX POUR PERFORMANCES
-- ============================================================================

-- Index sur les colonnes fréquemment filtrées
CREATE INDEX idx_st_statut ON SousTraitant(statut);
CREATE INDEX idx_st_criticite ON SousTraitant(criticite);
CREATE INDEX idx_st_niveau ON SousTraitant(niveau_actuel);

CREATE INDEX idx_audit_statut ON Audit(statut);
CREATE INDEX idx_audit_type ON Audit(type_audit);

CREATE INDEX idx_finding_statut ON Finding(statut);
CREATE INDEX idx_finding_criticite ON Finding(criticite);

CREATE INDEX idx_qe_statut ON EvenementQualite(statut);
CREATE INDEX idx_qe_criticite ON EvenementQualite(criticite);

CREATE INDEX idx_etude_statut ON EtudeClinique(statut);
CREATE INDEX idx_etude_phase ON EtudeClinique(phase);

CREATE INDEX idx_alerte_statut ON Alerte(statut);
CREATE INDEX idx_alerte_niveau ON Alerte(niveau);

CREATE INDEX idx_eva_score ON EvaluationRisque(score);
