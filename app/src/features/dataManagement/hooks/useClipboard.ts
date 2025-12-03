/**
 * KG-Oversight - Hook useClipboard
 * Hook React pour la gestion du copier/coller d'entités
 *
 * Ce hook fournit :
 * - Copier un ou plusieurs nœuds (Ctrl+C)
 * - Coller le contenu (Ctrl+V)
 * - Dupliquer le nœud sélectionné (Ctrl+D)
 * - État du presse-papiers
 */

import { useCallback, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { allNodesAtom, allEdgesAtom, selectedNodeAtom } from '@shared/stores/selectionAtoms';
import { addNotification } from '@shared/stores/notificationStore';
import type { GraphNode, GraphEdge } from '@data/types';
import type { PasteOptions } from '../services/clipboardService';
import {
  clipboardContentAtom,
  hasClipboardContentAtom,
  clipboardCountAtom,
  copyNodesAtom,
  copyEdgesAtom,
  clearClipboardAtom,
} from '../stores/clipboardAtom';
import * as clipboardService from '../services/clipboardService';

// =============================================================================
// Types
// =============================================================================

interface UseClipboardReturn {
  // État
  content: ReturnType<typeof useAtomValue<typeof clipboardContentAtom>>;
  hasContent: boolean;
  count: { nodes: number; edges: number; total: number };
  contentDescription: string;

  // Actions
  copy: (nodes: GraphNode[], options?: { includeRelations?: boolean }) => void;
  copySelected: (options?: { includeRelations?: boolean }) => void;
  copyEdges: (edges: GraphEdge[]) => void;
  paste: (options?: PasteOptions) => Promise<boolean>;
  duplicate: (nodeId?: string, options?: { includeRelations?: boolean }) => Promise<boolean>;
  clear: () => void;

  // État de l'opération
  canPaste: boolean;
  canDuplicate: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useClipboard(): UseClipboardReturn {
  // Atoms
  const content = useAtomValue(clipboardContentAtom);
  const hasContent = useAtomValue(hasClipboardContentAtom);
  const count = useAtomValue(clipboardCountAtom);

  const copyNodes = useSetAtom(copyNodesAtom);
  const copyEdgesAction = useSetAtom(copyEdgesAtom);
  const clearClipboard = useSetAtom(clearClipboardAtom);

  const [nodes, setNodes] = useAtom(allNodesAtom);
  const [edges, setEdges] = useAtom(allEdgesAtom);
  const selectedNode = useAtomValue(selectedNodeAtom);

  // ==========================================================================
  // Computed
  // ==========================================================================

  const contentDescription = useMemo(
    () => clipboardService.describeContent(content),
    [content]
  );

  const canPaste = useMemo(() => clipboardService.canPaste(content), [content]);

  const canDuplicate = useMemo(() => selectedNode !== null, [selectedNode]);

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Copie les nœuds spécifiés dans le presse-papiers
   */
  const copy = useCallback(
    (nodesToCopy: GraphNode[], options?: { includeRelations?: boolean }) => {
      if (nodesToCopy.length === 0) {
        addNotification({
          type: 'warning',
          message: 'Aucune entité à copier',
        });
        return;
      }

      // Récupérer les relations internes si demandé
      const nodeIds = new Set(nodesToCopy.map((n) => n.id));
      const relatedEdges = options?.includeRelations
        ? Array.from(edges.values()).filter(
            (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
          )
        : [];

      copyNodes(nodesToCopy, {
        includeRelations: options?.includeRelations,
        edges: relatedEdges,
      });

      const message =
        nodesToCopy.length === 1
          ? `Entité "${nodesToCopy[0].nom || nodesToCopy[0].id}" copiée`
          : `${nodesToCopy.length} entités copiées`;

      addNotification({
        type: 'success',
        message,
      });
    },
    [edges, copyNodes]
  );

  /**
   * Copie le nœud actuellement sélectionné
   */
  const copySelected = useCallback(
    (options?: { includeRelations?: boolean }) => {
      if (!selectedNode) {
        addNotification({
          type: 'warning',
          message: 'Aucune entité sélectionnée',
        });
        return;
      }

      copy([selectedNode], options);
    },
    [selectedNode, copy]
  );

  /**
   * Copie les relations spécifiées
   */
  const copyEdges = useCallback(
    (edgesToCopy: GraphEdge[]) => {
      if (edgesToCopy.length === 0) {
        addNotification({
          type: 'warning',
          message: 'Aucune relation à copier',
        });
        return;
      }

      copyEdgesAction(edgesToCopy);

      addNotification({
        type: 'success',
        message:
          edgesToCopy.length === 1
            ? '1 relation copiée'
            : `${edgesToCopy.length} relations copiées`,
      });
    },
    [copyEdgesAction]
  );

  /**
   * Colle le contenu du presse-papiers
   */
  const paste = useCallback(
    async (options?: PasteOptions): Promise<boolean> => {
      if (!content) {
        addNotification({
          type: 'warning',
          message: 'Presse-papiers vide',
        });
        return false;
      }

      // Vérifier si le contenu est périmé
      if (clipboardService.isContentStale(content)) {
        addNotification({
          type: 'warning',
          message: 'Le contenu du presse-papiers a expiré (plus de 30 minutes)',
        });
        return false;
      }

      const result = await clipboardService.paste(content, options);

      if (result.success && result.data) {
        const { createdNodes, createdEdges, errors } = result.data;

        // Mettre à jour les atoms
        if (createdNodes.length > 0) {
          setNodes((prev) => {
            const newNodes = new Map(prev);
            for (const node of createdNodes) {
              newNodes.set(node.id, node);
            }
            return newNodes;
          });
        }

        if (createdEdges.length > 0) {
          setEdges((prev) => {
            const newEdges = new Map(prev);
            for (const edge of createdEdges) {
              newEdges.set(edge.id, edge);
            }
            return newEdges;
          });
        }

        // Notification de succès
        const message =
          createdNodes.length === 1
            ? `Entité collée : ${createdNodes[0].nom || createdNodes[0].id}`
            : `${createdNodes.length} entités collées`;

        addNotification({
          type: 'success',
          message,
        });

        // Avertir des erreurs éventuelles
        if (errors.length > 0) {
          addNotification({
            type: 'warning',
            message: `${errors.length} élément(s) n'ont pas pu être collés`,
          });
        }

        return true;
      } else {
        addNotification({
          type: 'error',
          message: result.error?.message || 'Erreur lors du collage',
        });
        return false;
      }
    },
    [content, setNodes, setEdges]
  );

  /**
   * Duplique le nœud spécifié ou le nœud sélectionné
   */
  const duplicate = useCallback(
    async (
      nodeId?: string,
      options?: { includeRelations?: boolean }
    ): Promise<boolean> => {
      const targetId = nodeId || selectedNode?.id;

      if (!targetId) {
        addNotification({
          type: 'warning',
          message: 'Aucune entité à dupliquer',
        });
        return false;
      }

      const result = await clipboardService.duplicateNode(targetId, {
        includeRelations: options?.includeRelations,
      });

      if (result.success && result.data) {
        const { node, edges: newEdges } = result.data;

        // Mettre à jour les atoms
        setNodes((prev) => {
          const newNodes = new Map(prev);
          newNodes.set(node.id, node);
          return newNodes;
        });

        if (newEdges.length > 0) {
          setEdges((prev) => {
            const updatedEdges = new Map(prev);
            for (const edge of newEdges) {
              updatedEdges.set(edge.id, edge);
            }
            return updatedEdges;
          });
        }

        addNotification({
          type: 'success',
          message: `Entité dupliquée : ${node.nom || node.id}`,
        });

        return true;
      } else {
        addNotification({
          type: 'error',
          message: result.error?.message || 'Erreur lors de la duplication',
        });
        return false;
      }
    },
    [selectedNode, setNodes, setEdges]
  );

  /**
   * Vide le presse-papiers
   */
  const clear = useCallback(() => {
    clearClipboard();
    addNotification({
      type: 'info',
      message: 'Presse-papiers vidé',
    });
  }, [clearClipboard]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // État
    content,
    hasContent,
    count,
    contentDescription,

    // Actions
    copy,
    copySelected,
    copyEdges,
    paste,
    duplicate,
    clear,

    // État de l'opération
    canPaste,
    canDuplicate,
  };
}

// =============================================================================
// Export
// =============================================================================

export default useClipboard;
