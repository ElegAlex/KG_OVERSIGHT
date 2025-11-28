-- ============================================================================
-- SCRIPT D'IMPORT KUZU
-- Exécuter après avoir créé le schéma (schema.cypher)
-- ============================================================================

-- Import des nœuds
COPY SousTraitant FROM "nodes/SousTraitant.csv" (HEADER=true);
COPY Contrat FROM "nodes/Contrat.csv" (HEADER=true);
COPY AccordQualite FROM "nodes/AccordQualite.csv" (HEADER=true);
COPY Audit FROM "nodes/Audit.csv" (HEADER=true);
COPY Inspection FROM "nodes/Inspection.csv" (HEADER=true);
COPY Finding FROM "nodes/Finding.csv" (HEADER=true);
COPY EvenementQualite FROM "nodes/EvenementQualite.csv" (HEADER=true);
COPY Decision FROM "nodes/Decision.csv" (HEADER=true);
COPY EvaluationRisque FROM "nodes/EvaluationRisque.csv" (HEADER=true);
COPY ReunionQualite FROM "nodes/ReunionQualite.csv" (HEADER=true);
COPY EtudeClinique FROM "nodes/EtudeClinique.csv" (HEADER=true);
COPY DomaineService FROM "nodes/DomaineService.csv" (HEADER=true);
COPY ContexteReglementaire FROM "nodes/ContexteReglementaire.csv" (HEADER=true);
COPY Alerte FROM "nodes/Alerte.csv" (HEADER=true);
COPY Evenement FROM "nodes/Evenement.csv" (HEADER=true);

-- Import des relations
COPY EST_LIE_AU_CONTRAT FROM "relations/EST_LIE_AU_CONTRAT.csv" (HEADER=true);
COPY EST_COUVERT_PAR_QA FROM "relations/EST_COUVERT_PAR_QA.csv" (HEADER=true);
COPY A_VERSION_SUIVANTE FROM "relations/A_VERSION_SUIVANTE.csv" (HEADER=true);
COPY QA_A_VERSION_SUIVANTE FROM "relations/QA_A_VERSION_SUIVANTE.csv" (HEADER=true);
COPY EST_SOUS_TRAITANT_DE FROM "relations/EST_SOUS_TRAITANT_DE.csv" (HEADER=true);
COPY A_ETE_AUDITE_PAR FROM "relations/A_ETE_AUDITE_PAR.csv" (HEADER=true);
COPY A_ETE_INSPECTE_PAR FROM "relations/A_ETE_INSPECTE_PAR.csv" (HEADER=true);
COPY GENERE_FINDING FROM "relations/GENERE_FINDING.csv" (HEADER=true);
COPY INSPECTION_GENERE_FINDING FROM "relations/INSPECTION_GENERE_FINDING.csv" (HEADER=true);
COPY QE_CONCERNE_ST FROM "relations/QE_CONCERNE_ST.csv" (HEADER=true);
COPY SURVENU_DANS_ETUDE FROM "relations/SURVENU_DANS_ETUDE.csv" (HEADER=true);
COPY DECISION_JUSTIFIEE_PAR_AUDIT FROM "relations/DECISION_JUSTIFIEE_PAR_AUDIT.csv" (HEADER=true);
COPY DECISION_JUSTIFIEE_PAR_QE FROM "relations/DECISION_JUSTIFIEE_PAR_QE.csv" (HEADER=true);
COPY DECISION_JUSTIFIEE_PAR_INSPECTION FROM "relations/DECISION_JUSTIFIEE_PAR_INSPECTION.csv" (HEADER=true);
COPY DECISION_JUSTIFIEE_PAR_FINDING FROM "relations/DECISION_JUSTIFIEE_PAR_FINDING.csv" (HEADER=true);
COPY RESULTE_DE_EVALUATION FROM "relations/RESULTE_DE_EVALUATION.csv" (HEADER=true);
COPY A_POUR_CONTEXTE FROM "relations/A_POUR_CONTEXTE.csv" (HEADER=true);
COPY POSSEDE_SERVICE FROM "relations/POSSEDE_SERVICE.csv" (HEADER=true);
COPY A_FAIT_OBJET_EVALUATION FROM "relations/A_FAIT_OBJET_EVALUATION.csv" (HEADER=true);
COPY A_ETE_SUIVI_PAR FROM "relations/A_ETE_SUIVI_PAR.csv" (HEADER=true);
COPY QE_DECLENCHE_ALERTE FROM "relations/QE_DECLENCHE_ALERTE.csv" (HEADER=true);
COPY AUDIT_DECLENCHE_ALERTE FROM "relations/AUDIT_DECLENCHE_ALERTE.csv" (HEADER=true);
COPY CAUSE_EVENEMENT FROM "relations/CAUSE_EVENEMENT.csv" (HEADER=true);
COPY EVT_CONCERNE_ST FROM "relations/EVT_CONCERNE_ST.csv" (HEADER=true);
COPY IMPLIQUE_ST FROM "relations/IMPLIQUE_ST.csv" (HEADER=true);
