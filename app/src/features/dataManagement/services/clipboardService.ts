/**
 * KG-Oversight - Clipboard Service
 * Service pour la gestion du presse-papiers d'entités
 *
 * Fournit les opérations de copie, collage et duplication
 * de nœuds et relations du Knowledge Graph.
 */

import type { GraphNode, GraphEdge, NodeType, EdgeType } from '@data/types';
import type { DataServiceResult, DeleteResult } from '../types';
import type { ClipboardContent } from '../stores/clipboardAtom';
import * as dataService from './dataService';
import { generateId } from './idGenerator';

// =============================================================================
// Types
// =============================================================================

export interface PasteOptions {
  /** Préserver les relations entre nœuds copiés */
  preserveInternalRelations?: boolean;
  /** Copier également les relations vers d'autres nœuds */
  includeExternalRelations?: boolean;
  /** Données supplémentaires à appliquer aux nœuds collés */
  overrideData?: Partial<Record<string, unknown>>;
  /** Suffixe à ajouter au nom/description des entités copiées */
  nameSuffix?: string;
}

export interface PasteResult {
  /** Nœuds créés */
  createdNodes: GraphNode[];
  /** Relations créées */
  createdEdges: GraphEdge[];
  /** Mapping ancien ID -> nouveau ID */
  idMapping: Map<string, string>;
  /** Erreurs rencontrées */
  errors: string[];
}

export interface DuplicateOptions {
  /** Inclure les relations du nœud */
  includeRelations?: boolean;
  /** Données à modifier dans la copie */
  overrideData?: Partial<Record<string, unknown>>;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Prépare les données d'un nœud pour la copie (retire l'ID et le type)
 */
function prepareNodeDataForCopy(node: GraphNode): Record<string, unknown> {
  const data: Record<string, unknown> = { ...node };
  delete data.id;
  delete data._type;
  delete data.type;
  return data;
}

/**
 * Génère un nouveau nom pour un élément copié
 */
function generateCopyName(originalName: string | undefined, suffix?: string): string {
  if (!originalName) return '';
  const copyIndicator = suffix || ' (copie)';

  // Éviter les noms comme "Element (copie) (copie)"
  const baseName = originalName.replace(/\s*\(copie(?:\s*\d*)?\)\s*$/, '');
  return `${baseName}${copyIndicator}`;
}

/**
 * Applique les modifications de nom/description à un nœud copié
 */
function applyNameSuffix(
  data: Record<string, unknown>,
  suffix: string
): Record<string, unknown> {
  const result = { ...data };

  // Champs de nom courants
  const nameFields = ['nom', 'name', 'description', 'titre', 'title', 'indicateur'];

  for (const field of nameFields) {
    if (typeof result[field] === 'string') {
      result[field] = generateCopyName(result[field] as string, suffix);
      break; // Ne modifier que le premier champ trouvé
    }
  }

  return result;
}

// =============================================================================
// Opérations de copie
// =============================================================================

/**
 * Prépare le contenu pour la copie d'un ou plusieurs nœuds
 */
export function prepareCopy(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options?: { includeRelations?: boolean }
): ClipboardContent {
  // Filtrer les relations internes (entre les nœuds copiés)
  const nodeIds = new Set(nodes.map((n) => n.id));
  const internalEdges = edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  return {
    type: nodes.length === 1 ? 'node' : 'nodes',
    nodes: nodes.map((n) => ({ ...n })),
    edges: options?.includeRelations ? internalEdges.map((e) => ({ ...e })) : [],
    timestamp: Date.now(),
    sourceNodeId: nodes.length === 1 ? nodes[0].id : undefined,
    includeRelations: options?.includeRelations ?? false,
  };
}

/**
 * Prépare le contenu pour la copie de relations
 */
export function prepareCopyEdges(edges: GraphEdge[]): ClipboardContent {
  return {
    type: edges.length === 1 ? 'edge' : 'edges',
    nodes: [],
    edges: edges.map((e) => ({ ...e })),
    timestamp: Date.now(),
    includeRelations: false,
  };
}

