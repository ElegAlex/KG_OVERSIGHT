/**
 * KG-Oversight - Composant DeleteConfirmDialog
 * Dialog de confirmation pour la suppression d'entités
 */

import { useState, useCallback, useMemo } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GraphNode, GraphEdge, NodeType, EdgeType } from '@data/types';
import { allEdgesAtom } from '@shared/stores/selectionAtoms';
import { getEntitySchema } from '../constants/entitySchemas';
import { useDataMutations } from '../hooks/useDataMutations';
import { showSuccessAtom, showErrorAtom } from '@shared/stores/notificationStore';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  node: GraphNode | null;
  onClose: () => void;
  onDeleted?: () => void;
}

interface RelationImpact {
  incoming: Array<{
    edge: GraphEdge;
    sourceNode: GraphNode | null;
    relationType: EdgeType;
  }>;
  outgoing: Array<{
    edge: GraphEdge;
    targetNode: GraphNode | null;
    relationType: EdgeType;
  }>;
}

export function DeleteConfirmDialog({
  isOpen,
  node,
  onClose,
  onDeleted,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRelationDetails, setShowRelationDetails] = useState(false);

  // Récupérer les edges pour calculer l'impact
  const allEdges = useAtomValue(allEdgesAtom);

  // Hooks de mutation et notifications
  const { deleteNode } = useDataMutations();
  const showSuccess = useSetAtom(showSuccessAtom);
  const showError = useSetAtom(showErrorAtom);

  // Obtenir le schema de l'entité
  const schema = node ? getEntitySchema((node._type || node.type) as NodeType) : null;

  // Calculer les relations impactées
  const relationImpact = useMemo((): RelationImpact => {
    if (!node) {
      return { incoming: [], outgoing: [] };
    }

    const incoming: RelationImpact['incoming'] = [];
    const outgoing: RelationImpact['outgoing'] = [];

    for (const [, edge] of allEdges) {
      if (edge.target === node.id) {
        incoming.push({
          edge,
          sourceNode: null, // On pourrait charger les nœuds si nécessaire
          relationType: edge._type as EdgeType,
        });
      }
      if (edge.source === node.id) {
        outgoing.push({
          edge,
          targetNode: null,
          relationType: edge._type as EdgeType,
        });
      }
    }

    return { incoming, outgoing };
  }, [node, allEdges]);

  const totalRelations = relationImpact.incoming.length + relationImpact.outgoing.length;
  const hasSignificantImpact = totalRelations > 5;

  // Handler de suppression
  const handleDelete = useCallback(async () => {
    if (!node) return;

    setIsDeleting(true);

    try {
      const result = await deleteNode(node.id);

      if (result.success) {
        showSuccess(`${schema?.label || 'Entité'} "${node.label || node.id}" supprimée`);
        onDeleted?.();
        onClose();
      } else {
        showError(result.error?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsDeleting(false);
    }
  }, [node, deleteNode, showSuccess, showError, schema, onDeleted, onClose]);

  // Fermer avec Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    },
    [isDeleting, onClose]
  );

  if (!node) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => !isDeleting && onClose()}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="bg-slate-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 id="delete-dialog-title" className="text-lg font-semibold text-white">
                    Confirmer la suppression
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <p className="text-slate-300 mb-4">
                  Vous êtes sur le point de supprimer :
                </p>

                {/* Entité à supprimer */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-white/5 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: schema?.color || '#6366f1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">{schema?.label || node._type}</p>
                      <p className="font-mono text-sm text-white">{node.id}</p>
                      {node.label && node.label !== node.id && (
                        <p className="text-sm text-slate-300 truncate mt-0.5">
                          "{node.label}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Impact sur les relations */}
                {totalRelations > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowRelationDetails(!showRelationDetails)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left hover:bg-amber-500/15 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-amber-200">
                          Cette action supprimera également :
                        </span>
                      </div>
                      {showRelationDetails ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      )}
                    </button>

                    {/* Résumé des relations */}
                    <div className="mt-2 px-3 text-sm text-slate-400">
                      <ul className="list-disc list-inside space-y-1">
                        {relationImpact.incoming.length > 0 && (
                          <li>
                            {relationImpact.incoming.length} relation
                            {relationImpact.incoming.length > 1 ? 's' : ''} entrante
                            {relationImpact.incoming.length > 1 ? 's' : ''}
                          </li>
                        )}
                        {relationImpact.outgoing.length > 0 && (
                          <li>
                            {relationImpact.outgoing.length} relation
                            {relationImpact.outgoing.length > 1 ? 's' : ''} sortante
                            {relationImpact.outgoing.length > 1 ? 's' : ''}
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Détail des relations */}
                    <AnimatePresence>
                      {showRelationDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 max-h-40 overflow-y-auto space-y-1 px-1">
                            {relationImpact.incoming.map((rel, idx) => (
                              <div
                                key={`in-${idx}`}
                                className="flex items-center gap-2 text-xs text-slate-500 p-2 rounded bg-slate-800/30"
                              >
                                <span className="text-slate-400">←</span>
                                <span className="font-mono text-amber-300/70">
                                  {rel.relationType}
                                </span>
                                <span className="text-slate-500">depuis</span>
                                <span className="font-mono truncate">{rel.edge.source}</span>
                              </div>
                            ))}
                            {relationImpact.outgoing.map((rel, idx) => (
                              <div
                                key={`out-${idx}`}
                                className="flex items-center gap-2 text-xs text-slate-500 p-2 rounded bg-slate-800/30"
                              >
                                <span className="text-slate-400">→</span>
                                <span className="font-mono text-amber-300/70">
                                  {rel.relationType}
                                </span>
                                <span className="text-slate-500">vers</span>
                                <span className="font-mono truncate">{rel.edge.target}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Avertissement impact significatif */}
                {hasSignificantImpact && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">
                      Attention : cette suppression aura un impact important sur {totalRelations}{' '}
                      relations.
                    </p>
                  </div>
                )}

                {/* Avertissement irréversible */}
                <div className="flex items-center gap-2 text-slate-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-xs">Cette action est irréversible.</p>
                </div>
              </div>

              {/* Footer / Actions */}
              <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className={cn(
                    'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    'bg-slate-800 text-slate-300 border border-white/10',
                    'hover:bg-slate-700 hover:text-white',
                    isDeleting && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Annuler
                </button>

                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn(
                    'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    'bg-red-600 text-white',
                    'hover:bg-red-500',
                    isDeleting && 'cursor-wait'
                  )}
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Suppression...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DeleteConfirmDialog;
