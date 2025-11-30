/**
 * KG-Oversight - Service de validation des données importées
 * Vérifie l'intégrité, les références et la cohérence des données
 */

import type { GraphNode, GraphEdge, NodeType } from '@data/types';

// =============================================================================
// Types
// =============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

export interface ValidationOptions {
  checkOrphanNodes?: boolean;
  checkDanglingEdges?: boolean;
  checkDuplicateIds?: boolean;
  checkRequiredFields?: boolean;
  checkDateFormats?: boolean;
  checkEnumValues?: boolean;
  maxIssues?: number;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  checkOrphanNodes: true,
  checkDanglingEdges: true,
  checkDuplicateIds: true,
  checkRequiredFields: true,
  checkDateFormats: true,
  checkEnumValues: true,
  maxIssues: 1000,
};

// =============================================================================
// Schéma de validation par type de nœud
// =============================================================================

interface FieldSchema {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date';
  enum?: string[];
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
}

const NODE_SCHEMAS: Record<NodeType, Record<string, FieldSchema>> = {
  SousTraitant: {
    id: { required: true, minLength: 1 },
    nom: { required: true, minLength: 1 },
    statut: { enum: ['Qualifié', 'En évaluation', 'Suspendu', 'Retiré', 'En qualification'] },
    criticite: { enum: ['Critique', 'Majeur', 'Standard', 'Mineur', ''] },
    niveau_actuel: { type: 'number', enum: ['1', '2'] },
    date_creation: { type: 'date' },
  },
  Contrat: {
    id: { required: true },
    nom: { required: true },
    date_debut: { type: 'date' },
    date_fin: { type: 'date' },
  },
  AccordQualite: {
    id: { required: true },
    nom: { required: true },
    statut: { enum: ['En vigueur', 'En révision', 'Archivé', 'En négociation'] },
  },
  Audit: {
    id: { required: true },
    nom: { required: true },
    type_audit: { enum: ['Qualification', 'Surveillance', 'For Cause', 'Requalification'] },
    resultat: { enum: ['Satisfaisant', 'Satisfaisant avec réserves', 'Non satisfaisant', 'En cours'] },
    date_debut: { type: 'date' },
    date_fin: { type: 'date' },
  },
  Inspection: {
    id: { required: true },
    nom: { required: true },
    type_inspection: { enum: ['GMP', 'GCP', 'GLP', 'GAMP', 'Mixte'] },
    date_debut: { type: 'date' },
  },
  Finding: {
    id: { required: true },
    description: { required: true },
    criticite: { required: true, enum: ['Critique', 'Majeur', 'Mineur'] },
    statut: { enum: ['Ouvert', 'En cours', 'Clôturé', 'Vérifié'] },
    date_detection: { type: 'date' },
  },
  EvenementQualite: {
    id: { required: true },
    description: { required: true },
    criticite: { enum: ['Critique', 'Majeur', 'Mineur'] },
    date_creation: { type: 'date' },
  },
  Decision: {
    id: { required: true },
    type_decision: { enum: ['Qualification', 'Suspension', 'Retrait', 'Surveillance renforcée', 'Maintien'] },
    date_decision: { type: 'date' },
  },
  EvaluationRisque: {
    id: { required: true },
    score_global: { type: 'number' },
    date_evaluation: { type: 'date' },
  },
  ReunionQualite: {
    id: { required: true },
    date_reunion: { type: 'date' },
  },
  EtudeClinique: {
    id: { required: true },
    nom: { required: true },
    phase: { enum: ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Préclinique'] },
    date_debut: { type: 'date' },
  },
  DomaineService: {
    id: { required: true },
    nom: { required: true },
  },
  ContexteReglementaire: {
    id: { required: true },
    nom: { required: true },
  },
  Alerte: {
    id: { required: true },
    description: { required: true },
    niveau: { enum: ['HAUTE', 'MOYENNE', 'BASSE'] },
    date_creation: { type: 'date' },
  },
  Evenement: {
    id: { required: true },
    date_creation: { type: 'date' },
  },
  KQI: {
    id: { required: true },
    indicateur: { required: true },
    valeur: { required: true, type: 'number' },
    statut: { enum: ['OK', 'Attention', 'Alerte', 'Critique'] },
    tendance: { enum: ['Amélioration', 'Stable', 'Dégradation'] },
  },
};

// =============================================================================
// Fonctions de validation
// =============================================================================

/**
 * Valide une date au format ISO ou français
 */
function isValidDate(value: string): boolean {
  if (!value) return true; // Optionnel

  // ISO format: YYYY-MM-DD
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  // French format: DD/MM/YYYY
  const frPattern = /^\d{2}\/\d{2}\/\d{4}$/;

  if (isoPattern.test(value) || frPattern.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

/**
 * Valide un nœud selon son schéma
 */
function validateNode(
  node: GraphNode,
  options: ValidationOptions
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const schema = NODE_SCHEMAS[node._type];

  if (!schema) {
    issues.push({
      severity: 'warning',
      code: 'UNKNOWN_TYPE',
      message: `Type de nœud inconnu: ${node._type}`,
      nodeId: node.id,
    });
    return issues;
  }

  // Vérifier les champs requis
  if (options.checkRequiredFields) {
    for (const [field, fieldSchema] of Object.entries(schema)) {
      if (fieldSchema.required) {
        const value = (node as Record<string, unknown>)[field];
        if (value === undefined || value === null || value === '') {
          issues.push({
            severity: 'error',
            code: 'MISSING_REQUIRED_FIELD',
            message: `Champ obligatoire manquant: ${field}`,
            nodeId: node.id,
            field,
            suggestion: `Ajoutez une valeur pour le champ "${field}"`,
          });
        }
      }
    }
  }

  // Vérifier les formats et valeurs
  for (const [field, fieldSchema] of Object.entries(schema)) {
    const value = (node as Record<string, unknown>)[field];
    if (value === undefined || value === null || value === '') continue;

    // Vérifier les enums
    if (options.checkEnumValues && fieldSchema.enum) {
      if (!fieldSchema.enum.includes(String(value))) {
        issues.push({
          severity: 'warning',
          code: 'INVALID_ENUM_VALUE',
          message: `Valeur "${value}" non valide pour ${field}`,
          nodeId: node.id,
          field,
          suggestion: `Valeurs acceptées: ${fieldSchema.enum.join(', ')}`,
        });
      }
    }

    // Vérifier les dates
    if (options.checkDateFormats && fieldSchema.type === 'date') {
      if (!isValidDate(String(value))) {
        issues.push({
          severity: 'warning',
          code: 'INVALID_DATE_FORMAT',
          message: `Format de date invalide pour ${field}: "${value}"`,
          nodeId: node.id,
          field,
          suggestion: 'Format attendu: YYYY-MM-DD ou DD/MM/YYYY',
        });
      }
    }

    // Vérifier les nombres
    if (fieldSchema.type === 'number' && isNaN(Number(value))) {
      issues.push({
        severity: 'error',
        code: 'INVALID_NUMBER',
        message: `Valeur numérique invalide pour ${field}: "${value}"`,
        nodeId: node.id,
        field,
      });
    }

    // Vérifier la longueur
    if (fieldSchema.minLength && String(value).length < fieldSchema.minLength) {
      issues.push({
        severity: 'error',
        code: 'VALUE_TOO_SHORT',
        message: `${field} trop court (min: ${fieldSchema.minLength} caractères)`,
        nodeId: node.id,
        field,
      });
    }
  }

  return issues;
}

/**
 * Valide une relation
 */
function validateEdge(
  edge: GraphEdge,
  nodeIds: Set<string>,
  options: ValidationOptions
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Vérifier les références
  if (options.checkDanglingEdges) {
    if (!nodeIds.has(edge.source)) {
      issues.push({
        severity: 'error',
        code: 'DANGLING_EDGE_SOURCE',
        message: `Nœud source introuvable: ${edge.source}`,
        edgeId: edge.id,
        suggestion: `Vérifiez que le nœud "${edge.source}" existe dans les données`,
      });
    }

    if (!nodeIds.has(edge.target)) {
      issues.push({
        severity: 'error',
        code: 'DANGLING_EDGE_TARGET',
        message: `Nœud cible introuvable: ${edge.target}`,
        edgeId: edge.id,
        suggestion: `Vérifiez que le nœud "${edge.target}" existe dans les données`,
      });
    }
  }

  return issues;
}

// =============================================================================
// Validation principale
// =============================================================================

/**
 * Valide un ensemble complet de données (nœuds et relations)
 */
export function validateData(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
  options: Partial<ValidationOptions> = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(nodes.keys());

  // Vérifier les IDs dupliqués
  if (opts.checkDuplicateIds) {
    const seenIds = new Map<string, string[]>();

    for (const [id, node] of nodes) {
      const existing = seenIds.get(id);
      if (existing) {
        existing.push(node._type);
      } else {
        seenIds.set(id, [node._type]);
      }
    }

    for (const [id, types] of seenIds) {
      if (types.length > 1) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_ID',
          message: `ID dupliqué "${id}" dans les types: ${types.join(', ')}`,
          nodeId: id,
          suggestion: 'Chaque nœud doit avoir un ID unique',
        });
      }
    }
  }

  // Valider chaque nœud
  for (const [, node] of nodes) {
    if (issues.length >= opts.maxIssues!) break;
    const nodeIssues = validateNode(node, opts);
    issues.push(...nodeIssues);
  }

  // Valider chaque relation
  for (const [, edge] of edges) {
    if (issues.length >= opts.maxIssues!) break;
    const edgeIssues = validateEdge(edge, nodeIds, opts);
    issues.push(...edgeIssues);
  }

  // Vérifier les nœuds orphelins
  if (opts.checkOrphanNodes) {
    const connectedNodeIds = new Set<string>();
    for (const [, edge] of edges) {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    }

    for (const [id, node] of nodes) {
      if (issues.length >= opts.maxIssues!) break;
      // Les KQI et certains types peuvent être orphelins
      if (node._type === 'KQI' || node._type === 'ContexteReglementaire') continue;

      if (!connectedNodeIds.has(id)) {
        issues.push({
          severity: 'info',
          code: 'ORPHAN_NODE',
          message: `Nœud sans relation: ${node.nom || id}`,
          nodeId: id,
          suggestion: 'Ce nœud n\'est connecté à aucun autre',
        });
      }
    }
  }

  // Calculer les stats
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  return {
    isValid: errorCount === 0,
    issues,
    stats: {
      totalNodes: nodes.size,
      totalEdges: edges.size,
      errorCount,
      warningCount,
      infoCount,
    },
  };
}

