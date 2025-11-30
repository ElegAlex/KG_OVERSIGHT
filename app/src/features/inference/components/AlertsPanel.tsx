/**
 * KG-Oversight - Panneau des alertes avec navigation contextuelle
 * Affiche les alertes générées par le moteur d'inférence
 * Permet la navigation vers les nœuds concernés
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Filter,
  Building2,
  FileWarning,
  Activity,
  TrendingDown,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  alertsPanelOpenAtom,
  filteredAlertsAtom,
  alertsLevelFilterAtom,
  alertsSTFilterAtom,
  alertsCountByLevelAtom,
  selectedAlertAtom,
  inferredAlertsAtom,
} from '../stores/alertsStore';
import { selectedNodeIdsAtom, highlightedNodeIdsAtom, allNodesAtom } from '@shared/stores/selectionAtoms';
import { getRuleEngine } from '../services/ruleEngine';
import type { InferredAlert, AlertLevel } from '../rules/ruleDefinitions';
import type { SousTraitant } from '@data/types';

interface AlertsPanelProps {
  className?: string;
}

// Icône selon le niveau d'alerte
function AlertLevelIcon({ level, className = '' }: { level: AlertLevel; className?: string }) {
  switch (level) {
    case 'HAUTE':
      return <AlertTriangle className={`text-red-400 ${className}`} />;
    case 'MOYENNE':
      return <AlertCircle className={`text-amber-400 ${className}`} />;
    case 'BASSE':
      return <Info className={`text-blue-400 ${className}`} />;
  }
}

// Icône selon la catégorie de règle
function RuleCategoryIcon({ ruleId }: { ruleId: string }) {
  if (ruleId.includes('AUDIT')) return <FileWarning className="w-4 h-4" />;
  if (ruleId.includes('FINDING')) return <AlertCircle className="w-4 h-4" />;
  if (ruleId.includes('KQI')) return <TrendingDown className="w-4 h-4" />;
  if (ruleId.includes('QE')) return <Activity className="w-4 h-4" />;
  return <AlertTriangle className="w-4 h-4" />;
}

// Badge de niveau
function LevelBadge({ level }: { level: AlertLevel }) {
  const colors = {
    HAUTE: 'bg-red-500/20 text-red-400 border-red-500/30',
    MOYENNE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    BASSE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[level]}`}>
      {level}
    </span>
  );
}

// Carte d'alerte individuelle
function AlertCard({
  alert,
  isSelected,
  onSelect,
  onNavigate,
}: {
  alert: InferredAlert;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}) {
  const levelColors = {
    HAUTE: 'border-l-red-500',
    MOYENNE: 'border-l-amber-500',
    BASSE: 'border-l-blue-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        p-3 rounded-lg border-l-4 cursor-pointer transition-all
        ${levelColors[alert.level]}
        ${isSelected
          ? 'bg-slate-700/80 border border-indigo-500/50 shadow-lg'
          : 'bg-slate-800/50 border border-white/5 hover:bg-slate-700/50'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertLevelIcon level={alert.level} className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-200 truncate">
                {alert.ruleName}
              </span>
              <LevelBadge level={alert.level} />
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {alert.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="w-3 h-3" />
                {alert.stName}
              </span>
              <span className="text-xs text-slate-600">•</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <RuleCategoryIcon ruleId={alert.ruleId} />
                {alert.triggerNodeType}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
          title="Naviguer vers le nœud"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </motion.div>
  );
}

export function AlertsPanel({ className = '' }: AlertsPanelProps) {
  const [isOpen, setIsOpen] = useAtom(alertsPanelOpenAtom);
  const filteredAlerts = useAtomValue(filteredAlertsAtom);
  const counts = useAtomValue(alertsCountByLevelAtom);
  const [levelFilter, setLevelFilter] = useAtom(alertsLevelFilterAtom);
  const [stFilter, setSTFilter] = useAtom(alertsSTFilterAtom);
  const [selectedAlert, setSelectedAlert] = useAtom(selectedAlertAtom);
  const allNodes = useAtomValue(allNodesAtom);
  const setSelectedNodeIds = useSetAtom(selectedNodeIdsAtom);
  const setHighlightedNodeIds = useSetAtom(highlightedNodeIdsAtom);

  // Liste des sous-traitants pour le filtre
  const allSTs = useMemo(() => {
    const sts: SousTraitant[] = [];
    for (const [, node] of allNodes) {
      if (node._type === 'SousTraitant') {
        sts.push(node as SousTraitant);
      }
    }
    return sts.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [allNodes]);

  // Naviguer vers le nœud déclencheur de l'alerte
  const navigateToAlert = useCallback(
    (alert: InferredAlert) => {
      // Sélectionner le nœud déclencheur
      setSelectedNodeIds(new Set([alert.triggerNodeId]));

      // Mettre en évidence le ST concerné et le nœud déclencheur
      setHighlightedNodeIds(new Set([alert.stId, alert.triggerNodeId]));

      // Fermer le panneau pour voir le graphe
      setIsOpen(false);
    },
    [setSelectedNodeIds, setHighlightedNodeIds, setIsOpen]
  );

  // Sélectionner une alerte (pour voir les détails)
  const selectAlert = useCallback(
    (alert: InferredAlert) => {
      setSelectedAlert(alert === selectedAlert ? null : alert);

      // Mettre en évidence les nœuds concernés
      if (alert !== selectedAlert) {
        setHighlightedNodeIds(new Set([alert.stId, alert.triggerNodeId]));
      } else {
        setHighlightedNodeIds(new Set());
      }
    },
    [selectedAlert, setSelectedAlert, setHighlightedNodeIds]
  );

  // Nettoyer les highlights quand on ferme le panneau
  useEffect(() => {
    if (!isOpen) {
      setHighlightedNodeIds(new Set());
    }
  }, [isOpen, setHighlightedNodeIds]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-white/10 shadow-2xl z-40 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Alertes</h2>
              <p className="text-xs text-slate-400">{counts.total} alertes détectées</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compteurs par niveau */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setLevelFilter('all')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              levelFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            Toutes ({counts.total})
          </button>
          <button
            onClick={() => setLevelFilter('HAUTE')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              levelFilter === 'HAUTE'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-slate-800 text-slate-400 hover:bg-red-500/10'
            }`}
          >
            {counts.haute}
          </button>
          <button
            onClick={() => setLevelFilter('MOYENNE')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              levelFilter === 'MOYENNE'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-slate-800 text-slate-400 hover:bg-amber-500/10'
            }`}
          >
            {counts.moyenne}
          </button>
          <button
            onClick={() => setLevelFilter('BASSE')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              levelFilter === 'BASSE'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-800 text-slate-400 hover:bg-blue-500/10'
            }`}
          >
            {counts.basse}
          </button>
        </div>

        {/* Filtre par ST */}
        <div className="mt-3">
          <select
            value={stFilter ?? ''}
            onChange={(e) => setSTFilter(e.target.value || null)}
            className="w-full px-3 py-2 text-sm bg-slate-800 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">Tous les sous-traitants</option>
            {allSTs.map((st) => (
              <option key={st.id} value={st.id}>
                {st.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isSelected={selectedAlert?.id === alert.id}
                onSelect={() => selectAlert(alert)}
                onNavigate={() => navigateToAlert(alert)}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                <Search className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-slate-400">Aucune alerte</p>
              <p className="text-xs text-slate-500 mt-1">
                {levelFilter !== 'all' || stFilter
                  ? 'Modifiez les filtres pour voir plus de résultats'
                  : 'Tous les indicateurs sont conformes'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Détails de l'alerte sélectionnée */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="border-t border-white/10 bg-slate-800/50 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Détails</span>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Fermer
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Règle</span>
                <span className="text-slate-200">{selectedAlert.ruleId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sous-traitant</span>
                <span className="text-slate-200">{selectedAlert.stName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Type déclencheur</span>
                <span className="text-slate-200">{selectedAlert.triggerNodeType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Date</span>
                <span className="text-slate-200">
                  {selectedAlert.createdAt.toLocaleDateString('fr-FR')}
                </span>
              </div>
              <button
                onClick={() => navigateToAlert(selectedAlert)}
                className="w-full mt-3 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                Voir dans le graphe
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AlertsPanel;
