/**
 * KG-Oversight - MergeStrategySelector
 * Composant de sélection de la stratégie d'import
 * Replace / Merge / Add Only
 */

import { motion } from 'framer-motion';
import {
  RefreshCw,
  GitMerge,
  PlusCircle,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MergeStrategy } from '../services/mergeService';

// =============================================================================
// Types
// =============================================================================

interface MergeStrategySelectorProps {
  value: MergeStrategy;
  onChange: (strategy: MergeStrategy) => void;
  existingNodesCount: number;
  existingEdgesCount: number;
  className?: string;
}

interface StrategyOption {
  id: MergeStrategy;
  label: string;
  description: string;
  icon: React.ReactNode;
  warning?: string;
  benefits: string[];
  color: string;
}

// =============================================================================
// Constantes
// =============================================================================

const STRATEGY_OPTIONS: StrategyOption[] = [
  {
    id: 'replace',
    label: 'Remplacer tout',
    description: 'Supprime toutes les données existantes et les remplace par les nouvelles.',
    icon: <RefreshCw className="w-5 h-5" />,
    warning: 'Toutes les modifications manuelles seront perdues',
    benefits: [
      'Données propres et cohérentes',
      'Pas de doublons possibles',
      'Import rapide',
    ],
    color: 'rose',
  },
  {
    id: 'merge',
    label: 'Fusionner',
    description: 'Met à jour les entités existantes et ajoute les nouvelles.',
    icon: <GitMerge className="w-5 h-5" />,
    benefits: [
      'Préserve les modifications manuelles',
      'Détection des conflits',
      'Mise à jour sélective',
    ],
    color: 'indigo',
  },
  {
    id: 'addOnly',
    label: 'Ajouter uniquement',
    description: 'Ajoute uniquement les nouvelles entités, ignore les doublons.',
    icon: <PlusCircle className="w-5 h-5" />,
    benefits: [
      'Préserve 100% des données existantes',
      'Aucun risque de perte',
      'Import incrémental',
    ],
    color: 'emerald',
  },
];

// =============================================================================
// Composant principal
// =============================================================================

export function MergeStrategySelector({
  value,
  onChange,
  existingNodesCount,
  existingEdgesCount,
  className,
}: MergeStrategySelectorProps) {
  const hasExistingData = existingNodesCount > 0 || existingEdgesCount > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header avec compteur */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-200">
            Stratégie d'import
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choisissez comment gérer les données existantes
          </p>
        </div>

        {hasExistingData && (
          <div className="text-right">
            <p className="text-xs text-slate-400">
              Données existantes :
            </p>
            <p className="text-sm text-slate-300">
              {existingNodesCount} nœuds • {existingEdgesCount} relations
            </p>
          </div>
        )}
      </div>

      {/* Options de stratégie */}
      <div className="grid gap-3">
        {STRATEGY_OPTIONS.map((option) => (
          <StrategyCard
            key={option.id}
            option={option}
            isSelected={value === option.id}
            onSelect={() => onChange(option.id)}
            hasExistingData={hasExistingData}
          />
        ))}
      </div>

      {/* Avertissement si pas de données existantes */}
      {!hasExistingData && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300">
            Aucune donnée existante détectée. Toutes les stratégies produiront le même résultat.
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sous-composant StrategyCard
// =============================================================================

function StrategyCard({
  option,
  isSelected,
  onSelect,
  hasExistingData,
}: {
  option: StrategyOption;
  isSelected: boolean;
  onSelect: () => void;
  hasExistingData: boolean;
}) {
  const colorClasses = {
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      icon: 'text-rose-400',
      ring: 'ring-rose-500',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      icon: 'text-indigo-400',
      ring: 'ring-indigo-500',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: 'text-emerald-400',
      ring: 'ring-emerald-500',
    },
  };

  const colors = colorClasses[option.color as keyof typeof colorClasses];

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'relative w-full p-4 rounded-xl border-2 text-left transition-all',
        'hover:bg-slate-800/50',
        isSelected
          ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}`
          : 'border-slate-700 bg-slate-800/30'
      )}
    >
      {/* Indicateur de sélection */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center',
            colors.bg
          )}
        >
          <Check className={cn('w-3 h-3', colors.icon)} />
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg shrink-0',
            isSelected ? colors.bg : 'bg-slate-700'
          )}
        >
          <span className={isSelected ? colors.icon : 'text-slate-400'}>
            {option.icon}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-200">{option.label}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>

          {/* Warning pour Replace */}
          {option.warning && hasExistingData && (
            <div className="flex items-center gap-1.5 mt-2 text-amber-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="text-xs">{option.warning}</span>
            </div>
          )}

          {/* Benefits */}
          <div className="flex flex-wrap gap-2 mt-3">
            {option.benefits.map((benefit, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[10px] rounded-full bg-slate-700/50 text-slate-400"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default MergeStrategySelector;
