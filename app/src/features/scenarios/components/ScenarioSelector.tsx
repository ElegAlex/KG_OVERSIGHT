/**
 * KG-Oversight - ScenarioSelector
 * Modal de sélection des scénarios disponibles
 */

import { useCallback, useState } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  ClipboardCheck,
  Building2,
  TrendingUp,
  Search,
  Clock,
  Tag,
  ChevronRight,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Network,
} from 'lucide-react';
import { startScenarioAtom } from '../stores/scenarioStore';
import {
  openEditorAtom,
  resetEditorAtom,
  loadScenarioForEditAtom,
  customScenariosAtom,
  deleteCustomScenarioAtom,
} from '../stores/editorStore';
import {
  openERDEditorAtom,
  resetERDEditorAtom,
  erdCustomScenariosAtom,
  loadERDScenarioForEditAtom,
  deleteERDScenarioAtom,
} from '../stores/erdEditorStore';
import { predefinedScenarios } from '../data/predefinedScenarios';
import type { Scenario } from '../types/scenario';

// =============================================================================
// Helpers
// =============================================================================

const categoryIcons: Record<string, React.ReactNode> = {
  inspection: <ClipboardCheck className="w-5 h-5" />,
  monitoring: <Building2 className="w-5 h-5" />,
  risk: <TrendingUp className="w-5 h-5" />,
  audit: <Search className="w-5 h-5" />,
  custom: <Sparkles className="w-5 h-5" />,
};

const categoryLabels: Record<string, string> = {
  inspection: 'Inspection',
  monitoring: 'Surveillance',
  risk: 'Risque',
  audit: 'Audit',
  custom: 'Personnalisé',
};

// =============================================================================
// Sous-composants
// =============================================================================

