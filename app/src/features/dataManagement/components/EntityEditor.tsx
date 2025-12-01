/**
 * KG-Oversight - Composant EntityEditor
 * Éditeur d'entités avec validation en temps réel
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { Save, X, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { NodeType, GraphNode } from '@data/types';
import type { FieldDefinition } from '../types';
import { getEntitySchema, getEditableFields } from '../constants/entitySchemas';
import { useDataMutations, useEntityValidation } from '../hooks/useDataMutations';
import { DynamicField } from './fields';
import { showSuccessAtom, showErrorAtom } from '@shared/stores/notificationStore';

interface EntityEditorProps {
  node: GraphNode;
  onSave?: (node: GraphNode) => void;
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  className?: string;
}

interface FieldGroup {
  name: string;
  fields: FieldDefinition[];
}

export function EntityEditor({
  node,
  onSave,
  onCancel,
  onDirtyChange,
  className,
}: EntityEditorProps) {
  const nodeType = (node._type || node.type) as NodeType;
  const schema = getEntitySchema(nodeType);

  // État local du formulaire
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const data: Record<string, unknown> = {};
    if (schema) {
      for (const field of schema.fields) {
        data[field.name] = (node as Record<string, unknown>)[field.name];
      }
    }
    return data;
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hooks de mutation et validation
  const { updateNode } = useDataMutations();
  const { validate, validateField } = useEntityValidation(nodeType);

  // Notifications
  const showSuccess = useSetAtom(showSuccessAtom);
  const showError = useSetAtom(showErrorAtom);

  // Calculer si le formulaire a été modifié
  const isDirty = useMemo(() => {
    if (!schema) return false;
    for (const field of schema.fields) {
      const originalValue = (node as Record<string, unknown>)[field.name];
      const currentValue = formData[field.name];
      // Comparaison avec gestion des valeurs null/undefined/vides
      const normalizedOriginal = originalValue ?? '';
      const normalizedCurrent = currentValue ?? '';
      if (String(normalizedOriginal) !== String(normalizedCurrent)) {
        return true;
      }
    }
    return false;
  }, [formData, node, schema]);

  // Notifier le parent du changement d'état dirty
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Grouper les champs par groupe
  const fieldGroups = useMemo((): FieldGroup[] => {
    if (!schema) return [];

    const editableFields = getEditableFields(nodeType);
    const groups = new Map<string, FieldDefinition[]>();

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
  }, [schema, nodeType]);

  // Gérer le changement d'un champ
  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      setSaveError(null);

      // Valider le champ
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
    },
    [validateField, formData]
  );

  // Valider tout le formulaire
  const validateForm = useCallback((): boolean => {
    const result = validate(formData, { isUpdate: true, originalId: node.id });
    const errors: Record<string, string> = {};

    for (const error of result.errors) {
      if (!errors[error.field]) {
        errors[error.field] = error.message;
      }
    }

    setFieldErrors(errors);
    return result.isValid;
  }, [validate, formData, node.id]);

  // Sauvegarder les modifications
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await updateNode(node.id, formData);

      if (result.success && result.data) {
        showSuccess(`${schema?.label || 'Entité'} mise à jour avec succès`);
        onSave?.(result.data);
      } else {
        const errorMsg = result.error?.message || 'Erreur lors de la sauvegarde';
        setSaveError(errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      setSaveError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, updateNode, node.id, formData, onSave, showSuccess, showError, schema]);

  // Annuler les modifications
  const handleCancel = useCallback(() => {
    // Réinitialiser le formulaire
    if (schema) {
      const data: Record<string, unknown> = {};
      for (const field of schema.fields) {
        data[field.name] = (node as Record<string, unknown>)[field.name];
      }
      setFormData(data);
    }
    setFieldErrors({});
    setSaveError(null);
    onCancel?.();
  }, [node, schema, onCancel]);

  // Raccourci clavier pour sauvegarder
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isSaving) {
          handleSave();
        }
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, handleSave, handleCancel]);

  if (!schema) {
    return (
      <div className="p-4 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">Type d'entité non reconnu</p>
      </div>
    );
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Formulaire scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                  disabled={isSaving}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Barre d'actions sticky en bas */}
      <div className="sticky bottom-0 p-4 border-t border-white/5 bg-slate-900/95 backdrop-blur-xl">
        {/* Message d'erreur global */}
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{saveError}</p>
          </motion.div>
        )}

        {/* Boutons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-slate-800 text-slate-300 border border-white/10',
              'hover:bg-slate-700 hover:text-white',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              Annuler
            </span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving || hasErrors}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-indigo-600 text-white',
              'hover:bg-indigo-500',
              (!isDirty || hasErrors) && 'opacity-50 cursor-not-allowed',
              isSaving && 'cursor-wait'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </span>
          </button>
        </div>

        {/* Indicateur de raccourcis */}
        <p className="text-[10px] text-slate-600 text-center mt-2">
          <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400">Ctrl+S</kbd> pour sauvegarder
          {' '}&bull;{' '}
          <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400">Esc</kbd> pour annuler
        </p>
      </div>
    </div>
  );
}

export default EntityEditor;