/**
 * Génère un rapport de validation formaté
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    RAPPORT DE VALIDATION');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Statut: ${result.isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
  lines.push('');
  lines.push('STATISTIQUES:');
  lines.push(`  • Nœuds analysés: ${result.stats.totalNodes}`);
  lines.push(`  • Relations analysées: ${result.stats.totalEdges}`);
  lines.push(`  • Erreurs: ${result.stats.errorCount}`);
  lines.push(`  • Avertissements: ${result.stats.warningCount}`);
  lines.push(`  • Informations: ${result.stats.infoCount}`);
  lines.push('');

  if (result.issues.length > 0) {
    // Grouper par sévérité
    const errors = result.issues.filter((i) => i.severity === 'error');
    const warnings = result.issues.filter((i) => i.severity === 'warning');
    const infos = result.issues.filter((i) => i.severity === 'info');

    if (errors.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push(`ERREURS (${errors.length}):`);
      lines.push('───────────────────────────────────────────────────────────────');
      for (const issue of errors.slice(0, 50)) {
        lines.push(`  ❌ [${issue.code}] ${issue.message}`);
        if (issue.nodeId) lines.push(`     Nœud: ${issue.nodeId}`);
        if (issue.suggestion) lines.push(`     → ${issue.suggestion}`);
      }
      if (errors.length > 50) {
        lines.push(`  ... et ${errors.length - 50} autres erreurs`);
      }
      lines.push('');
    }

    if (warnings.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push(`AVERTISSEMENTS (${warnings.length}):`);
      lines.push('───────────────────────────────────────────────────────────────');
      for (const issue of warnings.slice(0, 30)) {
        lines.push(`  ⚠️ [${issue.code}] ${issue.message}`);
        if (issue.nodeId) lines.push(`     Nœud: ${issue.nodeId}`);
        if (issue.suggestion) lines.push(`     → ${issue.suggestion}`);
      }
      if (warnings.length > 30) {
        lines.push(`  ... et ${warnings.length - 30} autres avertissements`);
      }
      lines.push('');
    }

    if (infos.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push(`INFORMATIONS (${infos.length}):`);
      lines.push('───────────────────────────────────────────────────────────────');
      for (const issue of infos.slice(0, 20)) {
        lines.push(`  ℹ️ [${issue.code}] ${issue.message}`);
      }
      if (infos.length > 20) {
        lines.push(`  ... et ${infos.length - 20} autres informations`);
      }
      lines.push('');
    }
  }

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`Rapport généré le ${new Date().toLocaleString('fr-FR')}`);
  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

export default {
  validateData,
  generateValidationReport,
};
