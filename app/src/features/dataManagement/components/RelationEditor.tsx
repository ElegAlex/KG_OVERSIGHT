/**
 * KG-Oversight - RelationEditor
 * Dialog pour modifier les propriétés d'une relation existante
 */

import { useState, useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { motion } from 'framer-motion';
import {
  X,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Link2,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { allNodesAtom } from '@shared/stores/selectionAtoms';
import { getNodeColor } from '@shared/utils/nodeStyles';
import { cn } from '@/lib/utils';
import type { GraphNode, GraphEdge } from '@data/types';
import { getRelationLabel, getRelationSchema } from '../constants/relationSchemas';
import { useDataMutations } from '../hooks/useDataMutations';

// =============================================================================
// Types
// =============================================================================

interface RelationEditorProps {
  edge: GraphEdge;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (edge: GraphEdge) => void;
}

// =============================================================================
// Composant principal
// =============================================================================

export function RelationEditor({
  edge,
  isOpen,
  onClose,
  onSaved,
}: RelationEditorProps) {
  const allNodes = useAtomValue(allNodesAtom);
  const { updateEdge, state } = useDataMutations();
  const [error, setError] = useState<string | null>(null);

  // Récupérer les nœuds source et cible
  const sourceNode = allNodes.get(edge.source);
  const targetNode = allNodes.get(edge.target);

  // Récupérer le schéma de la relation
  const schema = useMemo(() => getRelationSchema(edge._type), [edge._type]);

  // Initialiser les propriétés avec les valeurs existantes
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    if (schema?.properties) {
      for (const prop of schema.properties) {
        initial[prop.name] = (edge as Record<string, unknown>)[prop.name] ?? '';
      }
    }
    return initial;
  });

  // Gérer le changement d'un champ
  const handleFieldChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Sauvegarder les modifications
  const handleSave = useCallback(async () => {
    setError(null);

    // Filtrer les valeurs vides
    const cleanedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanedData[key] = value;
      }
    }

    const result = await updateEdge(edge.id, cleanedData);

    if (result.success && result.data) {
      onSaved?.(result.data);
      onClose();
    } else {
      setError(result.error?.message ?? 'Erreur lors de la mise à jour');
    }
  }, [edge.id, formData, updateEdge, onSaved, onClose]);

  // Si pas de propriétés éditables
  if (!schema?.hasProperties || !schema.properties?.length) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-4 mx-auto">
                <AlertCircle className="w-6 h-6 text-slate-500" />
              </div>
              <Dialog.Title className="text-base font-semibold text-white mb-2">
                Aucune propriété modifiable
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-400 mb-6">
                Cette relation n'a pas de propriétés éditables.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors">
                  Fermer
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-white">
                  Modifier la relation
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {getRelationLabel(edge._type)}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Visualisation de la relation */}
          <div className="px-4 py-4 border-b border-white/5 bg-slate-800/30">
            <div className="flex items-center justify-center gap-4">
              {/* Source */}
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center ring-2 ring-white/10"
                  style={{ backgroundColor: sourceNode ? getNodeColor(sourceNode._type) : '#64748B' }}
                >
                  <span className="text-white text-xs font-bold">
                    {sourceNode?._type.substring(0, 2).toUpperCase() ?? '??'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 text-center max-w-[80px] truncate mt-1">
                  {sourceNode ? getNodeDisplayName(sourceNode) : edge.source}
                </p>
              </div>

              {/* Flèche */}
              <div className="flex flex-col items-center gap-0.5">
                <ArrowRight className="w-6 h-6 text-indigo-500" />
                <span className="text-[9px] text-indigo-400 text-center max-w-[100px] truncate">
                  {getRelationLabel(edge._type)}
                </span>
              </div>

              {/* Target */}
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center ring-2 ring-white/10"
                  style={{ backgroundColor: targetNode ? getNodeColor(targetNode._type) : '#64748B' }}
                >
                  <span className="text-white text-xs font-bold">
                    {targetNode?._type.substring(0, 2).toUpperCase() ?? '??'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 text-center max-w-[80px] truncate mt-1">
                  {targetNode ? getNodeDisplayName(targetNode) : edge.target}
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire des propriétés */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto p-4"
          >
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
              Propriétés de la relation
            </h3>

            <div className="space-y-4">
              {schema.properties.map((prop) => (
                <div key={prop.name} className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400">
                    {prop.label}
                    {prop.required && <span className="text-red-400 ml-1">*</span>}
                  </label>

                  {prop.type === 'text' && (
                    <input
                      type="text"
                      value={(formData[prop.name] as string) || ''}
                      onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      placeholder={`Saisir ${prop.label.toLowerCase()}...`}
                    />
                  )}

                  {prop.type === 'number' && (
                    <input
                      type="number"
                      value={(formData[prop.name] as number) ?? ''}
                      onChange={(e) => handleFieldChange(prop.name, e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      placeholder={`Saisir ${prop.label.toLowerCase()}...`}
                    />
                  )}

                  {prop.type === 'date' && (
                    <input
                      type="date"
                      value={(formData[prop.name] as string) || ''}
                      onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}

                  {prop.type === 'boolean' && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleFieldChange(prop.name, !formData[prop.name])}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          formData[prop.name] ? 'bg-indigo-600' : 'bg-slate-700'
                        )}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            formData[prop.name] ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                      <span className="text-sm text-slate-300">
                        {formData[prop.name] ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Erreur */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-white/5">
            <button
              onClick={onClose}
              disabled={state.isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={state.isLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// =============================================================================
// Utilitaires
// =============================================================================

function getNodeDisplayName(node: GraphNode): string {
  if ('nom' in node && node.nom) return node.nom;
  if ('description' in node && node.description) {
    const desc = node.description;
    return desc.length > 30 ? `${desc.substring(0, 30)}...` : desc;
  }
  if ('indicateur' in node && node.indicateur) return node.indicateur;
  return node.id;
}

export default RelationEditor;
