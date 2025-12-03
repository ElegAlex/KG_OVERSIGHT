/**
 * KG-Oversight - RelationList
 * Affiche les relations d'un nœud avec possibilité de suppression
 * et navigation vers les nœuds liés
 */

import { useState, useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  Trash2,
  ChevronRight,
  Plus,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { allNodesAtom, allEdgesAtom } from '@shared/stores/selectionAtoms';
import { getNodeColor, getNodeLabel } from '@shared/utils/nodeStyles';
import { cn } from '@/lib/utils';
import type { GraphNode, GraphEdge, NodeType } from '@data/types';
import { getRelationLabel, getRelationLabelReverse } from '../constants/relationSchemas';
import { useDataMutations } from '../hooks/useDataMutations';

// =============================================================================
// Types
// =============================================================================

interface RelationListProps {
  node: GraphNode;
  onSelectNode: (nodeId: string) => void;
  onAddRelation?: () => void;
  className?: string;
}

interface RelationItemProps {
  edge: GraphEdge;
  relatedNode: GraphNode | undefined;
  isOutgoing: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

interface DeleteConfirmState {
  edgeId: string | null;
  edgeLabel: string;
  nodeName: string;
}

// =============================================================================
// Composant RelationItem
// =============================================================================

function RelationItem({
  edge,
  relatedNode,
  isOutgoing,
  onSelect,
  onDelete,
  isDeleting,
}: RelationItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const relationLabel = isOutgoing
    ? getRelationLabel(edge._type)
    : getRelationLabelReverse(edge._type);

  const nodeName = relatedNode
    ? getNodeDisplayName(relatedNode)
    : isOutgoing
    ? edge.target
    : edge.source;

  const nodeType = relatedNode?._type;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group relative"
    >
      <button
        onClick={onSelect}
        disabled={isDeleting}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-xl',
          'bg-slate-800/30 border border-white/5',
          'hover:bg-slate-700/30 hover:border-white/10',
          'transition-all text-left',
          isDeleting && 'opacity-50 cursor-not-allowed'
        )}
      >
        {nodeType && (
          <div
            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/10"
            style={{ backgroundColor: getNodeColor(nodeType) }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">
            {relationLabel}
          </p>
          <p className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">
            {nodeName}
          </p>
        </div>

        {/* Bouton supprimer ou confirmation */}
        <AnimatePresence mode="wait">
          {showDeleteConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCancelDelete}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                title="Annuler"
              >
                Non
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs flex items-center gap-1"
                title="Confirmer la suppression"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Oui'
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                title="Supprimer la relation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

// =============================================================================
// Composant principal RelationList
// =============================================================================

export function RelationList({
  node,
  onSelectNode,
  onAddRelation,
  className,
}: RelationListProps) {
  const allNodes = useAtomValue(allNodesAtom);
  const allEdges = useAtomValue(allEdgesAtom);
  const { deleteEdge, state } = useDataMutations();
  const [deletingEdgeId, setDeletingEdgeId] = useState<string | null>(null);

  // Calculer les relations entrantes et sortantes
  const { incomingEdges, outgoingEdges } = useMemo(() => {
    const incoming: GraphEdge[] = [];
    const outgoing: GraphEdge[] = [];

    for (const [, edge] of allEdges) {
      if (edge.target === node.id) {
        incoming.push(edge);
      } else if (edge.source === node.id) {
        outgoing.push(edge);
      }
    }

    return { incomingEdges: incoming, outgoingEdges: outgoing };
  }, [node.id, allEdges]);

  const totalRelations = incomingEdges.length + outgoingEdges.length;

  // Gérer la suppression d'une relation
  const handleDeleteRelation = useCallback(
    async (edgeId: string) => {
      setDeletingEdgeId(edgeId);
      try {
        const result = await deleteEdge(edgeId);
        if (!result.success) {
          console.error('Erreur lors de la suppression:', result.error?.message);
        }
      } finally {
        setDeletingEdgeId(null);
      }
    },
    [deleteEdge]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* En-tête avec bouton ajouter */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Relations ({totalRelations})
        </h3>
        {onAddRelation && (
          <button
            onClick={onAddRelation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {/* Relations sortantes */}
      <AnimatePresence>
        {outgoingEdges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h4 className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase mb-2">
              <ArrowRightCircle className="w-3.5 h-3.5 text-amber-500" />
              Sortantes ({outgoingEdges.length})
            </h4>
            <div className="space-y-1.5">
              {outgoingEdges.map((edge) => {
                const targetNode = allNodes.get(edge.target);
                return (
                  <RelationItem
                    key={edge.id}
                    edge={edge}
                    relatedNode={targetNode}
                    isOutgoing={true}
                    onSelect={() => onSelectNode(edge.target)}
                    onDelete={() => handleDeleteRelation(edge.id)}
                    isDeleting={deletingEdgeId === edge.id}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relations entrantes */}
      <AnimatePresence>
        {incomingEdges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h4 className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase mb-2">
              <ArrowLeftCircle className="w-3.5 h-3.5 text-emerald-500" />
              Entrantes ({incomingEdges.length})
            </h4>
            <div className="space-y-1.5">
              {incomingEdges.map((edge) => {
                const sourceNode = allNodes.get(edge.source);
                return (
                  <RelationItem
                    key={edge.id}
                    edge={edge}
                    relatedNode={sourceNode}
                    isOutgoing={false}
                    onSelect={() => onSelectNode(edge.source)}
                    onDelete={() => handleDeleteRelation(edge.id)}
                    isDeleting={deletingEdgeId === edge.id}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message si aucune relation */}
      {totalRelations === 0 && (
        <div className="text-center py-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-slate-500/10 blur-xl rounded-full" />
            <div className="relative w-12 h-12 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-3 mx-auto">
              <AlertTriangle className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Aucune relation pour ce noeud.
          </p>
          {onAddRelation && (
            <button
              onClick={onAddRelation}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Créer une relation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Utilitaires
// =============================================================================

function getNodeDisplayName(node: GraphNode): string {
  if ('nom' in node && node.nom) return node.nom;
  if ('description' in node && node.description) {
    const desc = node.description;
    return desc.length > 50 ? `${desc.substring(0, 50)}...` : desc;
  }
  if ('indicateur' in node && node.indicateur) return node.indicateur;
  return node.id;
}

export default RelationList;
