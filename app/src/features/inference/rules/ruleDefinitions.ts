/**
 * KG-Oversight - Définitions des règles d'inférence
 * Règles métier pour la génération automatique d'alertes
 */

import type { GraphNode, GraphEdge, SousTraitant, Audit, Finding, EvenementQualite, KQI, Alerte } from '@data/types';

// Types pour le moteur de règles
export type AlertLevel = 'HAUTE' | 'MOYENNE' | 'BASSE';

export interface InferredAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  description: string;
  level: AlertLevel;
  stId: string;
  stName: string;
  triggerNodeId: string;
  triggerNodeType: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface RuleContext {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  stId: string;
  st: SousTraitant;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'audit' | 'finding' | 'qe' | 'kqi' | 'inspection' | 'global';
  defaultLevel: AlertLevel;
  evaluate: (context: RuleContext) => InferredAlert[];
}

// =============================================================================
// Règles sur les Audits
// =============================================================================

export const RULE_AUDIT_FOR_CAUSE: Rule = {
  id: 'RGL-001',
  name: 'Audit For Cause déclenché',
  description: 'Un audit "For Cause" a été déclenché pour ce sous-traitant',
  category: 'audit',
  defaultLevel: 'HAUTE',
  evaluate: (ctx) => {
    const alerts: InferredAlert[] = [];

    for (const [, edge] of ctx.edges) {
      if (edge._type !== 'A_ETE_AUDITE_PAR') continue;
      if (edge.source !== ctx.stId) continue;

      const auditNode = ctx.nodes.get(edge.target);
      if (!auditNode || auditNode._type !== 'Audit') continue;

      const audit = auditNode as Audit;
      if (audit.type_audit === 'For Cause') {
        alerts.push({
          id: `${RULE_AUDIT_FOR_CAUSE.id}-${audit.id}`,
          ruleId: RULE_AUDIT_FOR_CAUSE.id,
          ruleName: RULE_AUDIT_FOR_CAUSE.name,
          description: `Audit For Cause "${audit.nom}" déclenché pour ${ctx.st.nom}`,
          level: 'HAUTE',
          stId: ctx.stId,
          stName: ctx.st.nom,
          triggerNodeId: audit.id,
          triggerNodeType: 'Audit',
          createdAt: audit.date_debut ? new Date(audit.date_debut) : new Date(),
          metadata: { auditId: audit.id, auditName: audit.nom, declencheur: audit.declencheur },
        });
      }
    }

    return alerts;
  },
};

export const RULE_AUDIT_NON_SATISFAISANT: Rule = {
  id: 'RGL-002',
  name: 'Audit non satisfaisant',
  description: 'Un audit s\'est terminé avec un résultat non satisfaisant',
  category: 'audit',
  defaultLevel: 'HAUTE',
  evaluate: (ctx) => {
    const alerts: InferredAlert[] = [];

    for (const [, edge] of ctx.edges) {
      if (edge._type !== 'A_ETE_AUDITE_PAR') continue;
      if (edge.source !== ctx.stId) continue;

      const auditNode = ctx.nodes.get(edge.target);
      if (!auditNode || auditNode._type !== 'Audit') continue;

      const audit = auditNode as Audit;
      if (audit.resultat === 'Non satisfaisant') {
        alerts.push({
          id: `${RULE_AUDIT_NON_SATISFAISANT.id}-${audit.id}`,
          ruleId: RULE_AUDIT_NON_SATISFAISANT.id,
          ruleName: RULE_AUDIT_NON_SATISFAISANT.name,
          description: `Audit "${audit.nom}" avec résultat non satisfaisant`,
          level: 'HAUTE',
          stId: ctx.stId,
          stName: ctx.st.nom,
          triggerNodeId: audit.id,
          triggerNodeType: 'Audit',
          createdAt: audit.date_fin ? new Date(audit.date_fin) : new Date(),
          metadata: { auditId: audit.id, resultat: audit.resultat },
        });
      }
    }

    return alerts;
  },
};

// =============================================================================
// Règles sur les Findings
// =============================================================================

