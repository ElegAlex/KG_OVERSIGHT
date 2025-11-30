/**
 * KG-Oversight - ScenarioSelector
 * Modal de sélection des scénarios disponibles
 */

import { useCallback, useState } from 'react';
import { useSetAtom } from 'jotai';
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
} from 'lucide-react';
import { startScenarioAtom } from '../stores/scenarioStore';
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
}: {
  scenario: Scenario;
  onSelect: () => void;
}) {
  const { metadata } = scenario;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
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

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </motion.button>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSelectScenario = useCallback(
    (scenario: Scenario) => {
      startScenario(scenario);
      onClose();
    },
    [startScenario, onClose]
  );

  // Filtrer les scénarios
  const filteredScenarios = predefinedScenarios.filter((scenario) => {
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

  // Catégories uniques
  const categories = [...new Set(predefinedScenarios.map((s) => s.metadata.category))];

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
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
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
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Aucun scénario trouvé</p>
                <p className="text-sm text-slate-500">
                  Essayez avec d'autres termes de recherche
                </p>
              </div>
            ) : (
              filteredScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.metadata.id}
                  scenario={scenario}
                  onSelect={() => handleSelectScenario(scenario)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 bg-slate-800/30">
            <p className="text-xs text-slate-500 text-center">
              {predefinedScenarios.length} scénarios disponibles • Utilisez les
              flèches pour naviguer dans un scénario
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ScenarioSelector;
