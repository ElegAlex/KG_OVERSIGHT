/**
 * KG-Oversight - Merge Service
 * Service pour l'import intelligent avec détection et résolution des conflits
 *
 * Stratégies supportées :
 * - Replace : Remplace toutes les données existantes (comportement actuel)
 * - Merge : Met à jour les entités existantes, ajoute les nouvelles
 * - AddOnly : Ajoute uniquement les nouvelles entités, ignore les doublons
 */

import type { GraphNode, GraphEdge, NodeType } from '@data/types';

// =============================================================================
// Types
// =============================================================================

export type MergeStrategy = 'replace' | 'merge' | 'addOnly';

export interface MergeOptions {
  strategy: MergeStrategy;
  /** Pour le mode merge : champs à conserver de l'existant même si différent */
  preserveFields?: string[];
  /** Pour le mode merge : champs à toujours mettre à jour */
  overwriteFields?: string[];
  /** Résolutions manuelles des conflits (nodeId -> 'keep' | 'replace' | merged data) */
  conflictResolutions?: Map<string, ConflictResolution>;
}

export type ConflictResolution =
  | { action: 'keep' }
  | { action: 'replace' }
  | { action: 'merge'; data: Record<string, unknown> };

export interface FieldConflict {
  field: string;
  existingValue: unknown;
  newValue: unknown;
}

export interface NodeConflict {
  nodeId: string;
  nodeType: NodeType;
  existingNode: GraphNode;
  newNode: GraphNode;
  fieldConflicts: FieldConflict[];
}

export interface EdgeConflict {
  edgeId: string;
  existingEdge: GraphEdge;
  newEdge: GraphEdge;
  fieldConflicts: FieldConflict[];
}

export interface ConflictDetectionResult {
  nodeConflicts: NodeConflict[];
  edgeConflicts: EdgeConflict[];
  newNodes: GraphNode[];
  newEdges: GraphEdge[];
  unchangedNodes: string[];
  unchangedEdges: string[];
  hasConflicts: boolean;
  stats: {
    totalImported: number;
    conflictsCount: number;
    newCount: number;
    unchangedCount: number;
  };
}

export interface MergeResult {
  success: boolean;
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  report: MergeReport;
}

export interface MergeReport {
  strategy: MergeStrategy;
  timestamp: string;
  stats: {
    nodesAdded: number;
    nodesUpdated: number;
    nodesSkipped: number;
    nodesRemoved: number;
    edgesAdded: number;
    edgesUpdated: number;
    edgesSkipped: number;
    edgesRemoved: number;
    conflictsResolved: number;
  };
  details: MergeReportEntry[];
}

export interface MergeReportEntry {
  type: 'node' | 'edge';
  id: string;
  entityType: string;
  action: 'added' | 'updated' | 'skipped' | 'removed' | 'conflict_resolved';
  changedFields?: string[];
  message?: string;
}

// =============================================================================
// Détection des conflits
// =============================================================================

/**
 * Détecte les conflits entre données existantes et données à importer
 */
export function detectConflicts(
  existingNodes: Map<string, GraphNode>,
  existingEdges: Map<string, GraphEdge>,
  newNodes: Map<string, GraphNode>,
  newEdges: Map<string, GraphEdge>
): ConflictDetectionResult {
  const nodeConflicts: NodeConflict[] = [];
  const edgeConflicts: EdgeConflict[] = [];
  const newNodesList: GraphNode[] = [];
  const newEdgesList: GraphEdge[] = [];
  const unchangedNodes: string[] = [];
  const unchangedEdges: string[] = [];

  // Analyser les nœuds
  for (const [id, newNode] of newNodes) {
    const existingNode = existingNodes.get(id);

    if (!existingNode) {
      // Nouveau nœud
      newNodesList.push(newNode);
    } else {
      // Vérifier les différences
      const fieldConflicts = detectFieldConflicts(existingNode, newNode);

      if (fieldConflicts.length > 0) {
        nodeConflicts.push({
          nodeId: id,
          nodeType: newNode._type as NodeType,
          existingNode,
          newNode,
          fieldConflicts,
        });
      } else {
        unchangedNodes.push(id);
      }
    }
  }

  // Analyser les relations
  for (const [id, newEdge] of newEdges) {
    const existingEdge = existingEdges.get(id);

    if (!existingEdge) {
      // Nouvelle relation
      newEdgesList.push(newEdge);
    } else {
      // Vérifier les différences
      const fieldConflicts = detectFieldConflicts(existingEdge, newEdge);

      if (fieldConflicts.length > 0) {
        edgeConflicts.push({
          edgeId: id,
          existingEdge,
          newEdge,
          fieldConflicts,
        });
      } else {
        unchangedEdges.push(id);
      }
    }
  }

  const totalImported = newNodes.size + newEdges.size;
  const conflictsCount = nodeConflicts.length + edgeConflicts.length;
  const newCount = newNodesList.length + newEdgesList.length;
  const unchangedCount = unchangedNodes.length + unchangedEdges.length;

  return {
    nodeConflicts,
    edgeConflicts,
    newNodes: newNodesList,
    newEdges: newEdgesList,
    unchangedNodes,
    unchangedEdges,
    hasConflicts: conflictsCount > 0,
    stats: {
      totalImported,
      conflictsCount,
      newCount,
      unchangedCount,
    },
  };
}