function ScenarioCard({
  scenario,
  onSelect,
  onEdit,
  onDelete,
  isCustom = false,
}: {
  scenario: Scenario;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isCustom?: boolean;
}) {
  const { metadata } = scenario;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="w-full text-left p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl transition-colors group"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${metadata.color}20` }}
        >
          <div style={{ color: metadata.color }}>
            {categoryIcons[metadata.category] || <Play className="w-5 h-5" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-200 group-hover:text-white transition-colors">
              {metadata.title}
            </h3>
            <span
              className="px-2 py-0.5 text-xs rounded-full"
              style={{
                backgroundColor: `${metadata.color}20`,
                color: metadata.color,
              }}
            >
              {categoryLabels[metadata.category]}
            </span>
            {isCustom && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                Personnalisé
              </span>
            )}
          </div>

          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {metadata.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {metadata.estimatedDuration} min
            </span>
            <span className="flex items-center gap-1">
              {scenario.steps.length} étapes
            </span>
            {metadata.tags && metadata.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {metadata.tags.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isCustom && onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50 transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {isCustom && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onSelect}
            className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-700/50 transition-colors"
            title="Lancer"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Composant principal
// =============================================================================

interface ScenarioSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScenarioSelector({ isOpen, onClose }: ScenarioSelectorProps) {
  const startScenario = useSetAtom(startScenarioAtom);
  const openEditor = useSetAtom(openEditorAtom);
  const resetEditor = useSetAtom(resetEditorAtom);
  const loadScenarioForEdit = useSetAtom(loadScenarioForEditAtom);
  const customScenarios = useAtomValue(customScenariosAtom);
  const deleteCustomScenario = useSetAtom(deleteCustomScenarioAtom);

  // ERD Editor
  const openERDEditor = useSetAtom(openERDEditorAtom);
  const resetERDEditor = useSetAtom(resetERDEditorAtom);
  const erdCustomScenarios = useAtomValue(erdCustomScenariosAtom);
  const loadERDScenarioForEdit = useSetAtom(loadERDScenarioForEditAtom);
  const deleteERDScenario = useSetAtom(deleteERDScenarioAtom);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom' | 'erd'>('predefined');

  const handleSelectScenario = useCallback(
    (scenario: Scenario) => {
      startScenario(scenario);
      onClose();
    },
    [startScenario, onClose]
  );

  const handleCreateNew = useCallback(() => {
    resetEditor();
    openEditor();
    onClose();
  }, [resetEditor, openEditor, onClose]);

  const handleCreateERD = useCallback(() => {
    resetERDEditor();
    openERDEditor();
    onClose();
  }, [resetERDEditor, openERDEditor, onClose]);

  const handleEditERDScenario = useCallback(
    (scenario: Scenario) => {
      loadERDScenarioForEdit(scenario);
      onClose();
    },
    [loadERDScenarioForEdit, onClose]
  );

  const handleDeleteERDScenario = useCallback(
    (scenarioId: string) => {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce scénario ERD ?')) {
        deleteERDScenario(scenarioId);
      }
    },
    [deleteERDScenario]
  );

  const handleEditScenario = useCallback(
    (scenario: Scenario) => {
      loadScenarioForEdit(scenario);
      onClose();
    },
    [loadScenarioForEdit, onClose]
  );

  const handleDeleteScenario = useCallback(
    (scenarioId: string) => {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce scénario ?')) {
        deleteCustomScenario(scenarioId);
      }
    },
    [deleteCustomScenario]
  );

  // Combiner les scénarios
  const allScenarios = activeTab === 'erd'
    ? erdCustomScenarios
    : activeTab === 'custom'
      ? customScenarios
      : predefinedScenarios;

  // Filtrer les scénarios
  const filteredScenarios = allScenarios.filter((scenario) => {
    const matchesSearch =
      searchQuery === '' ||
      scenario.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.metadata.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === null || scenario.metadata.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Catégories uniques (depuis tous les scénarios)
  const categories = [...new Set([...predefinedScenarios, ...customScenarios, ...erdCustomScenarios].map((s) => s.metadata.category))];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Play className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-200">Scénarios guidés</h2>
                <p className="text-xs text-slate-500">
                  Navigation interactive pour vos analyses
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateERD}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                title="Créer un scénario basé sur le modèle ERD"
              >
                <Network className="w-4 h-4" />
                <span className="text-sm">Modéliser</span>
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                title="Créer un scénario d'exploration"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Créer</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-2 border-b border-slate-700/50">
            <button
              onClick={() => setActiveTab('predefined')}
              className={`
                flex-1 px-4 py-2 text-sm rounded-lg transition-colors
                ${activeTab === 'predefined'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                }
              `}
            >
              Prédéfinis ({predefinedScenarios.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`
                flex-1 px-4 py-2 text-sm rounded-lg transition-colors
                ${activeTab === 'custom'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                }
              `}
            >
              Personnalisés ({customScenarios.length})
            </button>
            <button
              onClick={() => setActiveTab('erd')}
              className={`
                flex-1 px-4 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1
                ${activeTab === 'erd'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                }
              `}
            >
              <Network className="w-3.5 h-3.5" />
              ERD ({erdCustomScenarios.length})
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-700/50 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un scénario..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Category filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`
                  px-3 py-1.5 text-sm rounded-lg border transition-colors
                  ${selectedCategory === null
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }
                `}
              >
                Tous
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors
                    ${selectedCategory === category
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }
                  `}
                >
                  {categoryIcons[category]}
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Scenarios list */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-200px)] space-y-3">
            {filteredScenarios.length === 0 ? (
              <div className="text-center py-12">
                {activeTab === 'custom' ? (
                  <>
                    <Plus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Aucun scénario personnalisé</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Créez votre premier scénario avec l'éditeur visuel
                    </p>
                    <button
                      onClick={handleCreateNew}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      Créer un scénario
                    </button>
                  </>
                ) : activeTab === 'erd' ? (
                  <>
                    <Network className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Aucun scénario ERD</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Modélisez un scénario à partir du modèle entités-relations
                    </p>
                    <button
                      onClick={handleCreateERD}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      Modéliser un scénario
                    </button>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Aucun scénario trouvé</p>
                    <p className="text-sm text-slate-500">
                      Essayez avec d'autres termes de recherche
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.metadata.id}
                  scenario={scenario}
                  onSelect={() => handleSelectScenario(scenario)}
                  onEdit={
                    activeTab === 'custom'
                      ? () => handleEditScenario(scenario)
                      : activeTab === 'erd'
                        ? () => handleEditERDScenario(scenario)
                        : undefined
                  }
                  onDelete={
                    activeTab === 'custom'
                      ? () => handleDeleteScenario(scenario.metadata.id)
                      : activeTab === 'erd'
                        ? () => handleDeleteERDScenario(scenario.metadata.id)
                        : undefined
                  }
                  isCustom={activeTab === 'custom' || activeTab === 'erd'}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 bg-slate-800/30">
            <p className="text-xs text-slate-500 text-center">
              {predefinedScenarios.length + customScenarios.length + erdCustomScenarios.length} scénarios disponibles • "Créer" pour exploration, "Modéliser" pour ERD
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ScenarioSelector;
