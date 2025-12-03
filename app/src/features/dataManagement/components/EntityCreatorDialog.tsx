/**
 * KG-Oversight - Composant EntityCreatorDialog
 * Dialog de création d'entités avec workflow en étapes
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  Link2,
  Search,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NodeType, EdgeType, GraphNode } from '@data/types';
import { selectedNodeIdsAtom, allNodesAtom } from '@shared/stores/selectionAtoms';
import { getEntitySchema, getEditableFields, ENTITY_SCHEMAS } from '../constants/entitySchemas';
import { getOutgoingRelationsForType, getValidTargetTypes, getRelationLabel, RELATION_SCHEMAS } from '../constants/relationSchemas';
import { getNodeColor } from '@shared/utils/nodeStyles';
import { generateId } from '../services/idGenerator';
import { useDataMutations, useEntityValidation } from '../hooks/useDataMutations';
import { showSuccessAtom, showErrorAtom } from '@shared/stores/notificationStore';
import { TypeSelector } from './TypeSelector';
import { DynamicField } from './fields';

interface EntityCreatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (node: GraphNode) => void;
  /** Type pré-sélectionné (optionnel) */
  initialType?: NodeType;
}

type Step = 'type' | 'form';

// Interface pour une relation en attente
interface PendingRelation {
  relationType: EdgeType;
  targetId: string;
  targetLabel: string;
}