/**
 * Détecte les différences entre deux objets
 */
function detectFieldConflicts(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): FieldConflict[] {
  const conflicts: FieldConflict[] = [];
  const skipFields = ['_type', 'id']; // Champs système à ignorer

  // Vérifier tous les champs de l'objet entrant
  for (const [field, newValue] of Object.entries(incoming)) {
    if (skipFields.includes(field)) continue;

    const existingValue = existing[field];

    // Comparer les valeurs (gestion des null/undefined)
    if (!areValuesEqual(existingValue, newValue)) {
      conflicts.push({
        field,
        existingValue,
        newValue,
      });
    }
  }

  return conflicts;
}

/**
 * Compare deux valeurs avec gestion des cas spéciaux
 */
function areValuesEqual(a: unknown, b: unknown): boolean {
  // Nullish check
  if (a === null || a === undefined || a === '') {
    return b === null || b === undefined || b === '';
  }
  if (b === null || b === undefined || b === '') {
    return false;
  }

  // Comparaison directe
  if (a === b) return true;

  // Comparaison de dates (string)
  if (typeof a === 'string' && typeof b === 'string') {
    // Normaliser les dates si nécessaire
    return a.trim() === b.trim();
  }

  // Comparaison de nombres
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b;
  }

  // Comparaison de tableaux
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => areValuesEqual(val, b[idx]));
  }

  // Comparaison d'objets
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      areValuesEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}

// =============================================================================
// Exécution du merge
// =============================================================================

/**
 * Exécute le merge selon la stratégie choisie
 */
export function executeMerge(
  existingNodes: Map<string, GraphNode>,
  existingEdges: Map<string, GraphEdge>,
  newNodes: Map<string, GraphNode>,
  newEdges: Map<string, GraphEdge>,
  options: MergeOptions
): MergeResult {
  const report: MergeReport = {
    strategy: options.strategy,
    timestamp: new Date().toISOString(),
    stats: {
      nodesAdded: 0,
      nodesUpdated: 0,
      nodesSkipped: 0,
      nodesRemoved: 0,
      edgesAdded: 0,
      edgesUpdated: 0,
      edgesSkipped: 0,
      edgesRemoved: 0,
      conflictsResolved: 0,
    },
    details: [],
  };

  let resultNodes: Map<string, GraphNode>;
  let resultEdges: Map<string, GraphEdge>;

  switch (options.strategy) {
    case 'replace':
      // Mode Replace : remplacer tout
      resultNodes = new Map(newNodes);
      resultEdges = new Map(newEdges);

      report.stats.nodesAdded = newNodes.size;
      report.stats.nodesRemoved = existingNodes.size;
      report.stats.edgesAdded = newEdges.size;
      report.stats.edgesRemoved = existingEdges.size;

      report.details.push({
        type: 'node',
        id: '*',
        entityType: '*',
        action: 'removed',
        message: `${existingNodes.size} nœuds existants remplacés`,
      });
      break;

    case 'merge':
      // Mode Merge : fusionner intelligemment
      ({ nodes: resultNodes, edges: resultEdges } = executeMergeStrategy(
        existingNodes,
        existingEdges,
        newNodes,
        newEdges,
        options,
        report
      ));
      break;

    case 'addOnly':
      // Mode AddOnly : ajouter uniquement les nouveaux
      ({ nodes: resultNodes, edges: resultEdges } = executeAddOnlyStrategy(
        existingNodes,
        existingEdges,
        newNodes,
        newEdges,
        report
      ));
      break;

    default:
      throw new Error(`Stratégie de merge inconnue: ${options.strategy}`);
  }

  return {
    success: true,
    nodes: resultNodes,
    edges: resultEdges,
    report,
  };
}