// =============================================================================
// Opérations de collage
// =============================================================================

/**
 * Colle le contenu du presse-papiers
 */
export async function paste(
  content: ClipboardContent,
  options: PasteOptions = {}
): Promise<DataServiceResult<PasteResult>> {
  const {
    preserveInternalRelations = true,
    includeExternalRelations = false,
    overrideData = {},
    nameSuffix = ' (copie)',
  } = options;

  const createdNodes: GraphNode[] = [];
  const createdEdges: GraphEdge[] = [];
  const idMapping = new Map<string, string>();
  const errors: string[] = [];

  try {
    // 1. Coller les nœuds
    for (const sourceNode of content.nodes) {
      const nodeType = (sourceNode._type || sourceNode.type) as NodeType;

      // Préparer les données
      let nodeData = prepareNodeDataForCopy(sourceNode);

      // Appliquer le suffixe de nom
      if (nameSuffix) {
        nodeData = applyNameSuffix(nodeData, nameSuffix);
      }

      // Appliquer les overrides
      nodeData = { ...nodeData, ...overrideData };

      // Créer le nouveau nœud
      const result = await dataService.createNode(nodeType, nodeData);

      if (result.success && result.data) {
        createdNodes.push(result.data);
        idMapping.set(sourceNode.id, result.data.id);
      } else {
        errors.push(
          `Erreur lors de la copie de ${sourceNode.id}: ${result.error?.message || 'Erreur inconnue'}`
        );
      }
    }

    // 2. Coller les relations internes si demandé
    if (preserveInternalRelations && content.edges.length > 0) {
      for (const sourceEdge of content.edges) {
        const newSource = idMapping.get(sourceEdge.source);
        const newTarget = idMapping.get(sourceEdge.target);

        // Ne créer que si les deux extrémités ont été copiées
        if (newSource && newTarget) {
          const edgeType = (sourceEdge._type || sourceEdge.type) as EdgeType;

          const result = await dataService.createEdge({
            source: newSource,
            target: newTarget,
            type: edgeType,
          });

          if (result.success && result.data) {
            createdEdges.push(result.data);
          } else {
            errors.push(
              `Erreur lors de la copie de la relation ${sourceEdge.id}: ${result.error?.message || 'Erreur inconnue'}`
            );
          }
        }
      }
    }

    // 3. Copier les relations externes si demandé (vers des nœuds existants)
    if (includeExternalRelations && content.nodes.length === 1) {
      const sourceNodeId = content.nodes[0].id;
      const newNodeId = idMapping.get(sourceNodeId);

      if (newNodeId) {
        // Récupérer les relations du nœud source
        const sourceEdges = dataService.getNodeEdges(sourceNodeId);

        for (const edge of sourceEdges) {
          const edgeType = (edge._type || edge.type) as EdgeType;

          // Déterminer les nouvelles extrémités
          let newSource: string;
          let newTarget: string;

          if (edge.source === sourceNodeId) {
            newSource = newNodeId;
            newTarget = edge.target;
          } else {
            newSource = edge.source;
            newTarget = newNodeId;
          }

          const result = await dataService.createEdge({
            source: newSource,
            target: newTarget,
            type: edgeType,
          });

          if (result.success && result.data) {
            createdEdges.push(result.data);
          }
          // On ne log pas les erreurs pour les relations externes
        }
      }
    }

    console.log(
      `[ClipboardService] Pasted ${createdNodes.length} node(s), ${createdEdges.length} edge(s)`
    );

    return {
      success: true,
      data: {
        createdNodes,
        createdEdges,
        idMapping,
        errors,
      },
    };
  } catch (error) {
    console.error('[ClipboardService] Paste error:', error);
    return {
      success: false,
      error: {
        code: 'PASTE_ERROR',
        message: error instanceof Error ? error.message : 'Erreur lors du collage',
      },
    };
  }
}

// =============================================================================
// Duplication
// =============================================================================

