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
import { alertsCountByLevelAtom, inferredAlertsAtom } from '@features/inference/stores/alertsStore';
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
  const [expandedSTId, setExpandedSTId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast auto-dismiss
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Alertes inférées (même source que le Header)
  const alertsCounts = useAtomValue(alertsCountByLevelAtom);
  const inferredAlerts = useAtomValue(inferredAlertsAtom);

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
    let degrading = 0;
    let totalIndicators = 0;
    let totalAlerts = 0;

    // Pour le camembert : catégories mutuellement exclusives
    let pieConformes = 0;
    let pieDegradation = 0;
    let pieAttention = 0;
    let pieCritique = 0;

    for (const [, agg] of aggregations) {
      if (agg.status === 'critical') critical++;
      else if (agg.status === 'warning') warning++;
      else good++;
      if (agg.degradingCount > 0) degrading++;
      totalIndicators += agg.totalCount;
      totalAlerts += agg.alertCount;

      // Catégorisation pour le camembert (mutuellement exclusif)
      if (agg.status === 'good') {
        pieConformes++;
      } else if (agg.degradingCount > 0) {
        pieDegradation++;
      } else if (agg.status === 'warning') {
        pieAttention++;
      } else {
        pieCritique++;
      }
    }

    return {
      critical, warning, good, degrading,
      pieConformes, pieDegradation, pieAttention, pieCritique,
      total: aggregations.size, totalIndicators, totalAlerts
    };
  }, [aggregations]);

  // Données pour le graphique de répartition (Conformes vs En dégradation)
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
        { value: globalStats.good, name: 'Conformes', itemStyle: { color: '#10b981' } },
        { value: globalStats.degrading, name: 'En dégradation', itemStyle: { color: '#8b5cf6' } },
      ],
    }],
  }), [globalStats]);

  // Données pour le graphique d'évolution globale des KQI
  const globalTrendChartOption = useMemo(() => {
    // Grouper toutes les mesures KQI par période
    const byPeriod = new Map<string, { ok: number; attention: number; alerte: number }>();

    for (const kqi of kqiData) {
      const current = byPeriod.get(kqi.periode) || { ok: 0, attention: 0, alerte: 0 };
      if (kqi.statut === 'OK') current.ok++;
      else if (kqi.statut === 'Attention') current.attention++;
      else current.alerte++; // Alerte ou Critique
      byPeriod.set(kqi.periode, current);
    }

    // Trier les périodes chronologiquement
    const periods = Array.from(byPeriod.keys()).sort();
    const okData = periods.map((p) => byPeriod.get(p)?.ok ?? 0);
    const attentionData = periods.map((p) => byPeriod.get(p)?.attention ?? 0);
    const alerteData = periods.map((p) => byPeriod.get(p)?.alerte ?? 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const period = params[0]?.axisValue ?? '';
          let total = 0;
          let content = `<strong>${period}</strong><br/>`;
          params.forEach((p: any) => {
            content += `${p.marker} ${p.seriesName}: ${p.value}<br/>`;
            total += p.value;
          });
          content += `<br/><strong>Total: ${total} mesures</strong>`;
          return content;
        }
      },
      legend: { data: ['OK', 'Attention', 'Alerte'], textStyle: { color: '#94a3b8' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: periods,
        axisLabel: { color: '#64748b', rotate: 45, fontSize: 10 },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#64748b' },
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        { name: 'OK', type: 'bar', stack: 'total', data: okData, itemStyle: { color: '#10b981' }, barMaxWidth: 40 },
        { name: 'Attention', type: 'bar', stack: 'total', data: attentionData, itemStyle: { color: '#f59e0b' } },
        { name: 'Alerte', type: 'bar', stack: 'total', data: alerteData, itemStyle: { color: '#ef4444' } },
      ],
    };
  }, [kqiData]);

  // Données pour le classement des ST par alertes inférées (cohérent avec le Header)
  const alertsBySTData = useMemo(() => {
    // Grouper les alertes inférées par ST
    const bySTId = new Map<string, { haute: number; moyenne: number; basse: number; stName: string }>();

    for (const alert of inferredAlerts) {
      const existing = bySTId.get(alert.stId) || { haute: 0, moyenne: 0, basse: 0, stName: alert.stName };
      if (alert.level === 'HAUTE') existing.haute++;
      else if (alert.level === 'MOYENNE') existing.moyenne++;
      else existing.basse++;
      bySTId.set(alert.stId, existing);
    }

    // Trier par nombre total d'alertes (haute priorité)
    return Array.from(bySTId.entries())
      .sort((a, b) => {
        const aTotal = a[1].haute * 3 + a[1].moyenne * 2 + a[1].basse;
        const bTotal = b[1].haute * 3 + b[1].moyenne * 2 + b[1].basse;
        return bTotal - aTotal;
      })
      .slice(0, 10);
  }, [inferredAlerts]);

  const rankingChartOption = useMemo(() => {
    if (alertsBySTData.length === 0) return null;

    const stNames = alertsBySTData.map(([, data]) => data.stName);
    const hauteCounts = alertsBySTData.map(([, data]) => data.haute);
    const moyenneCounts = alertsBySTData.map(([, data]) => data.moyenne);
    const basseCounts = alertsBySTData.map(([, data]) => data.basse);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Haute', 'Moyenne', 'Basse'], textStyle: { color: '#94a3b8' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', axisLabel: { color: '#64748b' } },
      yAxis: { type: 'category', data: stNames, axisLabel: { color: '#94a3b8', width: 120, overflow: 'truncate' } },
      series: [
        { name: 'Haute', type: 'bar', stack: 'total', data: hauteCounts, itemStyle: { color: '#ef4444' } },
        { name: 'Moyenne', type: 'bar', stack: 'total', data: moyenneCounts, itemStyle: { color: '#f59e0b' } },
        { name: 'Basse', type: 'bar', stack: 'total', data: basseCounts, itemStyle: { color: '#3b82f6' } },
      ],
    };
  }, [alertsBySTData]);

  const handleSTClick = (stId: string) => {
    setSelectedNodeIds(new Set([stId]));
    openKQIPanel(stId);
  };

  // Handlers pour l'export CSV
  const handleExportAllKQI = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `kqi-donnees-${timestamp}.csv`;
    exportKQIToCSV(kqiData, filename);
    showToast(`Exporté : ${filename}`);
  };

  const handleExportSynthese = () => {
    const stNames = new Map<string, string>();
    for (const st of allSTs) {
      stNames.set(st.id, st.nom);
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `kqi-synthese-${timestamp}.csv`;
    exportKQIAggregationsToCSV(aggregations, stNames, filename);
    showToast(`Exporté : ${filename}`);
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
          {/* Cards statistiques - Alignées avec le Header */}
          <div className="grid grid-cols-5 gap-4">
            <StatCard
              title="Sous-traitants"
              value={globalStats.total}
              icon={<CheckCircle className="w-5 h-5" />}
              color="indigo"
            />
            <StatCard
              title="ST conformes"
              value={globalStats.good}
              subtitle={`sur ${globalStats.total} ST`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              title="ST en dégradation"
              value={globalStats.degrading}
              subtitle="Tendance KQI négative"
              icon={<TrendingDown className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              title="Alertes"
              value={alertsCounts.total}
              subtitle={`${alertsCounts.moyenne} moy., ${alertsCounts.basse} basses`}
              icon={<AlertCircle className="w-5 h-5" />}
              color="amber"
            />
            <StatCard
              title="Critiques"
              value={alertsCounts.haute}
              subtitle="Niveau HAUTE"
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

            {/* Classement des ST par alertes inférées */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-medium text-slate-300 mb-4">
                Alertes par sous-traitant ({alertsBySTData.length} ST)
              </h3>
              {rankingChartOption ? (
                <ReactECharts option={rankingChartOption} style={{ height: 250 }} />
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-slate-500">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                  <p className="text-emerald-400 font-medium">Aucune alerte active</p>
                  <p className="text-sm">Tous les sous-traitants sont conformes</p>
                </div>
              )}
            </div>
          </div>

          {/* Évolution globale des KQI */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-medium text-slate-300 mb-4">
              Évolution globale des KQI
              <span className="text-xs text-slate-500 ml-2 font-normal">
                Répartition des statuts par période
              </span>
            </h3>
            <ReactECharts option={globalTrendChartOption} style={{ height: 220 }} />
          </div>

          {/* Liste des ST en dégradation */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Sous-traitants en dégradation</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {Array.from(aggregations.entries())
                .filter(([, agg]) => agg.degradingCount > 0)
                .sort((a, b) => b[1].degradingCount - a[1].degradingCount)
                .map(([stId, agg]) => {
                  const st = allSTs.find((s) => s.id === stId);
                  const isExpanded = expandedSTId === stId;
                  // Récupérer les KQI en dégradation pour ce ST
                  const degradingKQIs = kqiData
                    .filter((k) => k.sous_traitant_id === stId && k.tendance === 'Dégradation')
                    .sort((a, b) => b.periode.localeCompare(a.periode));
                  // Garder uniquement le dernier par indicateur
                  const latestDegradingByIndicator = new Map<string, KQI>();
                  degradingKQIs.forEach((kqi) => {
                    if (!latestDegradingByIndicator.has(kqi.indicateur)) {
                      latestDegradingByIndicator.set(kqi.indicateur, kqi);
                    }
                  });
                  const uniqueDegradingKQIs = Array.from(latestDegradingByIndicator.values());

                  return (
                    <div key={stId} className="rounded-lg bg-slate-700/50 overflow-hidden">
                      <button
                        onClick={() => setExpandedSTId(isExpanded ? null : stId)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-700 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          <span className="text-sm font-medium text-slate-200">{st?.nom ?? stId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">
                            {agg.totalCount} indicateurs
                          </span>
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-500/20 text-purple-400">
                            <TrendingDown className="w-3 h-3" />
                            {agg.degradingCount} en dégradation
                          </span>
                          <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-slate-600/50 pt-2">
                          {uniqueDegradingKQIs.map((kqi) => (
                            <div key={kqi.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 text-xs">
                              <div className="flex-1">
                                <span className="text-slate-300 font-medium">{kqi.indicateur}</span>
                                <span className="text-slate-500 ml-2">({kqi.periode})</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400">
                                  Valeur: <span className="text-slate-200">{kqi.valeur}</span>
                                </span>
                                <span className="text-slate-400">
                                  Seuil: <span className="text-amber-400">{kqi.seuil_alerte}</span>
                                </span>
                                <span className={`px-1.5 py-0.5 rounded ${kqi.statut === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : kqi.statut === 'Attention' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {kqi.statut}
                                </span>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => handleSTClick(stId)}
                            className="w-full mt-2 py-1.5 text-xs text-center text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors"
                          >
                            Voir tous les KQI de ce sous-traitant →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              {Array.from(aggregations.entries()).filter(([, agg]) => agg.degradingCount > 0).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p>Aucune dégradation</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast de confirmation */}
        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500/90 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            {toastMessage}
          </div>
        )}
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
  color: 'indigo' | 'emerald' | 'amber' | 'red' | 'purple';
}) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
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
