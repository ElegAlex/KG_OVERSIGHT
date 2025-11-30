/**
 * KG-Oversight - Panneau de filtres moderne
 * Design system inspiré Linear/Vercel
 */

import { useAtom, useAtomValue } from 'jotai';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Layers,
  AlertTriangle,
  Activity,
  X,
  RotateCcw,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  visibleNodeTypesAtom,
  visibleCriticitesAtom,
  visibleStatutsAtom,
  searchQueryAtom,
  filteredNodesAtom,
  allNodesAtom,
} from '@shared/stores/selectionAtoms';
import { NODE_COLORS, NODE_LABELS, CRITICITE_COLORS, STATUT_COLORS, STATUT_LABELS } from '@shared/utils/nodeStyles';
import { cn } from '@/lib/utils';
import { collapseContent, rotateChevron, listItem, staggerContainer } from '@/lib/animations';
import type { NodeType, Criticite, CategorieStatut } from '@data/types';

// Catégories de types de noeuds avec icônes modernes
const NODE_TYPE_CATEGORIES: Record<
  string,
  { label: string; types: NodeType[]; emoji: string }
> = {
  acteurs: {
    label: 'Acteurs',
    emoji: '🏢',
    types: ['SousTraitant', 'EtudeClinique'],
  },
  documents: {
    label: 'Documents',
    emoji: '📄',
    types: ['Contrat', 'AccordQualite'],
  },
  qualite: {
    label: 'Qualité',
    emoji: '🔍',
    types: ['Audit', 'Inspection', 'Finding', 'EvenementQualite'],
  },
  decisions: {
    label: 'Décisions & Risques',
    emoji: '⚖️',
    types: ['Decision', 'EvaluationRisque', 'ReunionQualite'],
  },
  alertes: {
    label: 'Alertes & Événements',
    emoji: '🚨',
    types: ['Alerte', 'Evenement'],
  },
  contexte: {
    label: 'Contexte',
    emoji: '📊',
    types: ['DomaineService', 'ContexteReglementaire', 'KQI'],
  },
};

const ALL_NODE_TYPES: NodeType[] = Object.values(NODE_TYPE_CATEGORIES).flatMap(
  (cat) => cat.types
);

const ALL_CRITICITES: (Criticite | '')[] = [
  'Critique',
  'Majeur',
  'Standard',
  'Mineur',
  '',
];

const ALL_STATUTS: (CategorieStatut | '')[] = [
  'actif',
  'en_cours',
  'planifie',
  'cloture',
  'archive',
  '',
];

// Composant Section accordéon modernisé
function FilterSection({
  title,
  emoji,
  count,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  emoji: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-800/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{emoji}</span>
          <span className="text-sm font-medium text-slate-300">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <motion.div
          variants={rotateChevron}
          animate={isOpen ? 'open' : 'closed'}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={collapseContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t border-white/5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Composant ligne type de noeud modernisée
function NodeTypeRow({
  label,
  color,
  count,
  checked,
  onChange,
}: {
  label: string;
  color: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
        'transition-all duration-200',
        checked ? 'bg-white/5' : 'hover:bg-white/[0.02]'
      )}
    >
      {/* Checkbox custom */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-4 h-4 rounded border-2 transition-all duration-200',
            'flex items-center justify-center',
            checked
              ? 'border-indigo-500 bg-indigo-500'
              : 'border-slate-600 bg-transparent'
          )}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>

      {/* Color dot + label */}
      <div
        className="w-3 h-3 rounded-full ring-2 ring-white/10 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span
        className={cn(
          'flex-1 text-sm transition-colors truncate',
          checked ? 'text-slate-200' : 'text-slate-500'
        )}
      >
        {label}
      </span>
      <span className="text-xs text-slate-600 tabular-nums">{count}</span>
    </label>
  );
}

interface FilterPanelProps {
  className?: string;
}