export const RULE_FINDING_CRITIQUE_OUVERT: Rule = {
  id: 'RGL-003',
  name: 'Finding critique non clôturé',
  description: 'Un finding critique reste ouvert au-delà du délai acceptable',
  category: 'finding',
  defaultLevel: 'HAUTE',
  evaluate: (ctx) => {
    const alerts: InferredAlert[] = [];
    const now = new Date();
    const DELAY_DAYS = 30; // Délai max avant alerte

    // Trouver les audits du ST
    const stAuditIds = new Set<string>();
    for (const [, edge] of ctx.edges) {
      if (edge._type === 'A_ETE_AUDITE_PAR' && edge.source === ctx.stId) {
        stAuditIds.add(edge.target);
      }
    }

    // Chercher les findings critiques ouverts de ces audits
    for (const [, edge] of ctx.edges) {
      if (edge._type !== 'GENERE_FINDING') continue;
      if (!stAuditIds.has(edge.source)) continue;

      const findingNode = ctx.nodes.get(edge.target);
      if (!findingNode || findingNode._type !== 'Finding') continue;

      const finding = findingNode as Finding;
      if (finding.criticite !== 'Critique' || finding.statut === 'Clôturé') continue;

      // Vérifier le délai
      const detectionDate = finding.date_detection ? new Date(finding.date_detection) : null;
      if (detectionDate) {
        const daysSinceDetection = Math.floor((now.getTime() - detectionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceDetection > DELAY_DAYS) {
          alerts.push({
            id: `${RULE_FINDING_CRITIQUE_OUVERT.id}-${finding.id}`,
            ruleId: RULE_FINDING_CRITIQUE_OUVERT.id,
            ruleName: RULE_FINDING_CRITIQUE_OUVERT.name,
            description: `Finding critique ouvert depuis ${daysSinceDetection} jours`,
            level: 'HAUTE',
            stId: ctx.stId,
            stName: ctx.st.nom,
            triggerNodeId: finding.id,
            triggerNodeType: 'Finding',
            createdAt: detectionDate,
            metadata: { findingId: finding.id, daysSinceDetection, description: finding.description },
          });
        }
      }
    }

    return alerts;
  },
};

export const RULE_FINDINGS_MULTIPLES: Rule = {
  id: 'RGL-004',
  name: 'Accumulation de findings',
  description: 'Plus de 3 findings ouverts pour le même sous-traitant',
  category: 'finding',
  defaultLevel: 'MOYENNE',
  evaluate: (ctx) => {
    const alerts: InferredAlert[] = [];

    // Compter les findings ouverts
    const stAuditIds = new Set<string>();
    for (const [, edge] of ctx.edges) {
      if (edge._type === 'A_ETE_AUDITE_PAR' && edge.source === ctx.stId) {
        stAuditIds.add(edge.target);
      }
    }

    let openFindingsCount = 0;
    const openFindings: Finding[] = [];

    for (const [, edge] of ctx.edges) {
      if (edge._type !== 'GENERE_FINDING') continue;
      if (!stAuditIds.has(edge.source)) continue;

      const findingNode = ctx.nodes.get(edge.target);
      if (!findingNode || findingNode._type !== 'Finding') continue;

      const finding = findingNode as Finding;
      if (finding.statut !== 'Clôturé') {
        openFindingsCount++;
        openFindings.push(finding);
      }
    }

    if (openFindingsCount > 3) {
      alerts.push({
        id: `${RULE_FINDINGS_MULTIPLES.id}-${ctx.stId}`,
        ruleId: RULE_FINDINGS_MULTIPLES.id,
        ruleName: RULE_FINDINGS_MULTIPLES.name,
        description: `${openFindingsCount} findings ouverts pour ${ctx.st.nom}`,
        level: openFindingsCount > 5 ? 'HAUTE' : 'MOYENNE',
        stId: ctx.stId,
        stName: ctx.st.nom,
        triggerNodeId: ctx.stId,
        triggerNodeType: 'SousTraitant',
        createdAt: new Date(),
        metadata: { count: openFindingsCount, findingIds: openFindings.map((f) => f.id) },
      });
    }

    return alerts;
  },
};

// =============================================================================
// Règles sur les KQI
// =============================================================================

export const RULE_KQI_DEGRADATION: Rule = {
  id: 'RGL-005',
  name: 'Dégradation KQI',
  description: 'Un ou plusieurs KQI montrent une tendance à la dégradation',
  category: 'kqi',
  defaultLevel: 'MOYENNE',
  evaluate: (ctx) => {
    const alerts: InferredAlert[] = [];

    // Trouver les KQI du ST
    const stKQIs: KQI[] = [];
    for (const [, node] of ctx.nodes) {
      if (node._type === 'KQI') {
        const kqi = node as KQI;
        if (kqi.sous_traitant_id === ctx.stId) {
          stKQIs.push(kqi);
        }
      }
    }

    // Grouper par indicateur et prendre le plus récent
    const latestByIndicator = new Map<string, KQI>();
    for (const kqi of stKQIs) {
      const existing = latestByIndicator.get(kqi.indicateur);
      if (!existing || kqi.periode > existing.periode) {
        latestByIndicator.set(kqi.indicateur, kqi);
      }
    }

    // Compter les dégradations
    const degradingKQIs = Array.from(latestByIndicator.values()).filter(
      (kqi) => kqi.tendance === 'Dégradation'
    );

    if (degradingKQIs.length >= 2) {
      alerts.push({
        id: `${RULE_KQI_DEGRADATION.id}-${ctx.stId}`,
        ruleId: RULE_KQI_DEGRADATION.id,
        ruleName: RULE_KQI_DEGRADATION.name,
        description: `${degradingKQIs.length} indicateurs en dégradation pour ${ctx.st.nom}`,
        level: degradingKQIs.length >= 3 ? 'HAUTE' : 'MOYENNE',
        stId: ctx.stId,
        stName: ctx.st.nom,
        triggerNodeId: ctx.stId,
        triggerNodeType: 'SousTraitant',
        createdAt: new Date(),
        metadata: {
          indicators: degradingKQIs.map((k) => ({ name: k.indicateur, value: k.valeur, status: k.statut })),
        },
      });
    }

    return alerts;
  },
};

export const RULE_KQI_ALERTE: Rule = {
  id: 'RGL-006',
  name: 'KQI en alerte',
  description: 'Un ou plusieurs KQI dépassent le seuil d\'alerte',
  category: 'kqi',
  defaultLevel: 'HAUTE',
  evaluate: (ctx) => {
    const alerts: InferredAlert[] = [];

    // Trouver les KQI du ST
    const stKQIs: KQI[] = [];
    for (const [, node] of ctx.nodes) {
      if (node._type === 'KQI') {
        const kqi = node as KQI;
        if (kqi.sous_traitant_id === ctx.stId) {
          stKQIs.push(kqi);
        }
      }
    }

    // Grouper par indicateur et prendre le plus récent
    const latestByIndicator = new Map<string, KQI>();
    for (const kqi of stKQIs) {
      const existing = latestByIndicator.get(kqi.indicateur);
      if (!existing || kqi.periode > existing.periode) {
        latestByIndicator.set(kqi.indicateur, kqi);
      }
    }

    // Chercher les KQI en alerte
    const alertKQIs = Array.from(latestByIndicator.values()).filter(
      (kqi) => kqi.statut === 'Alerte' || kqi.statut === 'Critique'
    );

    for (const kqi of alertKQIs) {
      alerts.push({
        id: `${RULE_KQI_ALERTE.id}-${kqi.id}`,
        ruleId: RULE_KQI_ALERTE.id,
        ruleName: RULE_KQI_ALERTE.name,
        description: `KQI "${kqi.indicateur}" en ${kqi.statut} (valeur: ${kqi.valeur})`,
        level: kqi.statut === 'Critique' ? 'HAUTE' : 'MOYENNE',
        stId: ctx.stId,
        stName: ctx.st.nom,
        triggerNodeId: kqi.id,
        triggerNodeType: 'KQI',
        createdAt: new Date(),
        metadata: {
          indicateur: kqi.indicateur,
          valeur: kqi.valeur,
          seuil_alerte: kqi.seuil_alerte,
          seuil_objectif: kqi.seuil_objectif,
        },
      });
    }

    return alerts;
  },
};

// =============================================================================
// Règles sur les Événements Qualité
// =============================================================================

export const RULE_QE_CRITIQUE: Rule = {
  id: 'RGL-007',
  name: 'Événement qualité critique',
  description: 'Un événement qualité critique impacte ce sous-traitant',
  category: 'qe',
  defaultLevel: 'HAUTE',
  evaluate: (ctx) => {
    const alerts: InferredAlert[] = [];

    for (const [, edge] of ctx.edges) {
      if (edge._type !== 'QE_CONCERNE_ST') continue;
      if (edge.target !== ctx.stId) continue;

      const qeNode = ctx.nodes.get(edge.source);
      if (!qeNode || qeNode._type !== 'EvenementQualite') continue;

      const qe = qeNode as EvenementQualite;
      if (qe.criticite === 'Critique' && qe.statut !== 'Clôturé') {
        alerts.push({
          id: `${RULE_QE_CRITIQUE.id}-${qe.id}`,
          ruleId: RULE_QE_CRITIQUE.id,
          ruleName: RULE_QE_CRITIQUE.name,
          description: `Événement qualité critique: ${qe.description?.substring(0, 50)}...`,
          level: 'HAUTE',
          stId: ctx.stId,
          stName: ctx.st.nom,
          triggerNodeId: qe.id,
          triggerNodeType: 'EvenementQualite',
          createdAt: qe.date_creation ? new Date(qe.date_creation) : new Date(),
          metadata: {
            qeId: qe.id,
            impact: qe.impact,
            description: qe.description,
          },
        });
      }
    }

    return alerts;
  },
};

// =============================================================================
// Export de toutes les règles
// =============================================================================

export const ALL_RULES: Rule[] = [
  RULE_AUDIT_FOR_CAUSE,
  RULE_AUDIT_NON_SATISFAISANT,
  RULE_FINDING_CRITIQUE_OUVERT,
  RULE_FINDINGS_MULTIPLES,
  RULE_KQI_DEGRADATION,
  RULE_KQI_ALERTE,
  RULE_QE_CRITIQUE,
];

export const RULES_BY_CATEGORY: Record<string, Rule[]> = {
  audit: [RULE_AUDIT_FOR_CAUSE, RULE_AUDIT_NON_SATISFAISANT],
  finding: [RULE_FINDING_CRITIQUE_OUVERT, RULE_FINDINGS_MULTIPLES],
  kqi: [RULE_KQI_DEGRADATION, RULE_KQI_ALERTE],
  qe: [RULE_QE_CRITIQUE],
};
