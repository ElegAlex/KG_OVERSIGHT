/**
 * KG-Oversight - Dashboard KQI global
 * Vue synthétique des indicateurs qualité de tous les sous-traitants
 */

import { useMemo, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import ReactECharts from 'echarts-for-react';
import { X, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { kqiDataAtom, allNodesAtom, selectedNodeIdsAtom } from '@shared/stores/selectionAtoms';
import { openKQIPanelForSTAtom } from '@features/kqi';
import { aggregateAllSTsKQI, exportKQIToCSV, exportKQIAggregationsToCSV, type KQIAggregation, type KQIStatus } from '@features/kqi/utils/kqiAggregation';
import type { KQI, SousTraitant } from '@data/types';

interface KQIDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KQIDashboard({ isOpen, onClose }: KQIDashboardProps) {
  const kqiData = useAtomValue(kqiDataAtom) as KQI[];
  const allNodes = useAtomValue(allNodesAtom);
  const setSelectedNodeIds = useSetAtom(selectedNodeIdsAtom);
  const openKQIPanel = useSetAtom(openKQIPanelForSTAtom);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');

  // Récupérer tous les sous-traitants
  const allSTs = useMemo(() => {
    const sts: SousTraitant[] = [];
    for (const [, node] of allNodes) {
      if (node._type === 'SousTraitant') {
        sts.push(node as SousTraitant);
      }
    }
    return sts.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [allNodes]);

  // Agrégations KQI par ST
  const aggregations = useMemo(() => {
    const stIds = allSTs.map((st) => st.id);
    return aggregateAllSTsKQI(kqiData, stIds);
  }, [kqiData, allSTs]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let good = 0;
    let totalIndicators = 0;
    let totalAlerts = 0;

    for (const [, agg] of aggregations) {
      if (agg.status === 'critical') critical++;
      else if (agg.status === 'warning') warning++;
      else good++;
      totalIndicators += agg.totalCount;
      totalAlerts += agg.alertCount;
    }

    return { critical, warning, good, total: aggregations.size, totalIndicators, totalAlerts };
  }, [aggregations]);

  // Liste des indicateurs uniques
  const indicators = useMemo(() => {
    const set = new Set<string>();
    for (const kqi of kqiData) {
      set.add(kqi.indicateur);
    }
    return Array.from(set).sort();
  }, [kqiData]);

  // Données pour le graphique de répartition par statut
  const pieChartOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 10, textStyle: { color: '#94a3b8' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#1e293b', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: globalStats.good, name: 'OK', itemStyle: { color: '#10b981' } },
        { value: globalStats.warning, name: 'Attention', itemStyle: { color: '#f59e0b' } },
        { value: globalStats.critical, name: 'Critique', itemStyle: { color: '#ef4444' } },
      ],
    }],
  }), [globalStats]);

  // Données pour le graphique de tendance par indicateur
  const trendChartOption = useMemo(() => {
    if (!selectedIndicator) return null;

    // Grouper les données par période
    const byPeriod = new Map<string, { ok: number; warning: number; alert: number }>();
    for (const kqi of kqiData) {
      if (kqi.indicateur !== selectedIndicator) continue;

      const current = byPeriod.get(kqi.periode) || { ok: 0, warning: 0, alert: 0 };
      if (kqi.statut === 'OK') current.ok++;
      else if (kqi.statut === 'Attention') current.warning++;
      else current.alert++;
      byPeriod.set(kqi.periode, current);
    }

    const periods = Array.from(byPeriod.keys()).sort();
    const okData = periods.map((p) => byPeriod.get(p)?.ok ?? 0);
    const warningData = periods.map((p) => byPeriod.get(p)?.warning ?? 0);
    const alertData = periods.map((p) => byPeriod.get(p)?.alert ?? 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['OK', 'Attention', 'Alerte'], textStyle: { color: '#94a3b8' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: periods, axisLabel: { color: '#64748b', rotate: 45 } },
      yAxis: { type: 'value', axisLabel: { color: '#64748b' } },
      series: [
        { name: 'OK', type: 'bar', stack: 'total', data: okData, itemStyle: { color: '#10b981' } },
        { name: 'Attention', type: 'bar', stack: 'total', data: warningData, itemStyle: { color: '#f59e0b' } },
        { name: 'Alerte', type: 'bar', stack: 'total', data: alertData, itemStyle: { color: '#ef4444' } },
      ],
    };
  }, [kqiData, selectedIndicator]);

  // Données pour le classement des ST par score
  const rankingChartOption = useMemo(() => {
    const sorted = Array.from(aggregations.entries())
      .filter(([, agg]) => agg.totalCount > 0)
      .sort((a, b) => {
        // Trier par criticité puis par nombre d'alertes
        const statusOrder: Record<KQIStatus, number> = { critical: 0, warning: 1, good: 2 };
        const statusDiff = statusOrder[a[1].status] - statusOrder[b[1].status];
        if (statusDiff !== 0) return statusDiff;
        return b[1].alertCount - a[1].alertCount;
      })
      .slice(0, 10);

    const stNames = sorted.map(([stId]) => {
      const st = allSTs.find((s) => s.id === stId);
      return st?.nom ?? stId;
    });

    const alertCounts = sorted.map(([, agg]) => agg.alertCount);
    const warningCounts = sorted.map(([, agg]) => agg.warningCount);
    const okCounts = sorted.map(([, agg]) => agg.okCount);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Alertes', 'Attention', 'OK'], textStyle: { color: '#94a3b8' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', axisLabel: { color: '#64748b' } },
      yAxis: { type: 'category', data: stNames, axisLabel: { color: '#94a3b8', width: 100, overflow: 'truncate' } },
      series: [
        { name: 'Alertes', type: 'bar', stack: 'total', data: alertCounts, itemStyle: { color: '#ef4444' } },
        { name: 'Attention', type: 'bar', stack: 'total', data: warningCounts, itemStyle: { color: '#f59e0b' } },
        { name: 'OK', type: 'bar', stack: 'total', data: okCounts, itemStyle: { color: '#10b981' } },
      ],
    };
  }, [aggregations, allSTs]);

  const handleSTClick = (stId: string) => {
    setSelectedNodeIds(new Set([stId]));
    openKQIPanel(stId);
  };

  // Handlers pour l'export CSV
  const handleExportAllKQI = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportKQIToCSV(kqiData, `kqi-donnees-${timestamp}.csv`);
  };

  const handleExportSynthese = () => {
    const stNames = new Map<string, string>();
    for (const st of allSTs) {
      stNames.set(st.id, st.nom);
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    exportKQIAggregationsToCSV(aggregations, stNames, `kqi-synthese-${timestamp}.csv`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[90vw] max-w-6xl h-[85vh] bg-slate-900 rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Dashboard KQI</h2>
            <p className="text-sm text-slate-400 mt-1">
              Vue synthétique des indicateurs qualité
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Boutons d'export */}
            <div className="flex items-center gap-1 mr-4">
              <button
                onClick={handleExportSynthese}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                title="Exporter la synthèse par sous-traitant"
              >
                <Download className="w-4 h-4" />
                <span>Synthèse</span>
              </button>
              <button
                onClick={handleExportAllKQI}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                title="Exporter toutes les données KQI"
              >
                <Download className="w-4 h-4" />
                <span>Données complètes</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cards statistiques */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              title="Sous-traitants"
              value={globalStats.total}
              icon={<CheckCircle className="w-5 h-5" />}
              color="indigo"
            />
            <StatCard
              title="Statut OK"
              value={globalStats.good}
              subtitle={`${((globalStats.good / globalStats.total) * 100).toFixed(0)}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              title="Attention"
              value={globalStats.warning}
              subtitle={`${((globalStats.warning / globalStats.total) * 100).toFixed(0)}%`}
              icon={<Minus className="w-5 h-5" />}
              color="amber"
            />
            <StatCard
              title="Critique"
              value={globalStats.critical}
              subtitle={`${globalStats.totalAlerts} alertes actives`}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
            />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-2 gap-6">
            {/* Répartition par statut */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Répartition par statut</h3>
              <ReactECharts option={pieChartOption} style={{ height: 250 }} />
            </div>

            {/* Classement des ST */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Top 10 sous-traitants à surveiller</h3>
              <ReactECharts option={rankingChartOption} style={{ height: 250 }} />
            </div>
          </div>

          {/* Évolution par indicateur */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Évolution par indicateur</h3>
              <select
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-700 border border-white/10 rounded-lg text-slate-200"
              >
                <option value="">Sélectionner un indicateur...</option>
                {indicators.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            {trendChartOption ? (
              <ReactECharts option={trendChartOption} style={{ height: 200 }} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500">
                Sélectionnez un indicateur pour voir son évolution
              </div>
            )}
          </div>

          {/* Liste des ST avec alertes */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Sous-traitants avec alertes</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {Array.from(aggregations.entries())
                .filter(([, agg]) => agg.alertCount > 0)
                .sort((a, b) => b[1].alertCount - a[1].alertCount)
                .map(([stId, agg]) => {
                  const st = allSTs.find((s) => s.id === stId);
                  return (
                    <button
                      key={stId}
                      onClick={() => handleSTClick(stId)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: agg.status === 'critical' ? '#ef4444' : agg.status === 'warning' ? '#f59e0b' : '#10b981' }}
                        />
                        <span className="text-sm font-medium text-slate-200">{st?.nom ?? stId}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {agg.totalCount} indicateurs
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-500/20 text-red-400">
                          {agg.alertCount} alertes
                        </span>
                        {agg.degradingCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <TrendingDown className="w-3 h-3" />
                            {agg.degradingCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              {Array.from(aggregations.entries()).filter(([, agg]) => agg.alertCount > 0).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p>Aucune alerte active</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card statistique
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'red';
}) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-80">{title}</span>
        {icon}
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold">{value}</span>
        {subtitle && <span className="ml-2 text-sm opacity-60">{subtitle}</span>}
      </div>
    </div>
  );
}

export default KQIDashboard;
