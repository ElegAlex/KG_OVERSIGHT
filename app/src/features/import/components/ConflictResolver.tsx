/**
 * KG-Oversight - ConflictResolver
 * Interface pour visualiser et résoudre les conflits lors du merge
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Check,
  ArrowRight,
  RefreshCw,
  Shield,
  GitMerge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNodeColor, getNodeLabel } from '@shared/utils/nodeStyles';
import type {
  NodeConflict,
  ConflictResolution,
  ConflictDetectionResult,
} from '../services/mergeService';

// =============================================================================
// Types
// =============================================================================

interface ConflictResolverProps {
  conflicts: ConflictDetectionResult;
  resolutions: Map<string, ConflictResolution>;
  onResolve: (nodeId: string, resolution: ConflictResolution) => void;
  onResolveAll: (action: 'keepAll' | 'replaceAll') => void;
  className?: string;
}

type ResolutionAction = 'keep' | 'replace';

// =============================================================================
// Composant principal
// =============================================================================

export function ConflictResolver({
  conflicts,
  resolutions,
  onResolve,
  onResolveAll,
  className,
}: ConflictResolverProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { nodeConflicts, stats } = conflicts;

  // Calculer les stats de résolution
  const resolutionStats = useMemo(() => {
    let resolved = 0;
    let keepCount = 0;
    let replaceCount = 0;

    for (const [, resolution] of resolutions) {
      resolved++;
      if (resolution.action === 'keep') keepCount++;
      if (resolution.action === 'replace') replaceCount++;
    }

    return {
      resolved,
      pending: nodeConflicts.length - resolved,
      keepCount,
      replaceCount,
    };
  }, [resolutions, nodeConflicts.length]);

  const toggleExpand = (nodeId: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    setExpandedNodes(newSet);
  };

  if (nodeConflicts.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
        <p className="text-slate-300 font-medium">Aucun conflit détecté</p>
        <p className="text-sm text-slate-500 mt-1">
          {stats.newCount} nouvelle(s) entité(s) à ajouter
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium text-slate-200">
              {nodeConflicts.length} conflit(s) détecté(s)
            </h3>
            <p className="text-xs text-slate-500">
              {resolutionStats.resolved} résolu(s) • {resolutionStats.pending} en attente
            </p>
          </div>
        </div>

        {/* Actions groupées */}
        <div className="flex gap-2">
          <button
            onClick={() => onResolveAll('keepAll')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Tout garder
          </button>
          <button
            onClick={() => onResolveAll('replaceAll')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tout remplacer
          </button>
        </div>
      </div>

      {/* Liste des conflits */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {nodeConflicts.map((conflict) => (
          <ConflictCard
            key={conflict.nodeId}
            conflict={conflict}
            resolution={resolutions.get(conflict.nodeId)}
            isExpanded={expandedNodes.has(conflict.nodeId)}
            onToggleExpand={() => toggleExpand(conflict.nodeId)}
            onResolve={(action) => onResolve(conflict.nodeId, { action })}
          />
        ))}
      </div>

      {/* Barre de progression */}
      <div className="pt-2 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Progression</span>
          <span>
            {resolutionStats.resolved} / {nodeConflicts.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{
              width: `${(resolutionStats.resolved / nodeConflicts.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sous-composant ConflictCard
// =============================================================================

function ConflictCard({
  conflict,
  resolution,
  isExpanded,
  onToggleExpand,
  onResolve,
}: {
  conflict: NodeConflict;
  resolution?: ConflictResolution;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onResolve: (action: ResolutionAction) => void;
}) {
  const nodeColor = getNodeColor(conflict.nodeType);
  const nodeLabel = getNodeLabel(conflict.nodeType);
  const nodeName = getNodeDisplayName(conflict.existingNode);

  const isResolved = resolution !== undefined;
  const currentAction = resolution?.action;

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-colors',
        isResolved
          ? 'border-slate-700 bg-slate-800/30'
          : 'border-amber-500/30 bg-amber-500/5'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800/50"
        onClick={onToggleExpand}
      >
        <button className="p-0.5">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: nodeColor }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">
            {nodeName}
          </p>
          <p className="text-xs text-slate-500">
            {nodeLabel} • {conflict.fieldConflicts.length} champ(s) différent(s)
          </p>
        </div>

        {/* Boutons de résolution */}
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onResolve('keep')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-lg transition-colors',
              currentAction === 'keep'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            )}
          >
            Garder
          </button>
          <button
            onClick={() => onResolve('replace')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-lg transition-colors',
              currentAction === 'replace'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            )}
          >
            Remplacer
          </button>
        </div>

        {isResolved && (
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
      </div>

      {/* Détails des conflits */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2">
                Différences détectées :
              </p>
              <div className="space-y-1.5">
                {conflict.fieldConflicts.map((fc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-800/50"
                  >
                    <span className="font-medium text-slate-400 w-24 truncate">
                      {fc.field}
                    </span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 truncate max-w-[150px]">
                        {formatValue(fc.existingValue)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 truncate max-w-[150px]">
                        {formatValue(fc.newValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Utilitaires
// =============================================================================

function getNodeDisplayName(node: Record<string, unknown>): string {
  if (node.nom && typeof node.nom === 'string') return node.nom;
  if (node.description && typeof node.description === 'string') {
    const desc = node.description;
    return desc.length > 40 ? `${desc.substring(0, 40)}...` : desc;
  }
  if (node.indicateur && typeof node.indicateur === 'string') return node.indicateur;
  return String(node.id);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(vide)';
  if (value === '') return '(vide)';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default ConflictResolver;
