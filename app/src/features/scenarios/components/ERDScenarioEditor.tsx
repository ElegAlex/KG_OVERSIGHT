/**
 * KG-Oversight - Éditeur de scénarios basé sur le modèle ERD
 * Interface intuitive pour créer des scénarios en construisant un parcours d'entités
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Play,
  Trash2,
  ChevronRight,
  ArrowRight,
  Plus,
  Filter,
  Info,
  Building2,
  FileText,
  FileCheck,
  FlaskConical,
  Layers,
  ClipboardCheck,
  Search,
  AlertTriangle,
  AlertCircle,
  Users,
  Gavel,
  Shield,
  Scale,
  BarChart3,
  Bell,
  Calendar,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Circle,
  LayoutGrid,
  Network,
  Eye,
} from 'lucide-react';

import {
  isERDEditorOpenAtom,
  closeERDEditorAtom,
  erdEditorStateAtom,
  erdPathAtom,
  erdMetadataAtom,
  lastEntityInPathAtom,
  connectedEntitiesAtom,
  isERDScenarioValidAtom,
  addEntityToPathAtom,
  removeStepFromPathAtom,
  updateStepAtom,
  selectStepForEditAtom,
  updateERDMetadataAtom,
  exportERDScenarioAtom,
  saveERDScenarioAtom,
  resetERDEditorAtom,
  type ERDPathStep,
  type ERDSelectionMode,
  type ERDStepFilter,
  type SaveResult,
} from '../stores/erdEditorStore';
import { allNodesAtom } from '@shared/stores/selectionAtoms';
import type { GraphNode } from '@data/types';
import { startScenarioAtom } from '../stores/scenarioStore';
import {
  schemaEntities,
  schemaRelations,
  getEntityByType,
  categoryColors,
  categoryLabels,
  type SchemaEntity,
} from '../data/schemaDefinition';
import { ERDCanvas } from './ERDCanvas';
import { ERDPathViewer } from './ERDPathViewer';
import type { NodeType } from '@data/types/entities';

// =============================================================================
// Icônes mapping
// =============================================================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  FileText,
  FileCheck,
  FlaskConical,
  Layers,
  ClipboardCheck,
  Search,
  AlertTriangle,
  AlertCircle,
  Users,
  Gavel,
  Shield,
  Scale,
  BarChart3,
  Bell,
  Calendar,
};

function EntityIcon({ iconName, className, style }: { iconName: string; className?: string; style?: React.CSSProperties }) {
  const Icon = iconMap[iconName] || Building2;
  return <Icon className={className} style={style} />;
}

// =============================================================================
// Carte d'entité (sidebar gauche)
// =============================================================================

interface EntityCardProps {
  entity: SchemaEntity;
  status: 'available' | 'connected' | 'in-path' | 'disabled';
  onClick: () => void;
  relationLabel?: string;
}

function EntityCard({ entity, status, onClick, relationLabel }: EntityCardProps) {
  const statusStyles = {
    available: 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/50 cursor-pointer',
    connected: 'border-emerald-500/70 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20 cursor-pointer ring-1 ring-emerald-500/30',
    'in-path': 'border-indigo-500 bg-indigo-500/20 cursor-default opacity-60',
    disabled: 'border-slate-700 bg-slate-900/50 opacity-30 cursor-not-allowed',
  };

  return (
    <motion.button
      whileHover={status !== 'disabled' && status !== 'in-path' ? { scale: 1.02 } : {}}
      whileTap={status !== 'disabled' && status !== 'in-path' ? { scale: 0.98 } : {}}
      onClick={status !== 'disabled' && status !== 'in-path' ? onClick : undefined}
      disabled={status === 'disabled' || status === 'in-path'}
      className={`
        w-full p-3 rounded-xl border-2 transition-all text-left
        ${statusStyles[status]}
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${entity.color}25` }}
        >
          <EntityIcon iconName={entity.icon} className="w-5 h-5" style={{ color: entity.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200 truncate">{entity.label}</p>
          <p className="text-xs text-slate-500 truncate">{entity.description}</p>
        </div>
        {status === 'connected' && (
          <div className="flex-shrink-0">
            <Plus className="w-5 h-5 text-emerald-400" />
          </div>
        )}
        {status === 'in-path' && (
          <div className="flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          </div>
        )}
      </div>
      {status === 'connected' && relationLabel && (
        <div className="mt-2 px-2 py-1 bg-emerald-500/20 rounded text-xs text-emerald-300 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          <span className="truncate">{relationLabel}</span>
        </div>
      )}
    </motion.button>
  );
}

// =============================================================================
// Étape du parcours
// =============================================================================

interface PathStepCardProps {
  step: ERDPathStep;
  index: number;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  relationLabel?: string;
}

function PathStepCard({ step, index, isLast, isSelected, onSelect, onRemove, relationLabel }: PathStepCardProps) {
  const entity = getEntityByType(step.entityType);

  return (
    <div className="flex items-center gap-3">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`
          relative p-4 rounded-xl border-2 transition-all cursor-pointer min-w-[160px]
          ${isSelected
            ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
            : 'border-slate-700 bg-slate-800 hover:border-slate-600'
          }
          ${isLast ? 'ring-2 ring-amber-500/50 ring-offset-2 ring-offset-slate-900' : ''}
        `}
        onClick={onSelect}
      >
        {/* Numéro d'étape */}
        <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shadow-lg">
          {index + 1}
        </div>

        {/* Bouton supprimer */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${entity?.color}25` }}
          >
            <EntityIcon iconName={entity?.icon || 'Building2'} className="w-6 h-6" style={{ color: entity?.color }} />
          </div>
          <div>
            <p className="font-medium text-slate-200">{entity?.label}</p>
            {step.description ? (
              <p className="text-xs text-slate-400 line-clamp-1">{step.description}</p>
            ) : (
              <p className="text-xs text-slate-600 italic">Cliquer pour configurer</p>
            )}
          </div>
        </div>

        {/* Indicateur de mode de sélection */}
        {step.selectionMode === 'specific' && step.selectedNodeIds && step.selectedNodeIds.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs">{step.selectedNodeIds.length} sélectionné{step.selectedNodeIds.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {step.selectionMode === 'filtered' && step.filters && step.filters.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-amber-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs">{step.filters.length} filtre{step.filters.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </motion.div>

      {/* Flèche avec label de relation */}
      {!isLast && (
        <div className="flex flex-col items-center gap-1 text-slate-500 px-2">
          <span className="text-[10px] text-slate-600 max-w-[100px] text-center leading-tight">
            {relationLabel}
          </span>
          <ChevronRight className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Panneau de configuration avec sélection d'instances
// =============================================================================

interface ConfigPanelProps {
  step: ERDPathStep;
  onUpdate: (updates: Partial<ERDPathStep>) => void;
  onClose: () => void;
  allNodes: Map<string, GraphNode>;
}

function ConfigPanel({ step, onUpdate, onClose, allNodes }: ConfigPanelProps) {
  const entity = getEntityByType(step.entityType);
  const [instanceSearch, setInstanceSearch] = useState('');

  // Filtrer les nœuds du type correspondant
  const instancesOfType = useMemo(() => {
    const instances: GraphNode[] = [];
    for (const [, node] of allNodes) {
      if (node._type === step.entityType) {
        instances.push(node);
      }
    }
    // Trier par nom
    return instances.sort((a, b) => (a.nom || a.id).localeCompare(b.nom || b.id));
  }, [allNodes, step.entityType]);

  // Filtrer par recherche
  const filteredInstances = useMemo(() => {
    if (!instanceSearch.trim()) return instancesOfType;
    const search = instanceSearch.toLowerCase();
    return instancesOfType.filter(
      (node) =>
        (node.nom || '').toLowerCase().includes(search) ||
        node.id.toLowerCase().includes(search) ||
        (node.description || '').toLowerCase().includes(search)
    );
  }, [instancesOfType, instanceSearch]);

  // Gérer la sélection/désélection d'une instance
  const toggleInstance = useCallback((nodeId: string) => {
    const currentIds = new Set(step.selectedNodeIds || []);
    if (currentIds.has(nodeId)) {
      currentIds.delete(nodeId);
    } else {
      currentIds.add(nodeId);
    }
    onUpdate({
      selectedNodeIds: Array.from(currentIds),
      selectionMode: currentIds.size > 0 ? 'specific' : 'all',
    });
  }, [step.selectedNodeIds, onUpdate]);

  // Sélectionner/Désélectionner tout
  const selectAll = useCallback(() => {
    onUpdate({
      selectedNodeIds: filteredInstances.map((n) => n.id),
      selectionMode: 'specific',
    });
  }, [filteredInstances, onUpdate]);

  const deselectAll = useCallback(() => {
    onUpdate({
      selectedNodeIds: [],
      selectionMode: 'all',
    });
  }, [onUpdate]);

  const selectedSet = useMemo(() => new Set(step.selectedNodeIds || []), [step.selectedNodeIds]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="font-medium text-slate-200">Configuration de l'étape</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* En-tête entité */}
        <div className="p-4 bg-slate-900/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${entity?.color}25` }}
            >
              <EntityIcon iconName={entity?.icon || 'Building2'} className="w-6 h-6" style={{ color: entity?.color }} />
            </div>
            <div>
              <p className="font-medium text-slate-200">{entity?.label}</p>
              <p className="text-xs text-slate-500">{instancesOfType.length} instance{instancesOfType.length > 1 ? 's' : ''} disponible{instancesOfType.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Mode de sélection */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Mode de sélection</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onUpdate({ selectionMode: 'all', selectedNodeIds: [], filters: [] })}
              className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                step.selectionMode === 'all'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => onUpdate({ selectionMode: 'specific', filters: [] })}
              className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                step.selectionMode === 'specific'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              Spécifiques
            </button>
            <button
              onClick={() => onUpdate({ selectionMode: 'filtered', selectedNodeIds: [] })}
              className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                step.selectionMode === 'filtered'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              Filtrés
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Description de l'étape
          </label>
          <textarea
            value={step.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder={`Que cherchez-vous dans ${entity?.label} ?`}
            rows={2}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
          />
        </div>

        {/* Sélection d'instances spécifiques */}
        {step.selectionMode === 'specific' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-400">
                Instances sélectionnées
                {selectedSet.size > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                    {selectedSet.size}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Tout
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Aucun
                </button>
              </div>
            </div>

            {/* Recherche */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={instanceSearch}
                onChange={(e) => setInstanceSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Liste des instances */}
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700 divide-y divide-slate-700/50">
              {filteredInstances.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  {instanceSearch ? 'Aucun résultat' : 'Aucune instance disponible'}
                </div>
              ) : (
                filteredInstances.map((node) => {
                  const isSelected = selectedSet.has(node.id);
                  return (
                    <button
                      key={node.id}
                      onClick={() => toggleInstance(node.id)}
                      className={`w-full p-3 text-left transition-colors flex items-center gap-3 ${
                        isSelected
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'bg-slate-900/30 hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200 truncate">{node.nom || node.id}</p>
                        {node.statut && (
                          <p className="text-xs text-slate-500 truncate">{node.statut}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Filtres (mode filtered) */}
        {step.selectionMode === 'filtered' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-400">Filtres</label>
              <button
                onClick={() => {
                  const newFilters: ERDStepFilter[] = [...(step.filters || []), { field: '', operator: 'eq', value: '' }];
                  onUpdate({ filters: newFilters });
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Ajouter
              </button>
            </div>

            {(!step.filters || step.filters.length === 0) && (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/30 rounded-lg">
                Ajoutez des filtres pour affiner la sélection
              </p>
            )}

            <div className="space-y-2">
              {(step.filters || []).map((filter, index) => (
                <div key={index} className="p-3 bg-slate-900/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) => {
                        const newFilters = [...(step.filters || [])];
                        newFilters[index] = { ...filter, field: e.target.value };
                        onUpdate({ filters: newFilters });
                      }}
                      className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200"
                    >
                      <option value="">Choisir un attribut...</option>
                      {entity?.attributes.map((attr) => (
                        <option key={attr} value={attr}>{attr}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const newFilters = (step.filters || []).filter((_, i) => i !== index);
                        onUpdate({ filters: newFilters });
                      }}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={filter.operator}
                      onChange={(e) => {
                        const newFilters = [...(step.filters || [])];
                        newFilters[index] = { ...filter, operator: e.target.value as ERDStepFilter['operator'] };
                        onUpdate({ filters: newFilters });
                      }}
                      className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200"
                    >
                      <option value="eq">égal à</option>
                      <option value="neq">différent de</option>
                      <option value="contains">contient</option>
                      <option value="gt">supérieur à</option>
                      <option value="lt">inférieur à</option>
                      <option value="in">parmi</option>
                    </select>
                    <input
                      type="text"
                      value={String(filter.value)}
                      onChange={(e) => {
                        const newFilters = [...(step.filters || [])];
                        newFilters[index] = { ...filter, value: e.target.value };
                        onUpdate({ filters: newFilters });
                      }}
                      placeholder="Valeur"
                      className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résumé de sélection */}
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            {step.selectionMode === 'all' && (
              <>
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-300">
                  Tous les <span className="text-indigo-400">{instancesOfType.length}</span> {entity?.label}
                </span>
              </>
            )}
            {step.selectionMode === 'specific' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  <span className="text-emerald-400">{selectedSet.size}</span> sur {instancesOfType.length} sélectionné{selectedSet.size > 1 ? 's' : ''}
                </span>
              </>
            )}
            {step.selectionMode === 'filtered' && (
              <>
                <Filter className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">
                  <span className="text-amber-400">{(step.filters || []).length}</span> filtre{(step.filters || []).length > 1 ? 's' : ''} appliqué{(step.filters || []).length > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Attributs disponibles */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Attributs disponibles</label>
          <div className="flex flex-wrap gap-1.5">
            {entity?.attributes.map((attr) => (
              <span
                key={attr}
                className="px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Composant principal
// =============================================================================

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`
        fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3
        ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}
      `}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ERDScenarioEditor() {
  const isOpen = useAtomValue(isERDEditorOpenAtom);
  const closeEditor = useSetAtom(closeERDEditorAtom);
  const resetEditor = useSetAtom(resetERDEditorAtom);

  const state = useAtomValue(erdEditorStateAtom);
  const path = useAtomValue(erdPathAtom);
  const metadata = useAtomValue(erdMetadataAtom);
  const lastEntity = useAtomValue(lastEntityInPathAtom);
  const connectedEntities = useAtomValue(connectedEntitiesAtom);
  const isValid = useAtomValue(isERDScenarioValidAtom);
  const exportedScenario = useAtomValue(exportERDScenarioAtom);
  const allNodes = useAtomValue(allNodesAtom);

  const addEntityToPath = useSetAtom(addEntityToPathAtom);
  const removeStepFromPath = useSetAtom(removeStepFromPathAtom);
  const updateStep = useSetAtom(updateStepAtom);
  const selectStepForEdit = useSetAtom(selectStepForEditAtom);
  const updateMetadata = useSetAtom(updateERDMetadataAtom);
  const saveScenario = useSetAtom(saveERDScenarioAtom);
  const startScenario = useSetAtom(startScenarioAtom);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'canvas' | 'preview'>('canvas');
  const [canvasMode, setCanvasMode] = useState<'select' | 'pan'>('select');
  const [previewStepIndex, setPreviewStepIndex] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Entités dans le parcours
  const pathEntityTypes = useMemo(() => new Set(path.map((s) => s.entityType)), [path]);

  // Map des entités connectées avec leur relation
  const connectedEntityMap = useMemo(() => {
    const map = new Map<NodeType, string>();
    if (!lastEntity) return map;

    for (const rel of schemaRelations) {
      if (rel.source === lastEntity && !pathEntityTypes.has(rel.target)) {
        map.set(rel.target, rel.label);
      }
      if (rel.target === lastEntity && !pathEntityTypes.has(rel.source)) {
        map.set(rel.source, rel.label);
      }
    }
    return map;
  }, [lastEntity, pathEntityTypes]);

  // Filtrer les entités par catégorie
  const displayedEntities = useMemo(() => {
    if (!selectedCategory) return schemaEntities;
    return schemaEntities.filter((e) => e.category === selectedCategory);
  }, [selectedCategory]);

  // Gérer le clic sur une entité
  const handleEntityClick = useCallback((entityType: NodeType) => {
    addEntityToPath(entityType);
  }, [addEntityToPath]);

  // Étape en cours d'édition
  const editingStep = useMemo(
    () => path.find((s) => s.id === state.editingStepId),
    [path, state.editingStepId]
  );

  // Tester le scénario
  const handleTest = useCallback(() => {
    startScenario(exportedScenario);
    closeEditor();
  }, [exportedScenario, startScenario, closeEditor]);

  // Sauvegarder avec feedback
  const handleSave = useCallback(() => {
    const result = saveScenario() as SaveResult;
    if (result.success) {
      setToast({ message: result.message, type: 'success' });
    } else {
      setToast({ message: result.message, type: 'error' });
    }
  }, [saveScenario]);

  // Fermer
  const handleClose = useCallback(() => {
    if (state.isDirty) {
      if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?')) {
        closeEditor();
      }
    } else {
      closeEditor();
    }
  }, [closeEditor, state.isDirty]);

  // Trouver le label de la relation pour chaque étape
  const getRelationLabel = (index: number) => {
    if (index >= path.length - 1) return undefined;
    const currentStep = path[index];
    const nextStep = path[index + 1];
    const rel = schemaRelations.find(
      (r) =>
        (r.source === currentStep.entityType && r.target === nextStep.entityType) ||
        (r.target === currentStep.entityType && r.source === nextStep.entityType)
    );
    return rel?.label;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-slate-900"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <input
                  type="text"
                  value={metadata.title || ''}
                  onChange={(e) => updateMetadata({ title: e.target.value })}
                  placeholder="Nom du scénario..."
                  className="text-lg font-semibold text-slate-200 bg-transparent border-none focus:outline-none placeholder:text-slate-500 w-64"
                />
                <input
                  type="text"
                  value={metadata.description || ''}
                  onChange={(e) => updateMetadata({ description: e.target.value })}
                  placeholder="Description (optionnel)"
                  className="block text-sm text-slate-400 bg-transparent border-none focus:outline-none placeholder:text-slate-600 w-96"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {state.isDirty && (
              <span className="flex items-center gap-1.5 text-xs text-amber-400">
                <Circle className="w-2 h-2 fill-current" />
                Non sauvegardé
              </span>
            )}

            <button
              onClick={() => {
                if (confirm('Voulez-vous vraiment recommencer ?')) {
                  resetEditor();
                }
              }}
              className="px-3 py-2 text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Recommencer
            </button>

            <button
              onClick={handleTest}
              disabled={!isValid}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              Tester
            </button>

            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </header>

        {/* Contenu principal - Layout vertical */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle de vue + Canvas/Liste */}
          <div className="flex-1 flex overflow-hidden">
            {/* Zone principale avec toggle de vue */}
            <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              {/* Barre d'outils avec toggle de vue */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  {/* Toggle Vue Liste / Canvas / Aperçu */}
                  <div className="flex items-center bg-slate-900/50 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('canvas')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                        viewMode === 'canvas'
                          ? 'bg-indigo-500/30 text-indigo-400'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <Network className="w-3.5 h-3.5" />
                      Schéma
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-indigo-500/30 text-indigo-400'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Liste
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      disabled={path.length === 0}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                        viewMode === 'preview'
                          ? 'bg-purple-500/30 text-purple-400'
                          : 'text-slate-400 hover:text-slate-300'
                      } ${path.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Aperçu
                    </button>
                  </div>

                  {/* Filtres catégorie (uniquement en mode liste) */}
                  {viewMode === 'list' && (
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          !selectedCategory ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        Toutes
                      </button>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedCategory(key)}
                          className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                            selectedCategory === key ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[key as keyof typeof categoryColors] }} />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Aide contextuelle */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {path.length === 0 ? (
                    <span>Cliquez sur une entité pour commencer</span>
                  ) : (
                    <span>Entités <span className="text-emerald-400">vertes</span> = connectées, cliquez pour ajouter</span>
                  )}
                </div>
              </div>

              {/* Zone de contenu - Canvas ERD, Liste ou Aperçu */}
              <div className="flex-1 overflow-hidden">
                {viewMode === 'canvas' && (
                  /* Canvas ERD interactif */
                  <div className="h-full p-4">
                    <ERDCanvas
                      pathEntities={path.map(s => s.entityType)}
                      lastEntity={lastEntity}
                      connectedEntities={connectedEntities.map(e => e.type)}
                      onEntityClick={handleEntityClick}
                      mode={canvasMode}
                      height={500}
                    />
                  </div>
                )}

                {viewMode === 'list' && (
                  /* Liste des entités (mode classique) */
                  <div className="h-full overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {displayedEntities.map((entity) => {
                        const isInPath = pathEntityTypes.has(entity.type);
                        const isConnected = connectedEntityMap.has(entity.type);
                        const relationLabel = connectedEntityMap.get(entity.type);

                        let status: EntityCardProps['status'];
                        if (isInPath) {
                          status = 'in-path';
                        } else if (isConnected) {
                          status = 'connected';
                        } else if (path.length === 0) {
                          status = 'available';
                        } else {
                          status = 'disabled';
                        }

                        return (
                          <EntityCard
                            key={entity.type}
                            entity={entity}
                            status={status}
                            onClick={() => handleEntityClick(entity.type)}
                            relationLabel={relationLabel}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {viewMode === 'preview' && (
                  /* Aperçu animé du parcours */
                  <ERDPathViewer
                    path={path}
                    currentStepIndex={previewStepIndex}
                    onStepClick={(index) => {
                      setPreviewStepIndex(index);
                      selectStepForEdit(path[index]?.id || null);
                    }}
                    isPlaying={isPreviewPlaying}
                    onPlayPause={() => setIsPreviewPlaying(!isPreviewPlaying)}
                    onNext={() => setPreviewStepIndex((prev) => Math.min(prev + 1, path.length - 1))}
                    onPrev={() => setPreviewStepIndex((prev) => Math.max(prev - 1, 0))}
                    onReset={() => {
                      setPreviewStepIndex(0);
                      setIsPreviewPlaying(false);
                    }}
                    showControls={true}
                    autoPlayInterval={2500}
                  />
                )}
              </div>
            </main>

            {/* Panneau de configuration */}
            <AnimatePresence>
              {editingStep && (
                <ConfigPanel
                  step={editingStep}
                  onUpdate={(updates) => updateStep({ stepId: editingStep.id, updates })}
                  onClose={() => selectStepForEdit(null)}
                  allNodes={allNodes}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Barre de parcours (Path Builder) - en bas */}
          <div className="border-t border-slate-700 bg-slate-800/50">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-slate-300">Parcours construit</h3>
                  <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded-full">
                    {path.length} étape{path.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Indicateur de validité */}
                <div className="flex items-center gap-2">
                  {path.length < 2 ? (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Minimum 2 étapes requises
                    </span>
                  ) : !metadata.title?.trim() ? (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Nom du scénario requis
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Prêt à sauvegarder
                    </span>
                  )}
                </div>
              </div>

              {/* Étapes du parcours */}
              {path.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-slate-500 text-sm">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>Cliquez sur une entité dans le diagramme pour commencer votre parcours</span>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center gap-2 min-w-max">
                    <AnimatePresence mode="popLayout">
                      {path.map((step, index) => (
                        <PathStepCard
                          key={step.id}
                          step={step}
                          index={index}
                          isLast={index === path.length - 1}
                          isSelected={state.editingStepId === step.id}
                          onSelect={() => selectStepForEdit(step.id)}
                          onRemove={() => removeStepFromPath(step.id)}
                          relationLabel={getRelationLabel(index)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast notification */}
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

export default ERDScenarioEditor;