export function EntityCreatorDialog({
  isOpen,
  onClose,
  onCreated,
  initialType,
}: EntityCreatorDialogProps) {
  // État du dialog
  const [step, setStep] = useState<Step>(initialType ? 'form' : 'type');
  const [selectedType, setSelectedType] = useState<NodeType | null>(initialType || null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  // État pour les relations (US-C2.2)
  const [pendingRelations, setPendingRelations] = useState<PendingRelation[]>([]);
  const [isRelationSectionOpen, setIsRelationSectionOpen] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState<EdgeType | null>(null);
  const [relationTargetSearch, setRelationTargetSearch] = useState('');
  const allNodes = useAtomValue(allNodesAtom);

  // Hooks
  const { createNode, createEdge } = useDataMutations();
  const setSelectedNodeIds = useSetAtom(selectedNodeIdsAtom);
  const showSuccess = useSetAtom(showSuccessAtom);
  const showError = useSetAtom(showErrorAtom);

  // Validation hook (conditionnel sur le type sélectionné)
  const { validate, validateField } = useEntityValidation(selectedType || 'SousTraitant');

  // Schema du type sélectionné
  const schema = selectedType ? getEntitySchema(selectedType) : null;

  // Champs éditables
  const editableFields = useMemo(() => {
    if (!selectedType) return [];
    return getEditableFields(selectedType);
  }, [selectedType]);

  // Grouper les champs par groupe
  const fieldGroups = useMemo(() => {
    if (!editableFields.length) return [];

    const groups = new Map<string, typeof editableFields>();

    for (const field of editableFields) {
      const groupName = field.group || 'Général';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(field);
    }

    return Array.from(groups.entries()).map(([name, fields]) => ({
      name,
      fields,
    }));
  }, [editableFields]);

  // Relations disponibles pour le type sélectionné (US-C2.2)
  const availableRelations = useMemo(() => {
    if (!selectedType) return [];
    const relationTypes = getOutgoingRelationsForType(selectedType);
    return relationTypes.map((type) => ({
      type,
      label: getRelationLabel(type),
    }));
  }, [selectedType]);

  // Cibles valides pour le type de relation sélectionné
  const validTargetNodes = useMemo(() => {
    if (!selectedRelationType || !selectedType) return [];
    const validTypes = getValidTargetTypes(selectedType, selectedRelationType);
    const searchLower = relationTargetSearch.toLowerCase();

    return Array.from(allNodes.values())
      .filter((node) => {
        // Filtrer par type valide
        if (!validTypes.includes(node._type)) return false;
        // Exclure les cibles déjà sélectionnées
        if (pendingRelations.some((r) => r.targetId === node.id)) return false;
        // Filtrer par recherche
        if (searchLower) {
          const label = (node.nom || node.id).toLowerCase();
          return label.includes(searchLower);
        }
        return true;
      })
      .slice(0, 10); // Limiter à 10 résultats
  }, [selectedRelationType, selectedType, allNodes, relationTargetSearch, pendingRelations]);

  // Réinitialiser le formulaire quand le type change
  useEffect(() => {
    if (selectedType && schema) {
      const initialData: Record<string, unknown> = {};

      // Générer l'ID automatiquement
      initialData.id = generateId(selectedType);

      // Initialiser les champs avec les valeurs par défaut
      for (const field of schema.fields) {
        if (field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue;
        }
      }

      setFormData(initialData);
      setFieldErrors({});
    }
  }, [selectedType, schema]);

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (initialType) {
        setSelectedType(initialType);
        setStep('form');
      } else {
        setSelectedType(null);
        setStep('type');
      }
      setFormData({});
      setFieldErrors({});
      // Reset relations state (US-C2.2)
      setPendingRelations([]);
      setIsRelationSectionOpen(false);
      setSelectedRelationType(null);
      setRelationTargetSearch('');
    }
  }, [isOpen, initialType]);

  // Générer un nouvel ID
  const regenerateId = useCallback(() => {
    if (selectedType) {
      setFormData((prev) => ({
        ...prev,
        id: generateId(selectedType),
      }));
    }
  }, [selectedType]);

  // Sélection du type
  const handleTypeSelect = useCallback((type: NodeType) => {
    setSelectedType(type);
    setStep('form');
  }, []);

  // Ajouter une relation en attente (US-C2.2)
  const handleAddRelation = useCallback((targetNode: GraphNode) => {
    if (!selectedRelationType) return;
    setPendingRelations((prev) => [
      ...prev,
      {
        relationType: selectedRelationType,
        targetId: targetNode.id,
        targetLabel: targetNode.nom || targetNode.id,
      },
    ]);
    setSelectedRelationType(null);
    setRelationTargetSearch('');
  }, [selectedRelationType]);

  // Supprimer une relation en attente
  const handleRemoveRelation = useCallback((index: number) => {
    setPendingRelations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Changement de champ
  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      // Valider le champ
      if (selectedType) {
        const error = validateField(fieldName, value, formData);
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          if (error) {
            newErrors[fieldName] = error;
          } else {
            delete newErrors[fieldName];
          }
          return newErrors;
        });
      }
    },
    [selectedType, validateField, formData]
  );

  // Validation complète
  const validateForm = useCallback((): boolean => {
    if (!selectedType) return false;

    const result = validate(formData, { isUpdate: false });
    const errors: Record<string, string> = {};

    for (const error of result.errors) {
      if (!errors[error.field]) {
        errors[error.field] = error.message;
      }
    }

    setFieldErrors(errors);
    return result.isValid;
  }, [selectedType, validate, formData]);

  // Création de l'entité
  const handleCreate = useCallback(async () => {
    if (!selectedType || !validateForm()) {
      return;
    }

    setIsCreating(true);

    try {
      const result = await createNode(selectedType, formData);

      if (result.success && result.data) {
        const createdNode = result.data;

        // Créer les relations en attente (US-C2.2)
        let relationsCreated = 0;
        for (const relation of pendingRelations) {
          const edgeResult = await createEdge(
            relation.relationType,
            createdNode.id,
            relation.targetId,
            { date_lien: new Date().toISOString().split('T')[0] }
          );
          if (edgeResult.success) {
            relationsCreated++;
          }
        }

        // Message de succès adapté
        if (pendingRelations.length > 0) {
          showSuccess(`${schema?.label || 'Entité'} créée avec ${relationsCreated} relation(s)`);
        } else {
          showSuccess(`${schema?.label || 'Entité'} créée avec succès`);
        }

        // Sélectionner la nouvelle entité dans le graphe
        setSelectedNodeIds(new Set([createdNode.id]));

        onCreated?.(createdNode);
        onClose();
      } else {
        showError(result.error?.message || 'Erreur lors de la création');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsCreating(false);
    }
  }, [selectedType, validateForm, createNode, createEdge, formData, pendingRelations, schema, showSuccess, showError, setSelectedNodeIds, onCreated, onClose]);

  // Retour à l'étape précédente
  const handleBack = useCallback(() => {
    if (step === 'form') {
      setStep('type');
    }
  }, [step]);

  // Fermer avec Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) {
        onClose();
      }
    },
    [isCreating, onClose]
  );

  const hasErrors = Object.keys(fieldErrors).length > 0;

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
            onClick={() => !isCreating && onClose()}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] flex flex-col"
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-dialog-title"
          >
            <div className="bg-slate-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {step === 'form' && !initialType && (
                    <button
                      onClick={handleBack}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Plus className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 id="create-dialog-title" className="text-lg font-semibold text-white">
                      Créer une entité
                    </h2>
                    {step === 'form' && schema && (
                      <p className="text-xs text-slate-400">{schema.label}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isCreating}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === 'type' && (
                    <motion.div
                      key="type"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-6"
                    >
                      <p className="text-sm text-slate-400 mb-4">
                        Sélectionnez le type d'entité à créer :
                      </p>
                      <TypeSelector
                        selectedType={selectedType}
                        onSelect={handleTypeSelect}
                      />
                    </motion.div>
                  )}

                  {step === 'form' && selectedType && schema && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-6 space-y-6"
                    >
                      {/* Champ ID avec bouton régénérer */}
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          Identifiant
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={(formData.id as string) || ''}
                            onChange={(e) => handleFieldChange('id', e.target.value)}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg bg-slate-800 border text-sm text-white font-mono',
                              'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
                              fieldErrors.id
                                ? 'border-red-500/50'
                                : 'border-white/10'
                            )}
                          />
                          <button
                            type="button"
                            onClick={regenerateId}
                            className="p-2 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Générer un nouvel ID"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                        {fieldErrors.id && (
                          <p className="mt-1 text-xs text-red-400">{fieldErrors.id}</p>
                        )}
                      </div>

                      {/* Groupes de champs */}
                      {fieldGroups.map((group) => (
                        <div key={group.name}>
                          {fieldGroups.length > 1 && (
                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                              {group.name}
                            </h4>
                          )}
                          <div className="space-y-4">
                            {group.fields.map((field) => (
                              <DynamicField
                                key={field.name}
                                field={field}
                                value={formData[field.name]}
                                onChange={(value) => handleFieldChange(field.name, value)}
                                error={fieldErrors[field.name]}
                                disabled={isCreating}
                              />
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Section Relations (US-C2.2) */}
                      {availableRelations.length > 0 && (
                        <div className="border-t border-white/5 pt-4">
                          <button
                            type="button"
                            onClick={() => setIsRelationSectionOpen(!isRelationSectionOpen)}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full"
                          >
                            <Link2 className="w-4 h-4" />
                            <span>Relations</span>
                            {pendingRelations.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-500/20 text-indigo-400 rounded">
                                {pendingRelations.length}
                              </span>
                            )}
                            <ChevronRight
                              className={cn(
                                'w-4 h-4 ml-auto transition-transform',
                                isRelationSectionOpen && 'rotate-90'
                              )}
                            />
                          </button>

                          <AnimatePresence>
                            {isRelationSectionOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 space-y-3">
                                  {/* Relations en attente */}
                                  {pendingRelations.length > 0 && (
                                    <div className="space-y-2">
                                      {pendingRelations.map((rel, index) => (
                                        <div
                                          key={`${rel.relationType}-${rel.targetId}`}
                                          className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg text-sm"
                                        >
                                          <span className="text-indigo-400">
                                            {getRelationLabel(rel.relationType)}
                                          </span>
                                          <ChevronRight className="w-3 h-3 text-slate-500" />
                                          <span className="text-white">{rel.targetLabel}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveRelation(index)}
                                            className="ml-auto p-1 text-slate-500 hover:text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Sélecteur de type de relation */}
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                      Type de relation
                                    </label>
                                    <select
                                      value={selectedRelationType || ''}
                                      onChange={(e) => setSelectedRelationType(e.target.value as EdgeType || null)}
                                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                      <option value="">Choisir un type...</option>
                                      {availableRelations.map((rel) => (
                                        <option key={rel.type} value={rel.type}>
                                          {rel.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Recherche de cible */}
                                  {selectedRelationType && (
                                    <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                        Rechercher une cible
                                      </label>
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                          type="text"
                                          value={relationTargetSearch}
                                          onChange={(e) => setRelationTargetSearch(e.target.value)}
                                          placeholder="Rechercher..."
                                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                      </div>

                                      {/* Liste des cibles disponibles */}
                                      {validTargetNodes.length > 0 && (
                                        <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                                          {validTargetNodes.map((node) => (
                                            <button
                                              key={node.id}
                                              type="button"
                                              onClick={() => handleAddRelation(node)}
                                              className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm rounded-lg hover:bg-slate-700 transition-colors"
                                            >
                                              <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: getNodeColor(node._type) }}
                                              />
                                              <span className="text-white truncate">
                                                {node.nom || node.id}
                                              </span>
                                              <span className="text-xs text-slate-500 ml-auto">
                                                {node._type}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      {validTargetNodes.length === 0 && relationTargetSearch && (
                                        <p className="mt-2 text-xs text-slate-500">
                                          Aucune cible trouvée
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer / Actions */}
              <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3 shrink-0">
                <button
                  onClick={onClose}
                  disabled={isCreating}
                  className={cn(
                    'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    'bg-slate-800 text-slate-300 border border-white/10',
                    'hover:bg-slate-700 hover:text-white',
                    isCreating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Annuler
                </button>

                {step === 'form' && (
                  <button
                    onClick={handleCreate}
                    disabled={isCreating || hasErrors || !selectedType}
                    className={cn(
                      'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                      'bg-indigo-600 text-white',
                      'hover:bg-indigo-500',
                      (hasErrors || !selectedType) && 'opacity-50 cursor-not-allowed',
                      isCreating && 'cursor-wait'
                    )}
                  >
                    {isCreating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Création...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Créer
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default EntityCreatorDialog;