/**
 * Exécute la stratégie Merge
 */
function executeMergeStrategy(
  existingNodes: Map<string, GraphNode>,
  existingEdges: Map<string, GraphEdge>,
  newNodes: Map<string, GraphNode>,
  newEdges: Map<string, GraphEdge>,
  options: MergeOptions,
  report: MergeReport
): { nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> } {
  const resultNodes = new Map(existingNodes);
  const resultEdges = new Map(existingEdges);
  const resolutions = options.conflictResolutions ?? new Map();

  // Merger les nœuds
  for (const [id, newNode] of newNodes) {
    const existingNode = existingNodes.get(id);

    if (!existingNode) {
      // Nouveau nœud - ajouter
      resultNodes.set(id, newNode);
      report.stats.nodesAdded++;
      report.details.push({
        type: 'node',
        id,
        entityType: newNode._type,
        action: 'added',
      });
    } else {
      // Nœud existant - vérifier résolution ou merger
      const resolution = resolutions.get(id);

      if (resolution) {
        // Résolution manuelle
        report.stats.conflictsResolved++;

        if (resolution.action === 'keep') {
          // Garder l'existant
          report.stats.nodesSkipped++;
          report.details.push({
            type: 'node',
            id,
            entityType: newNode._type,
            action: 'skipped',
            message: 'Résolution: conserver existant',
          });
        } else if (resolution.action === 'replace') {
          // Remplacer par le nouveau
          resultNodes.set(id, newNode);
          report.stats.nodesUpdated++;
          report.details.push({
            type: 'node',
            id,
            entityType: newNode._type,
            action: 'updated',
            message: 'Résolution: remplacer',
          });
        } else if (resolution.action === 'merge') {
          // Fusionner avec les données manuelles
          const merged = { ...existingNode, ...resolution.data, id, _type: newNode._type };
          resultNodes.set(id, merged as GraphNode);
          report.stats.nodesUpdated++;
          report.details.push({
            type: 'node',
            id,
            entityType: newNode._type,
            action: 'conflict_resolved',
            changedFields: Object.keys(resolution.data),
          });
        }
      } else {
        // Pas de résolution - merger automatiquement
        const changedFields: string[] = [];
        const mergedNode = { ...existingNode };

        for (const [field, newValue] of Object.entries(newNode)) {
          if (field === 'id' || field === '_type') continue;

          const existingValue = (existingNode as Record<string, unknown>)[field];

          // Logique de merge par défaut
          const shouldPreserve = options.preserveFields?.includes(field);
          const shouldOverwrite = options.overwriteFields?.includes(field);

          if (shouldPreserve) {
            // Conserver la valeur existante
            continue;
          }

          if (shouldOverwrite || !areValuesEqual(existingValue, newValue)) {
            // Mettre à jour si le champ doit être écrasé ou si la nouvelle valeur est différente et non-vide
            if (newValue !== null && newValue !== undefined && newValue !== '') {
              (mergedNode as Record<string, unknown>)[field] = newValue;
              changedFields.push(field);
            }
          }
        }

        if (changedFields.length > 0) {
          resultNodes.set(id, mergedNode);
          report.stats.nodesUpdated++;
          report.details.push({
            type: 'node',
            id,
            entityType: newNode._type,
            action: 'updated',
            changedFields,
          });
        } else {
          report.stats.nodesSkipped++;
        }
      }
    }
  }

  // Merger les relations
  for (const [id, newEdge] of newEdges) {
    const existingEdge = existingEdges.get(id);

    if (!existingEdge) {
      resultEdges.set(id, newEdge);
      report.stats.edgesAdded++;
      report.details.push({
        type: 'edge',
        id,
        entityType: newEdge._type,
        action: 'added',
      });
    } else {
      // Pour les relations, on remplace si différent
      const conflicts = detectFieldConflicts(existingEdge, newEdge);
      if (conflicts.length > 0) {
        resultEdges.set(id, newEdge);
        report.stats.edgesUpdated++;
        report.details.push({
          type: 'edge',
          id,
          entityType: newEdge._type,
          action: 'updated',
          changedFields: conflicts.map(c => c.field),
        });
      } else {
        report.stats.edgesSkipped++;
      }
    }
  }

  return { nodes: resultNodes, edges: resultEdges };
}