export function FilterPanel({ className = '' }: FilterPanelProps) {
  const [visibleTypes, setVisibleTypes] = useAtom(visibleNodeTypesAtom);
  const [visibleCriticites, setVisibleCriticites] = useAtom(
    visibleCriticitesAtom
  );
  const [visibleStatuts, setVisibleStatuts] = useAtom(visibleStatutsAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const filteredNodes = useAtomValue(filteredNodesAtom);
  const allNodes = useAtomValue(allNodesAtom);

  // État des sections ouvertes
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['acteurs', 'qualite'])
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Toggle un type de noeud
  const toggleNodeType = (type: NodeType) => {
    const newTypes = new Set(visibleTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setVisibleTypes(newTypes);
  };

  // Toggle une criticité
  const toggleCriticite = (crit: Criticite | '') => {
    const newCrits = new Set(visibleCriticites);
    if (newCrits.has(crit)) {
      newCrits.delete(crit);
    } else {
      newCrits.add(crit);
    }
    setVisibleCriticites(newCrits);
  };

  // Toggle un statut
  const toggleStatut = (statut: CategorieStatut | '') => {
    const newStatuts = new Set(visibleStatuts);
    if (newStatuts.has(statut)) {
      newStatuts.delete(statut);
    } else {
      newStatuts.add(statut);
    }
    setVisibleStatuts(newStatuts);
  };

  // Toggle tous les types d'une catégorie
  const toggleCategory = (categoryTypes: NodeType[], allSelected: boolean) => {
    const newTypes = new Set(visibleTypes);
    if (allSelected) {
      categoryTypes.forEach((t) => newTypes.delete(t));
    } else {
      categoryTypes.forEach((t) => newTypes.add(t));
    }
    setVisibleTypes(newTypes);
  };

  // Sélectionner/désélectionner tous les types
  const selectAllTypes = () => {
    setVisibleTypes(new Set(ALL_NODE_TYPES));
  };

  const deselectAllTypes = () => {
    setVisibleTypes(new Set());
  };

  // Reset tous les filtres
  const resetFilters = () => {
    setSearchQuery('');
    setVisibleTypes(new Set(ALL_NODE_TYPES));
    setVisibleCriticites(new Set(ALL_CRITICITES));
    setVisibleStatuts(new Set(ALL_STATUTS));
  };

  // Compter les noeuds par type
  const countByType = useMemo(() => {
    const counts = new Map<NodeType, number>();
    for (const [, node] of allNodes) {
      counts.set(node._type, (counts.get(node._type) || 0) + 1);
    }
    return counts;
  }, [allNodes]);

  // Compter les types visibles par catégorie
  const getCategoryStats = (types: NodeType[]) => {
    let total = 0;
    for (const type of types) {
      total += countByType.get(type) || 0;
    }
    return {
      total,
      allSelected: types.every((t) => visibleTypes.has(t)),
    };
  };

  // Pourcentage affiché
  const displayPercentage =
    allNodes.size > 0
      ? Math.round((filteredNodes.size / allNodes.size) * 100)
      : 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header sticky avec recherche */}
      <div className="p-4 border-b border-white/5 sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-200">Filtres</h2>
        </div>

        {/* Search bar moderne */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="input-modern"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-700/50 rounded hidden group-focus-within:hidden">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Compteur avec barre de progression moderne */}
        <div className="glass-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">
              Noeuds affichés
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              {filteredNodes.size} / {allNodes.size}
            </span>
          </div>
          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${displayPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-slate-500">
              {displayPercentage}% visible
            </span>
          </div>
        </div>

        {/* Actions globales types */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Types de noeuds
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllTypes}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Tous
            </button>
            <span className="text-xs text-slate-600">/</span>
            <button
              onClick={deselectAllTypes}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Aucun
            </button>
          </div>
        </div>

        {/* Accordéon par catégorie */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          {Object.entries(NODE_TYPE_CATEGORIES).map(
            ([categoryId, category]) => {
              const stats = getCategoryStats(category.types);

              return (
                <motion.div key={categoryId} variants={listItem}>
                  <FilterSection
                    title={category.label}
                    emoji={category.emoji}
                    count={stats.total}
                    isOpen={openSections.has(categoryId)}
                    onToggle={() => toggleSection(categoryId)}
                  >
                    {/* Bouton tout sélectionner/désélectionner */}
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() =>
                          toggleCategory(category.types, stats.allSelected)
                        }
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {stats.allSelected ? 'Désélectionner' : 'Tout sélectionner'}
                      </button>
                    </div>

                    <div className="space-y-0.5">
                      {category.types.map((type) => {
                        const count = countByType.get(type) || 0;
                        const isVisible = visibleTypes.has(type);

                        return (
                          <NodeTypeRow
                            key={type}
                            label={NODE_LABELS[type]}
                            color={NODE_COLORS[type]?.bg ?? '#6B7280'}
                            count={count}
                            checked={isVisible}
                            onChange={() => toggleNodeType(type)}
                          />
                        );
                      })}
                    </div>
                  </FilterSection>
                </motion.div>
              );
            }
          )}
        </motion.div>

        {/* Filtres par criticité */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Criticité
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CRITICITES.map((crit) => {
              const isVisible = visibleCriticites.has(crit);
              const label = crit || 'N/A';
              const color = crit ? CRITICITE_COLORS[crit] : '#6B7280';

              return (
                <button
                  key={crit || 'none'}
                  onClick={() => toggleCriticite(crit)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200',
                    isVisible
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-transparent border-current opacity-50 hover:opacity-75'
                  )}
                  style={{
                    backgroundColor: isVisible ? color : 'transparent',
                    color: isVisible ? 'white' : color,
                    borderColor: isVisible ? 'transparent' : color,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtres par statut */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Statut
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUTS.map((statut) => {
              const isVisible = visibleStatuts.has(statut);
              const label = statut ? STATUT_LABELS[statut] : 'N/A';
              const color = statut ? STATUT_COLORS[statut] : '#6B7280';

              return (
                <button
                  key={statut || 'none'}
                  onClick={() => toggleStatut(statut)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200',
                    isVisible
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-transparent border-current opacity-50 hover:opacity-75'
                  )}
                  style={{
                    backgroundColor: isVisible ? color : 'transparent',
                    color: isVisible ? 'white' : color,
                    borderColor: isVisible ? 'transparent' : color,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer avec reset */}
      <div className="p-4 border-t border-white/5 bg-slate-900/50">
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-400 rounded-xl border border-white/10 hover:bg-white/5 hover:text-slate-300 transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser les filtres
        </button>
        <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
          <span>Dernière sync: maintenant</span>
          <button className="hover:text-indigo-400 transition-colors">
            Actualiser
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