/**
 * Duplique un nœud (raccourci Ctrl+D)
 * Utilise le dataService.duplicateNode existant
 */
export async function duplicateNode(
  nodeId: string,
  options: DuplicateOptions = {}
): Promise<DataServiceResult<{ node: GraphNode; edges: GraphEdge[] }>> {
  const { includeRelations = false, overrideData = {} } = options;

  // Récupérer le nœud source
  const sourceNode = dataService.getNodesCache().get(nodeId);
  if (!sourceNode) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Nœud "${nodeId}" non trouvé`,
      },
    };
  }

  // Préparer les données avec le suffixe
  const nameOverride: Record<string, unknown> = {};
  const nameFields = ['nom', 'name', 'description', 'titre', 'title', 'indicateur'];

  for (const field of nameFields) {
    if (typeof sourceNode[field as keyof GraphNode] === 'string') {
      nameOverride[field] = generateCopyName(
        sourceNode[field as keyof GraphNode] as string,
        ' (copie)'
      );
      break;
    }
  }

  // Utiliser le service existant
  const result = await dataService.duplicateNode(nodeId, {
    includeRelations,
    newData: { ...nameOverride, ...overrideData },
  });

  if (result.success) {
    console.log(`[ClipboardService] Duplicated ${nodeId} -> ${result.data?.node.id}`);
  }

  return result;
}

/**
 * Duplique plusieurs nœuds
 */
export async function duplicateNodes(
  nodeIds: string[],
  options: DuplicateOptions = {}
): Promise<DataServiceResult<PasteResult>> {
  const createdNodes: GraphNode[] = [];
  const createdEdges: GraphEdge[] = [];
  const idMapping = new Map<string, string>();
  const errors: string[] = [];

  for (const nodeId of nodeIds) {
    const result = await duplicateNode(nodeId, options);

    if (result.success && result.data) {
      createdNodes.push(result.data.node);
      createdEdges.push(...result.data.edges);
      idMapping.set(nodeId, result.data.node.id);
    } else {
      errors.push(
        `Erreur lors de la duplication de ${nodeId}: ${result.error?.message || 'Erreur inconnue'}`
      );
    }
  }

  return {
    success: errors.length === 0,
    data: {
      createdNodes,
      createdEdges,
      idMapping,
      errors,
    },
  };
}

// =============================================================================
// Utilitaires
// =============================================================================

/**
 * Vérifie si le contenu du presse-papiers peut être collé
 */
export function canPaste(content: ClipboardContent | null): boolean {
  if (!content) return false;
  return content.nodes.length > 0 || content.edges.length > 0;
}

/**
 * Retourne une description du contenu du presse-papiers
 */
export function describeContent(content: ClipboardContent | null): string {
  if (!content) return 'Presse-papiers vide';

  const parts: string[] = [];

  if (content.nodes.length > 0) {
    parts.push(
      content.nodes.length === 1
        ? `1 entité`
        : `${content.nodes.length} entités`
    );
  }

  if (content.edges.length > 0) {
    parts.push(
      content.edges.length === 1
        ? `1 relation`
        : `${content.edges.length} relations`
    );
  }

  return parts.join(' et ');
}

/**
 * Calcule l'âge du contenu du presse-papiers
 */
export function getContentAge(content: ClipboardContent | null): number {
  if (!content) return Infinity;
  return Date.now() - content.timestamp;
}

/**
 * Vérifie si le contenu est périmé (plus de 30 minutes)
 */
export function isContentStale(content: ClipboardContent | null, maxAgeMs = 30 * 60 * 1000): boolean {
  return getContentAge(content) > maxAgeMs;
}

// =============================================================================
// Export
// =============================================================================

export default {
  // Copie
  prepareCopy,
  prepareCopyEdges,
  // Collage
  paste,
  canPaste,
  // Duplication
  duplicateNode,
  duplicateNodes,
  // Utilitaires
  describeContent,
  getContentAge,
  isContentStale,
};