/**
 * Exécute la stratégie AddOnly
 */
function executeAddOnlyStrategy(
  existingNodes: Map<string, GraphNode>,
  existingEdges: Map<string, GraphEdge>,
  newNodes: Map<string, GraphNode>,
  newEdges: Map<string, GraphEdge>,
  report: MergeReport
): { nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> } {
  const resultNodes = new Map(existingNodes);
  const resultEdges = new Map(existingEdges);

  // Ajouter uniquement les nouveaux nœuds
  for (const [id, newNode] of newNodes) {
    if (!existingNodes.has(id)) {
      resultNodes.set(id, newNode);
      report.stats.nodesAdded++;
      report.details.push({
        type: 'node',
        id,
        entityType: newNode._type,
        action: 'added',
      });
    } else {
      report.stats.nodesSkipped++;
      report.details.push({
        type: 'node',
        id,
        entityType: newNode._type,
        action: 'skipped',
        message: 'Doublon ignoré',
      });
    }
  }

  // Ajouter uniquement les nouvelles relations
  for (const [id, newEdge] of newEdges) {
    if (!existingEdges.has(id)) {
      resultEdges.set(id, newEdge);
      report.stats.edgesAdded++;
      report.details.push({
        type: 'edge',
        id,
        entityType: newEdge._type,
        action: 'added',
      });
    } else {
      report.stats.edgesSkipped++;
    }
  }

  return { nodes: resultNodes, edges: resultEdges };
}

// =============================================================================
// Génération du rapport
// =============================================================================

/**
 * Génère un rapport textuel du merge
 */
export function generateMergeReportText(report: MergeReport): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════════',
    '                    RAPPORT D\'IMPORT - KG-OVERSIGHT',
    '═══════════════════════════════════════════════════════════════════',
    '',
    `Date: ${new Date(report.timestamp).toLocaleString('fr-FR')}`,
    `Stratégie: ${getStrategyLabel(report.strategy)}`,
    '',
    '───────────────────────────────────────────────────────────────────',
    '                           RÉSUMÉ',
    '───────────────────────────────────────────────────────────────────',
    '',
    'NŒUDS:',
    `  - Ajoutés:     ${report.stats.nodesAdded}`,
    `  - Mis à jour:  ${report.stats.nodesUpdated}`,
    `  - Ignorés:     ${report.stats.nodesSkipped}`,
    `  - Supprimés:   ${report.stats.nodesRemoved}`,
    '',
    'RELATIONS:',
    `  - Ajoutées:    ${report.stats.edgesAdded}`,
    `  - Mises à jour: ${report.stats.edgesUpdated}`,
    `  - Ignorées:    ${report.stats.edgesSkipped}`,
    `  - Supprimées:  ${report.stats.edgesRemoved}`,
    '',
    `Conflits résolus: ${report.stats.conflictsResolved}`,
    '',
  ];

  // Détails si présents
  if (report.details.length > 0 && report.details.length <= 100) {
    lines.push('───────────────────────────────────────────────────────────────────');
    lines.push('                           DÉTAILS');
    lines.push('───────────────────────────────────────────────────────────────────');
    lines.push('');

    for (const entry of report.details) {
      const actionLabel = getActionLabel(entry.action);
      let detail = `[${entry.type.toUpperCase()}] ${entry.id} (${entry.entityType}): ${actionLabel}`;

      if (entry.changedFields?.length) {
        detail += ` - Champs: ${entry.changedFields.join(', ')}`;
      }
      if (entry.message) {
        detail += ` - ${entry.message}`;
      }

      lines.push(detail);
    }
  } else if (report.details.length > 100) {
    lines.push(`(${report.details.length} opérations - détails omis)`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('                         FIN DU RAPPORT');
  lines.push('═══════════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

function getStrategyLabel(strategy: MergeStrategy): string {
  switch (strategy) {
    case 'replace': return 'Remplacement complet';
    case 'merge': return 'Fusion intelligente';
    case 'addOnly': return 'Ajout uniquement';
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'added': return 'Ajouté';
    case 'updated': return 'Mis à jour';
    case 'skipped': return 'Ignoré';
    case 'removed': return 'Supprimé';
    case 'conflict_resolved': return 'Conflit résolu';
    default: return action;
  }
}

// =============================================================================
// Exports
// =============================================================================

export default {
  detectConflicts,
  executeMerge,
  generateMergeReportText,
};
