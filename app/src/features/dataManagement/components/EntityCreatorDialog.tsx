/**
 * KG-Oversight - Composant EntityCreatorDialog
 * Dialog de création d'entités avec workflow en étapes
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NodeType, GraphNode } from '@data/types';
import { selectedNodeIdsAtom } from '@shared/stores/selectionAtoms';
import { getEntitySchema, getEditableFields } from '../constants/entitySchemas';
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

  // Hooks
  const { createNode } = useDataMutations();
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
        showSuccess(`${schema?.label || 'Entité'} créée avec succès`);

        // Sélectionner la nouvelle entité dans le graphe
        setSelectedNodeIds(new Set([result.data.id]));

        onCreated?.(result.data);
        onClose();
      } else {
        showError(result.error?.message || 'Erreur lors de la création');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsCreating(false);
    }
  }, [selectedType, validateForm, createNode, formData, schema, showSuccess, showError, setSelectedNodeIds, onCreated, onClose]);

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
