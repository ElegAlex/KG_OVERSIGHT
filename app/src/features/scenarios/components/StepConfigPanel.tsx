/**
 * KG-Oversight - Panneau de configuration d'une étape de scénario
 * Permet de configurer NodeSelector, actions, tips, etc.
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Info,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import type { EditorStepNode } from '../types/editor';
import type { ScenarioStep, ScenarioAction, NodeSelector } from '../types/scenario';
import type { NodeType, EdgeType } from '@data/types/entities';

// =============================================================================
// Types
// =============================================================================

interface StepConfigPanelProps {
  node: EditorStepNode;
  onUpdate: (data: Partial<ScenarioStep>) => void;
  onClose: () => void;
}

// =============================================================================
// Constantes
// =============================================================================

const ALL_NODE_TYPES: NodeType[] = [
  'SousTraitant',
  'Contrat',
  'AccordQualite',
  'Audit',
  'Inspection',
  'Finding',
  'EvenementQualite',
  'Decision',
  'EvaluationRisque',
  'ReunionQualite',
  'EtudeClinique',
  'DomaineService',
  'ContexteReglementaire',
  'Alerte',
  'Evenement',
  'KQI',
];

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  SousTraitant: 'Sous-traitant',
  Contrat: 'Contrat',
  AccordQualite: 'Accord Qualité',
  Audit: 'Audit',
  Inspection: 'Inspection',
  Finding: 'Finding',
  EvenementQualite: 'Événement Qualité',
  Decision: 'Décision',
  EvaluationRisque: 'Évaluation Risque',
  ReunionQualite: 'Réunion Qualité',
  EtudeClinique: 'Étude Clinique',
  DomaineService: 'Domaine Service',
  ContexteReglementaire: 'Contexte Réglementaire',
  Alerte: 'Alerte',
  Evenement: 'Événement',
  KQI: 'KQI',
};

const ALL_ACTIONS: { id: ScenarioAction; label: string; description: string }[] = [
  { id: 'highlight', label: 'Surbrillance', description: 'Met en évidence les nœuds sélectionnés' },
  { id: 'select', label: 'Sélection', description: 'Sélectionne les nœuds' },
  { id: 'focus', label: 'Focus', description: 'Centre la vue sur les nœuds' },
  { id: 'expand', label: 'Expansion', description: 'Montre les voisins' },
  { id: 'filter', label: 'Filtrage', description: 'N\'affiche que ces nœuds' },
  { id: 'annotate', label: 'Annotation', description: 'Affiche une annotation' },
];

const RELATION_TYPES: { id: NodeSelector['relativeTo'] extends { relation: infer R } ? R : never; label: string }[] = [
  { id: 'neighbors', label: 'Voisins (tous)' },
  { id: 'successors', label: 'Successeurs' },
  { id: 'predecessors', label: 'Prédécesseurs' },
  { id: 'connected', label: 'Connectés' },
];

const SEVERITY_OPTIONS = [
  { id: 'info', label: 'Info', icon: Info, color: 'text-blue-400' },
  { id: 'warning', label: 'Attention', icon: AlertTriangle, color: 'text-amber-400' },
  { id: 'critical', label: 'Critique', icon: AlertCircle, color: 'text-red-400' },
];

// =============================================================================
// Composants
// =============================================================================

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-700/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
      >
        <span className="text-sm font-medium text-slate-300">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// =============================================================================
// Composant principal
// =============================================================================

export function StepConfigPanel({ node, onUpdate, onClose }: StepConfigPanelProps) {
  const data = node.data;

  // Mode de sélection des nœuds
  const [selectorMode, setSelectorMode] = useState<'types' | 'ids' | 'where' | 'relative'>(
    data.nodeSelector?.relativeTo ? 'relative' :
    data.nodeSelector?.where?.length ? 'where' :
    data.nodeSelector?.ids?.length ? 'ids' : 'types'
  );

  // Update handlers
  const handleTitleChange = useCallback((title: string) => {
    onUpdate({ title });
  }, [onUpdate]);

  const handleDescriptionChange = useCallback((description: string) => {
    onUpdate({ description });
  }, [onUpdate]);

  const handleTypesChange = useCallback((types: NodeType[]) => {
    onUpdate({
      nodeSelector: { ...data.nodeSelector, types, ids: undefined, where: undefined, relativeTo: undefined },
    });
  }, [onUpdate, data.nodeSelector]);

  const handleIdsChange = useCallback((idsText: string) => {
    const ids = idsText.split(',').map((id) => id.trim()).filter(Boolean);
    onUpdate({
      nodeSelector: { ...data.nodeSelector, ids, types: undefined, where: undefined, relativeTo: undefined },
    });
  }, [onUpdate, data.nodeSelector]);

  const handleActionsChange = useCallback((actions: ScenarioAction[]) => {
    onUpdate({ actions });
  }, [onUpdate]);

  const handleAddTip = useCallback(() => {
    onUpdate({ tips: [...(data.tips || []), ''] });
  }, [onUpdate, data.tips]);

  const handleUpdateTip = useCallback((index: number, value: string) => {
    const newTips = [...(data.tips || [])];
    newTips[index] = value;
    onUpdate({ tips: newTips });
  }, [onUpdate, data.tips]);

  const handleRemoveTip = useCallback((index: number) => {
    const newTips = (data.tips || []).filter((_, i) => i !== index);
    onUpdate({ tips: newTips });
  }, [onUpdate, data.tips]);

  const handleAddInsight = useCallback(() => {
    onUpdate({
      insights: [...(data.insights || []), { label: '', value: '', severity: 'info' as const }],
    });
  }, [onUpdate, data.insights]);

  const handleUpdateInsight = useCallback((index: number, field: string, value: string) => {
    const newInsights = [...(data.insights || [])];
    newInsights[index] = { ...newInsights[index], [field]: value };
    onUpdate({ insights: newInsights });
  }, [onUpdate, data.insights]);

  const handleRemoveInsight = useCallback((index: number) => {
    const newInsights = (data.insights || []).filter((_, i) => i !== index);
    onUpdate({ insights: newInsights });
  }, [onUpdate, data.insights]);

  const handleConfigChange = useCallback((key: string, value: unknown) => {
    onUpdate({
      config: { ...(data.config || {}), [key]: value },
    });
  }, [onUpdate, data.config]);

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <h3 className="text-sm font-medium text-slate-200">Configuration de l'étape</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Informations de base */}
        <Section title="Informations">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Titre</label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Titre de l'étape..."
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              <textarea
                value={data.description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Description de l'étape..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>
          </div>
        </Section>

        {/* Sélection des nœuds */}
        <Section title="Sélection des nœuds">
          {/* Mode de sélection */}
          <div className="flex gap-1 mb-3 p-1 bg-slate-900/50 rounded-lg">
            {[
              { id: 'types', label: 'Types' },
              { id: 'ids', label: 'IDs' },
              { id: 'where', label: 'Filtre' },
              { id: 'relative', label: 'Relatif' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSelectorMode(id as typeof selectorMode)}
                className={`
                  flex-1 px-2 py-1 text-xs rounded transition-colors
                  ${selectorMode === id
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-400 hover:text-slate-300'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sélection par types */}
          {selectorMode === 'types' && (
            <div className="space-y-2">
              <label className="block text-xs text-slate-500">Types de nœuds</label>
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {ALL_NODE_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-700/30 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={data.nodeSelector?.types?.includes(type) || false}
                      onChange={(e) => {
                        const currentTypes = data.nodeSelector?.types || [];
                        const newTypes = e.target.checked
                          ? [...currentTypes, type]
                          : currentTypes.filter((t) => t !== type);
                        handleTypesChange(newTypes);
                      }}
                      className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500/50"
                    />
                    <span className="text-xs text-slate-300">{NODE_TYPE_LABELS[type]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sélection par IDs */}
          {selectorMode === 'ids' && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">IDs (séparés par virgules)</label>
              <textarea
                value={data.nodeSelector?.ids?.join(', ') || ''}
                onChange={(e) => handleIdsChange(e.target.value)}
                placeholder="ID1, ID2, ID3..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono"
              />
            </div>
          )}

          {/* Sélection par filtre */}
          {selectorMode === 'where' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Filtrer par attributs (ex: criticite = "Critique")
              </p>
              <div className="space-y-2">
                {(data.nodeSelector?.where || []).map((condition, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={condition.field}
                      onChange={(e) => {
                        const newWhere = [...(data.nodeSelector?.where || [])];
                        newWhere[index] = { ...condition, field: e.target.value };
                        onUpdate({ nodeSelector: { ...data.nodeSelector, where: newWhere } });
                      }}
                      placeholder="champ"
                      className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-xs text-slate-200"
                    />
                    <select
                      value={condition.operator}
                      onChange={(e) => {
                        const newWhere = [...(data.nodeSelector?.where || [])];
                        newWhere[index] = { ...condition, operator: e.target.value as 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in' };
                        onUpdate({ nodeSelector: { ...data.nodeSelector, where: newWhere } });
                      }}
                      className="px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-xs text-slate-200"
                    >
                      <option value="eq">=</option>
                      <option value="neq">≠</option>
                      <option value="contains">contient</option>
                      <option value="gt">&gt;</option>
                      <option value="lt">&lt;</option>
                      <option value="in">dans</option>
                    </select>
                    <input
                      type="text"
                      value={String(condition.value)}
                      onChange={(e) => {
                        const newWhere = [...(data.nodeSelector?.where || [])];
                        newWhere[index] = { ...condition, value: e.target.value };
                        onUpdate({ nodeSelector: { ...data.nodeSelector, where: newWhere } });
                      }}
                      placeholder="valeur"
                      className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-xs text-slate-200"
                    />
                    <button
                      onClick={() => {
                        const newWhere = (data.nodeSelector?.where || []).filter((_, i) => i !== index);
                        onUpdate({ nodeSelector: { ...data.nodeSelector, where: newWhere } });
                      }}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newWhere = [...(data.nodeSelector?.where || []), { field: '', operator: 'eq' as const, value: '' }];
                    onUpdate({ nodeSelector: { ...data.nodeSelector, where: newWhere } });
                  }}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter une condition
                </button>
              </div>
            </div>
          )}

          {/* Sélection relative */}
          {selectorMode === 'relative' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">ID du nœud de référence</label>
                <input
                  type="text"
                  value={data.nodeSelector?.relativeTo?.nodeId || ''}
                  onChange={(e) => {
                    onUpdate({
                      nodeSelector: {
                        ...data.nodeSelector,
                        relativeTo: {
                          ...(data.nodeSelector?.relativeTo || { relation: 'neighbors' }),
                          nodeId: e.target.value,
                        },
                      },
                    });
                  }}
                  placeholder="ID du nœud..."
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Type de relation</label>
                <select
                  value={data.nodeSelector?.relativeTo?.relation || 'neighbors'}
                  onChange={(e) => {
                    onUpdate({
                      nodeSelector: {
                        ...data.nodeSelector,
                        relativeTo: {
                          ...(data.nodeSelector?.relativeTo || { nodeId: '' }),
                          relation: e.target.value as 'neighbors' | 'successors' | 'predecessors' | 'connected',
                        },
                      },
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {RELATION_TYPES.map(({ id, label }) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Profondeur</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={data.nodeSelector?.relativeTo?.depth || 1}
                  onChange={(e) => {
                    onUpdate({
                      nodeSelector: {
                        ...data.nodeSelector,
                        relativeTo: {
                          ...(data.nodeSelector?.relativeTo || { nodeId: '', relation: 'neighbors' }),
                          depth: parseInt(e.target.value) || 1,
                        },
                      },
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          )}
        </Section>

        {/* Actions */}
        <Section title="Actions">
          <div className="space-y-2">
            {ALL_ACTIONS.map(({ id, label, description }) => (
              <label
                key={id}
                className="flex items-start gap-3 p-2 rounded hover:bg-slate-700/30 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={data.actions?.includes(id) || false}
                  onChange={(e) => {
                    const currentActions = data.actions || [];
                    const newActions = e.target.checked
                      ? [...currentActions, id]
                      : currentActions.filter((a) => a !== id);
                    handleActionsChange(newActions);
                  }}
                  className="mt-0.5 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500/50"
                />
                <div>
                  <span className="text-sm text-slate-300">{label}</span>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* Options */}
        <Section title="Options" defaultOpen={false}>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/30 cursor-pointer">
              <input
                type="checkbox"
                checked={data.config?.autoZoom || false}
                onChange={(e) => handleConfigChange('autoZoom', e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500/50"
              />
              <span className="text-sm text-slate-300">Zoom automatique</span>
            </label>
            <label className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/30 cursor-pointer">
              <input
                type="checkbox"
                checked={data.config?.showEdges || false}
                onChange={(e) => handleConfigChange('showEdges', e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500/50"
              />
              <span className="text-sm text-slate-300">Afficher les relations</span>
            </label>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Couleur de surbrillance</label>
              <input
                type="color"
                value={data.config?.highlightColor || '#6366f1'}
                onChange={(e) => handleConfigChange('highlightColor', e.target.value)}
                className="w-full h-8 rounded border border-slate-700 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Durée animation (ms)</label>
              <input
                type="number"
                value={data.config?.animationDuration || 500}
                onChange={(e) => handleConfigChange('animationDuration', parseInt(e.target.value) || 500)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </Section>

        {/* Conseils */}
        <Section title="Conseils" defaultOpen={false}>
          <div className="space-y-2">
            {(data.tips || []).map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <input
                  type="text"
                  value={tip}
                  onChange={(e) => handleUpdateTip(index, e.target.value)}
                  placeholder="Conseil pour l'utilisateur..."
                  className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  onClick={() => handleRemoveTip(index)}
                  className="p-2 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddTip}
              className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
            >
              <Plus className="w-4 h-4" />
              Ajouter un conseil
            </button>
          </div>
        </Section>

        {/* Insights */}
        <Section title="Insights" defaultOpen={false}>
          <div className="space-y-3">
            {(data.insights || []).map((insight, index) => (
              <div key={index} className="p-2 bg-slate-900/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={insight.label}
                    onChange={(e) => handleUpdateInsight(index, 'label', e.target.value)}
                    placeholder="Label..."
                    className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    value={String(insight.value)}
                    onChange={(e) => handleUpdateInsight(index, 'value', e.target.value)}
                    placeholder="Valeur..."
                    className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-xs text-slate-200"
                  />
                  <button
                    onClick={() => handleRemoveInsight(index)}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {SEVERITY_OPTIONS.map(({ id, label, icon: Icon, color }) => (
                    <button
                      key={id}
                      onClick={() => handleUpdateInsight(index, 'severity', id)}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors
                        ${insight.severity === id
                          ? `bg-slate-700 ${color}`
                          : 'text-slate-500 hover:text-slate-400'
                        }
                      `}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleAddInsight}
              className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
            >
              <Plus className="w-4 h-4" />
              Ajouter un insight
            </button>
          </div>
        </Section>
      </div>
    </motion.div>
  );
}

export default StepConfigPanel;
