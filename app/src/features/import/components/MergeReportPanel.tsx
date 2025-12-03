/**
 * KG-Oversight - MergeReportPanel
 * Affiche le rapport détaillé après un import avec merge
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  MinusCircle,
  AlertTriangle,
  ChevronDown,
  Download,
  GitMerge,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MergeReport, MergeReportEntry } from '../services/mergeService';
import { generateMergeReportText } from '../services/mergeService';

// =============================================================================
// Types
// =============================================================================

interface MergeReportPanelProps {
  report: MergeReport;
  className?: string;
}

// =============================================================================
// Composant principal
// =============================================================================

export function MergeReportPanel({ report, className }: MergeReportPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [filterAction, setFilterAction] = useState<string | null>(null);

  // Stats totaux
  const totalNodes = report.stats.nodesAdded + report.stats.nodesUpdated + report.stats.nodesSkipped;
  const totalEdges = report.stats.edgesAdded + report.stats.edgesUpdated + report.stats.edgesSkipped;

  // Filtrer les détails
  const filteredDetails = useMemo(() => {
    if (!filterAction) return report.details;
    return report.details.filter(d => d.action === filterAction);
  }, [report.details, filterAction]);

  // Télécharger le rapport
  const handleDownload = () => {
    const text = generateMergeReportText(report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const strategyLabel = {
    replace: 'Remplacement complet',
    merge: 'Fusion intelligente',
    addOnly: 'Ajout uniquement',
  }[report.strategy];

  const strategyIcon = {
    replace: <RefreshCw className="w-4 h-4" />,
    merge: <GitMerge className="w-4 h-4" />,
    addOnly: <PlusCircle className="w-4 h-4" />,
  }[report.strategy];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header avec succès */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <h3 className="text-xl font-semibold text-slate-200">Import terminé</h3>
        <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-2">
          {strategyIcon}
          <span>{strategyLabel}</span>
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-4">
        {/* Nœuds */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Nœuds</p>
          <div className="space-y-2">
            <StatRow
              icon={<PlusCircle className="w-4 h-4 text-emerald-400" />}
              label="Ajoutés"
              value={report.stats.nodesAdded}
              color="emerald"
            />
            <StatRow
              icon={<RefreshCw className="w-4 h-4 text-indigo-400" />}
              label="Mis à jour"
              value={report.stats.nodesUpdated}
              color="indigo"
            />
            <StatRow
              icon={<MinusCircle className="w-4 h-4 text-slate-400" />}
              label="Ignorés"
              value={report.stats.nodesSkipped}
              color="slate"
            />
            {report.stats.nodesRemoved > 0 && (
              <StatRow
                icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
                label="Supprimés"
                value={report.stats.nodesRemoved}
                color="rose"
              />
            )}
          </div>
        </div>

        {/* Relations */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Relations</p>
          <div className="space-y-2">
            <StatRow
              icon={<PlusCircle className="w-4 h-4 text-emerald-400" />}
              label="Ajoutées"
              value={report.stats.edgesAdded}
              color="emerald"
            />
            <StatRow
              icon={<RefreshCw className="w-4 h-4 text-indigo-400" />}
              label="Mises à jour"
              value={report.stats.edgesUpdated}
              color="indigo"
            />
            <StatRow
              icon={<MinusCircle className="w-4 h-4 text-slate-400" />}
              label="Ignorées"
              value={report.stats.edgesSkipped}
              color="slate"
            />
            {report.stats.edgesRemoved > 0 && (
              <StatRow
                icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
                label="Supprimées"
                value={report.stats.edgesRemoved}
                color="rose"
              />
            )}
          </div>
        </div>
      </div>

      {/* Conflits résolus */}
      {report.stats.conflictsResolved > 0 && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-300">
            {report.stats.conflictsResolved} conflit(s) résolu(s)
          </span>
        </div>
      )}

      {/* Toggle détails */}
      {report.details.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            <span className="text-sm text-slate-300">
              Voir les détails ({report.details.length} opérations)
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-400 transition-transform',
                showDetails && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Filtres */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <FilterChip
                    label="Tous"
                    count={report.details.length}
                    isActive={filterAction === null}
                    onClick={() => setFilterAction(null)}
                  />
                  <FilterChip
                    label="Ajoutés"
                    count={report.details.filter(d => d.action === 'added').length}
                    isActive={filterAction === 'added'}
                    onClick={() => setFilterAction('added')}
                    color="emerald"
                  />
                  <FilterChip
                    label="Mis à jour"
                    count={report.details.filter(d => d.action === 'updated').length}
                    isActive={filterAction === 'updated'}
                    onClick={() => setFilterAction('updated')}
                    color="indigo"
                  />
                  <FilterChip
                    label="Ignorés"
                    count={report.details.filter(d => d.action === 'skipped').length}
                    isActive={filterAction === 'skipped'}
                    onClick={() => setFilterAction('skipped')}
                    color="slate"
                  />
                </div>

                {/* Liste des détails */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                  {filteredDetails.slice(0, 100).map((entry, idx) => (
                    <DetailRow key={idx} entry={entry} />
                  ))}
                  {filteredDetails.length > 100 && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      ... et {filteredDetails.length - 100} autres
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bouton télécharger */}
      <button
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm">Télécharger le rapport complet</span>
      </button>
    </div>
  );
}

// =============================================================================
// Sous-composants
// =============================================================================

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className={cn('text-sm font-medium', `text-${color}-400`)}>
        {value}
      </span>
    </div>
  );
}

function FilterChip({
  label,
  count,
  isActive,
  onClick,
  color = 'slate',
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 text-xs rounded-full transition-colors',
        isActive
          ? `bg-${color}-500/20 text-${color}-300 border border-${color}-500/30`
          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
      )}
    >
      {label} ({count})
    </button>
  );
}

function DetailRow({ entry }: { entry: MergeReportEntry }) {
  const actionIcons = {
    added: <PlusCircle className="w-3 h-3 text-emerald-400" />,
    updated: <RefreshCw className="w-3 h-3 text-indigo-400" />,
    skipped: <MinusCircle className="w-3 h-3 text-slate-400" />,
    removed: <AlertTriangle className="w-3 h-3 text-rose-400" />,
    conflict_resolved: <CheckCircle2 className="w-3 h-3 text-amber-400" />,
  };

  const actionLabels = {
    added: 'Ajouté',
    updated: 'Mis à jour',
    skipped: 'Ignoré',
    removed: 'Supprimé',
    conflict_resolved: 'Résolu',
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 text-xs">
      {actionIcons[entry.action]}
      <span className="text-slate-500 uppercase w-10">
        {entry.type === 'node' ? 'N' : 'R'}
      </span>
      <span className="text-slate-300 truncate flex-1">{entry.id}</span>
      <span className="text-slate-500">{entry.entityType}</span>
      <span
        className={cn(
          'px-1.5 py-0.5 rounded',
          entry.action === 'added' && 'bg-emerald-500/20 text-emerald-400',
          entry.action === 'updated' && 'bg-indigo-500/20 text-indigo-400',
          entry.action === 'skipped' && 'bg-slate-700 text-slate-400',
          entry.action === 'removed' && 'bg-rose-500/20 text-rose-400',
          entry.action === 'conflict_resolved' && 'bg-amber-500/20 text-amber-400'
        )}
      >
        {actionLabels[entry.action]}
      </span>
    </div>
  );
}

export default MergeReportPanel;
