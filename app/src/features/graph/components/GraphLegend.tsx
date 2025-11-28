/**
 * KG-Oversight - Légende du graphe moderne
 * Collapsible avec animation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NODE_COLORS } from '@shared/utils/nodeStyles';
import type { NodeType } from '@data/types';

interface LegendItem {
  id: NodeType;
  label: string;
  color: string;
  count?: number;
}

interface GraphLegendProps {
  className?: string;
  items?: LegendItem[];
  visibleTypes?: Set<NodeType>;
  showStudyContext?: boolean;
}

// Légende par défaut basée sur les types de noeuds importants
const defaultLegendItems: LegendItem[] = [
  { id: 'EtudeClinique', label: 'Études', color: NODE_COLORS.EtudeClinique.bg },
  { id: 'SousTraitant', label: 'Sous-traitants', color: NODE_COLORS.SousTraitant.bg },
  { id: 'Audit', label: 'Audits', color: NODE_COLORS.Audit.bg },
  { id: 'Finding', label: 'Findings', color: NODE_COLORS.Finding.bg },
  { id: 'Alerte', label: 'Alertes', color: NODE_COLORS.Alerte.bg },
];

// Légende KQI
const kqiLegendItems = [
  { label: 'ST OK', color: '#10b981' },
  { label: 'ST Attention', color: '#f59e0b' },
  { label: 'ST Critique', color: '#ef4444' },
];

// Légende contexte étude
const studyContextItems = [
  { label: 'ST N1', color: '#10b981' },
  { label: 'ST N2', color: '#6ee7b7' },
  { label: 'Hors étude', color: '#94a3b8' },
];

export function GraphLegend({
  className,
  items = defaultLegendItems,
  visibleTypes,
  showStudyContext = false,
}: GraphLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filtrer les items selon les types visibles
  const filteredItems = visibleTypes
    ? items.filter((item) => visibleTypes.has(item.id))
    : items;

  // Choisir la légende contextuelle
  const contextItems = showStudyContext ? studyContextItems : kqiLegendItems;

  return (
    <div
      className={cn(
        'bg-slate-800/80 backdrop-blur-xl',
        'border border-white/10 rounded-xl',
        'shadow-xl shadow-black/20',
        'overflow-hidden transition-all duration-300',
        isCollapsed ? 'w-10' : 'w-48',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-2.5 flex items-center gap-2 hover:bg-white/5 transition-colors"
      >
        <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-xs font-medium text-slate-300 text-left">
              Légende
            </span>
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </motion.div>
          </>
        )}
      </button>

      {/* Items */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-2.5 pb-2.5"
          >
            {/* Types de noeuds */}
            <div className="space-y-1 mb-3">
              {filteredItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 py-0.5">
                  <div
                    className="w-3 h-3 rounded-full ring-1 ring-white/10 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-400 flex-1">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="text-[10px] text-slate-600 tabular-nums">
                      {item.count}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Séparateur */}
            <div className="h-px bg-white/5 mb-2" />

            {/* Légende contextuelle */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {showStudyContext ? 'Contexte étude' : 'Statut KQI'}
              </span>
              {contextItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 py-0.5">
                  <div
                    className="w-3 h-3 rounded-full ring-1 ring-white/10 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GraphLegend;
