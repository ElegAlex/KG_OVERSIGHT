/**
 * KG-Oversight - Panneau de filtres avec accordéon
 * Permet de filtrer les nœuds par type, criticité et recherche
 */

import { useAtom, useAtomValue } from 'jotai';
import { useState, useMemo } from 'react';
import {
  visibleNodeTypesAtom,
  visibleCriticitesAtom,
  searchQueryAtom,
  filteredNodesAtom,
  allNodesAtom,
} from '@shared/stores/selectionAtoms';
import { NODE_COLORS, NODE_LABELS, CRITICITE_COLORS } from '@shared/utils/nodeStyles';
import type { NodeType, Criticite } from '@data/types';

// Catégories de types de nœuds pour l'accordéon
const NODE_TYPE_CATEGORIES: Record<string, { label: string; types: NodeType[]; icon: string }> = {
  acteurs: {
    label: 'Acteurs',
    icon: '🏢',
    types: ['SousTraitant', 'EtudeClinique'],
  },
  documents: {
    label: 'Documents',
    icon: '📄',
    types: ['Contrat', 'AccordQualite'],
  },
  qualite: {
    label: 'Qualité',
    icon: '🔍',
    types: ['Audit', 'Inspection', 'Finding', 'EvenementQualite'],
  },
  decisions: {
    label: 'Décisions & Risques',
    icon: '⚖️',
    types: ['Decision', 'EvaluationRisque', 'ReunionQualite'],
  },
  alertes: {
    label: 'Alertes & Événements',
    icon: '🚨',
    types: ['Alerte', 'Evenement'],
  },
  contexte: {
    label: 'Contexte',
    icon: '📊',
    types: ['DomaineService', 'ContexteReglementaire', 'KQI'],
  },
};

const ALL_NODE_TYPES: NodeType[] = Object.values(NODE_TYPE_CATEGORIES).flatMap((cat) => cat.types);

const ALL_CRITICITES: (Criticite | '')[] = ['Critique', 'Majeur', 'Standard', 'Mineur', ''];

// Composant Accordéon simple
function AccordionSection({
  title,
  icon,
  count,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-sm font-medium text-foreground">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-3 border-t bg-card">{children}</div>}
    </div>
  );
}

interface FilterPanelProps {
  className?: string;
}

export function FilterPanel({ className = '' }: FilterPanelProps) {
  const [visibleTypes, setVisibleTypes] = useAtom(visibleNodeTypesAtom);
  const [visibleCriticites, setVisibleCriticites] = useAtom(visibleCriticitesAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const filteredNodes = useAtomValue(filteredNodesAtom);
  const allNodes = useAtomValue(allNodesAtom);

  // État des sections ouvertes (par défaut: acteurs et qualité ouverts)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['acteurs', 'qualite']));

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

  // Toggle un type de nœud
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

  // Toggle tous les types d'une catégorie
  const toggleCategory = (categoryTypes: NodeType[], allSelected: boolean) => {
    const newTypes = new Set(visibleTypes);
    if (allSelected) {
      // Désélectionner tous les types de la catégorie
      categoryTypes.forEach((t) => newTypes.delete(t));
    } else {
      // Sélectionner tous les types de la catégorie
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

  // Compter les nœuds par type (mémorisé)
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
    let visible = 0;
    for (const type of types) {
      total += countByType.get(type) || 0;
      if (visibleTypes.has(type)) {
        visible += countByType.get(type) || 0;
      }
    }
    return { total, visible, allSelected: types.every((t) => visibleTypes.has(t)) };
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Barre de recherche */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un nœud..."
          className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Compteur avec barre de progression */}
      <div className="bg-muted/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-foreground">Nœuds affichés</span>
          <span className="text-xs text-muted-foreground">
            {filteredNodes.size} / {allNodes.size}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${allNodes.size > 0 ? (filteredNodes.size / allNodes.size) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Actions globales */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase">Types de nœuds</span>
        <div className="flex gap-2">
          <button
            onClick={selectAllTypes}
            className="text-xs text-primary hover:underline"
          >
            Tous
          </button>
          <span className="text-xs text-muted-foreground">/</span>
          <button
            onClick={deselectAllTypes}
            className="text-xs text-primary hover:underline"
          >
            Aucun
          </button>
        </div>
      </div>

      {/* Accordéon par catégorie */}
      <div className="space-y-2">
        {Object.entries(NODE_TYPE_CATEGORIES).map(([categoryId, category]) => {
          const stats = getCategoryStats(category.types);

          return (
            <AccordionSection
              key={categoryId}
              title={category.label}
              icon={category.icon}
              count={stats.total}
              isOpen={openSections.has(categoryId)}
              onToggle={() => toggleSection(categoryId)}
            >
              {/* Bouton tout sélectionner/désélectionner pour la catégorie */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => toggleCategory(category.types, stats.allSelected)}
                  className="text-xs text-primary hover:underline"
                >
                  {stats.allSelected ? 'Désélectionner' : 'Sélectionner tout'}
                </button>
              </div>

              <div className="space-y-1">
                {category.types.map((type) => {
                  const count = countByType.get(type) || 0;
                  const isVisible = visibleTypes.has(type);

                  return (
                    <label
                      key={type}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        isVisible ? 'bg-muted/50' : 'opacity-50'
                      } hover:bg-muted`}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleNodeType(type)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <div
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10"
                        style={{ backgroundColor: NODE_COLORS[type]?.bg ?? '#6B7280' }}
                      />
                      <span className="text-sm text-foreground flex-1 truncate">
                        {NODE_LABELS[type]}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionSection>
          );
        })}
      </div>

      {/* Filtres par criticité */}
      <div className="pt-2 border-t">
        <label className="text-xs font-medium text-muted-foreground uppercase block mb-2">
          Criticité
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CRITICITES.map((crit) => {
            const isVisible = visibleCriticites.has(crit);
            const label = crit || 'N/A';
            const color = crit ? CRITICITE_COLORS[crit] : '#6B7280';

            return (
              <button
                key={crit || 'none'}
                onClick={() => toggleCriticite(crit)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                  isVisible
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-transparent border-current opacity-50 hover:opacity-75'
                }`}
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

      {/* Bouton reset */}
      <button
        onClick={() => {
          setSearchQuery('');
          setVisibleTypes(new Set(ALL_NODE_TYPES));
          setVisibleCriticites(new Set(ALL_CRITICITES));
        }}
        className="w-full px-3 py-2 text-sm font-medium text-muted-foreground border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Réinitialiser
      </button>
    </div>
  );
}

export default FilterPanel;
