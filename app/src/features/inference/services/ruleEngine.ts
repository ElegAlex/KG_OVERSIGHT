/**
 * KG-Oversight - Moteur de règles d'inférence
 * Évalue les règles et génère des alertes
 */

import type { GraphNode, GraphEdge, SousTraitant } from '@data/types';
import { ALL_RULES, type Rule, type InferredAlert, type RuleContext } from '../rules/ruleDefinitions';

export interface RuleEngineResult {
  alerts: InferredAlert[];
  rulesEvaluated: number;
  stsEvaluated: number;
  executionTimeMs: number;
  alertsByLevel: Record<string, number>;
  alertsByST: Record<string, number>;
}

/**
 * Moteur de règles d'inférence
 * Évalue toutes les règles pour tous les sous-traitants
 */
export class RuleEngine {
  private rules: Rule[];
  private enabled: boolean = true;

  constructor(rules: Rule[] = ALL_RULES) {
    this.rules = rules;
  }

  /**
   * Activer/désactiver le moteur
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Ajouter une règle personnalisée
   */
  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  /**
   * Supprimer une règle par ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  /**
   * Évaluer toutes les règles pour tous les sous-traitants
   */
  evaluateAll(nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): RuleEngineResult {
    const startTime = performance.now();

    if (!this.enabled) {
      return {
        alerts: [],
        rulesEvaluated: 0,
        stsEvaluated: 0,
        executionTimeMs: 0,
        alertsByLevel: {},
        alertsByST: {},
      };
    }

    const allAlerts: InferredAlert[] = [];

    // Trouver tous les sous-traitants
    const sts: SousTraitant[] = [];
    for (const [, node] of nodes) {
      if (node._type === 'SousTraitant') {
        sts.push(node as SousTraitant);
      }
    }

    // Évaluer chaque règle pour chaque ST
    for (const st of sts) {
      const context: RuleContext = {
        nodes,
        edges,
        stId: st.id,
        st,
      };

      for (const rule of this.rules) {
        try {
          const alerts = rule.evaluate(context);
          allAlerts.push(...alerts);
        } catch (error) {
          console.error(`[RuleEngine] Error evaluating rule ${rule.id} for ST ${st.id}:`, error);
        }
      }
    }

    // Dédupliquer par ID
    const uniqueAlerts = new Map<string, InferredAlert>();
    for (const alert of allAlerts) {
      uniqueAlerts.set(alert.id, alert);
    }

    const alerts = Array.from(uniqueAlerts.values());

    // Statistiques
    const alertsByLevel: Record<string, number> = { HAUTE: 0, MOYENNE: 0, BASSE: 0 };
    const alertsByST: Record<string, number> = {};

    for (const alert of alerts) {
      alertsByLevel[alert.level] = (alertsByLevel[alert.level] || 0) + 1;
      alertsByST[alert.stId] = (alertsByST[alert.stId] || 0) + 1;
    }

    const endTime = performance.now();

    return {
      alerts,
      rulesEvaluated: this.rules.length * sts.length,
      stsEvaluated: sts.length,
      executionTimeMs: Math.round(endTime - startTime),
      alertsByLevel,
      alertsByST,
    };
  }

  /**
   * Évaluer les règles pour un sous-traitant spécifique
   */
  evaluateForST(
    stId: string,
    nodes: Map<string, GraphNode>,
    edges: Map<string, GraphEdge>
  ): InferredAlert[] {
    if (!this.enabled) return [];

    const stNode = nodes.get(stId);
    if (!stNode || stNode._type !== 'SousTraitant') return [];

    const st = stNode as SousTraitant;
    const context: RuleContext = { nodes, edges, stId, st };

    const alerts: InferredAlert[] = [];

    for (const rule of this.rules) {
      try {
        const ruleAlerts = rule.evaluate(context);
        alerts.push(...ruleAlerts);
      } catch (error) {
        console.error(`[RuleEngine] Error evaluating rule ${rule.id}:`, error);
      }
    }

    // Dédupliquer
    const unique = new Map<string, InferredAlert>();
    for (const alert of alerts) {
      unique.set(alert.id, alert);
    }

    return Array.from(unique.values());
  }

  /**
   * Obtenir la liste des règles
   */
  getRules(): Rule[] {
    return [...this.rules];
  }

  /**
   * Obtenir une règle par ID
   */
  getRule(ruleId: string): Rule | undefined {
    return this.rules.find((r) => r.id === ruleId);
  }
}

// Instance singleton
let ruleEngineInstance: RuleEngine | null = null;

export function getRuleEngine(): RuleEngine {
  if (!ruleEngineInstance) {
    ruleEngineInstance = new RuleEngine();
  }
  return ruleEngineInstance;
}

export function resetRuleEngine(): void {
  ruleEngineInstance = null;
}
