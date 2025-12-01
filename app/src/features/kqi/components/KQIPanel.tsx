/**
 * KG-Oversight - Panneau KQI détaillé
 * Affiche les indicateurs qualité d'un sous-traitant
 */

import { useEffect, useMemo, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  kqiPanelOpenAtom,
  selectedSTForKQIAtom,
} from '../stores/kqiPanelStore';
import { kqiDataAtom, allNodesAtom } from '@shared/stores/selectionAtoms';
import {
  aggregateKQIForST,
  groupKQIByIndicator,
  getKQIStatusColor,
  getKQIStatusLabel,
  formatKQIValue,
  getTrendIcon,
  calculateEvolution,
} from '../utils/kqiAggregation';
import type { KQI, SousTraitant } from '@data/types';

type TabId = 'overview' | 'details' | 'history';

interface KQIPanelProps {
  /** Mode intégré : le panneau est dans le flux, pas en position fixed */
  integrated?: boolean;
}

export function KQIPanel({ integrated = false }: KQIPanelProps) {
  const [isOpen, setIsOpen] = useAtom(kqiPanelOpenAtom);
  const [selectedSTId, setSelectedSTId] = useAtom(selectedSTForKQIAtom);
  const kqiData = useAtomValue(kqiDataAtom) as KQI[];
  const allNodes = useAtomValue(allNodesAtom);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

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

  // Récupérer le ST sélectionné
  const selectedST = selectedSTId ? (allNodes.get(selectedSTId) as SousTraitant | undefined) : null;

  // Filtrer les KQI du ST sélectionné
  const stKQIs = useMemo(() => {
    if (!selectedSTId) return [];
    return kqiData.filter((k) => k.sous_traitant_id === selectedSTId);
  }, [kqiData, selectedSTId]);

  // Grouper par indicateur
  const byIndicator = useMemo(() => groupKQIByIndicator(stKQIs), [stKQIs]);

  // Agrégation globale
  const aggregation = useMemo(() => {
    if (!selectedSTId) return null;
    return aggregateKQIForST(kqiData, selectedSTId);
  }, [kqiData, selectedSTId]);

  // Navigation entre ST
  const currentIndex = allSTs.findIndex((st) => st.id === selectedSTId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allSTs.length - 1;

  const goToPrev = () => {
    const prevST = allSTs[currentIndex - 1];
    if (hasPrev && prevST) setSelectedSTId(prevST.id);
  };

  const goToNext = () => {
    const nextST = allSTs[currentIndex + 1];
    if (hasNext && nextST) setSelectedSTId(nextST.id);
  };

  // En mode intégré, on affiche toujours (pas de vérification isOpen)
  // En mode overlay, on vérifie isOpen
  if (!integrated && !isOpen) return null;

  return (
    <div className={integrated
      ? "h-full bg-card flex flex-col overflow-hidden"
      : "fixed inset-y-0 right-0 w-[480px] bg-card border-l shadow-xl z-50 flex flex-col"
    }>
      {/* Header */}
      <div className={`border-b bg-card sticky top-0 z-10 ${integrated ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {aggregation && (
              <div
                className="w-3 h-3 rounded-full ring-2 ring-white shadow"
                style={{ backgroundColor: getKQIStatusColor(aggregation.status) }}
              />
            )}
            <h2 className={`font-semibold text-foreground ${integrated ? 'text-sm' : 'text-lg'}`}>
              {integrated ? 'Indicateurs Qualité' : (selectedST?.nom ?? 'Sélectionnez un ST')}
            </h2>
          </div>
          {!integrated && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation entre ST - uniquement en mode overlay */}
        {!integrated && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={goToPrev}
              disabled={!hasPrev}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <select
              value={selectedSTId ?? ''}
              onChange={(e) => setSelectedSTId(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded bg-background"
            >
              <option value="">Choisir un sous-traitant...</option>
              {allSTs.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nom}
                </option>
              ))}
            </select>
            <button
              onClick={goToNext}
              disabled={!hasNext}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Badges résumé */}
        {aggregation && aggregation.totalCount > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${integrated ? 'mt-2' : 'mt-3'}`}>
            <span
              className="px-1.5 py-0.5 text-[10px] font-medium rounded text-white"
              style={{ backgroundColor: getKQIStatusColor(aggregation.status) }}
            >
              {getKQIStatusLabel(aggregation.status)}
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
              {aggregation.totalCount} ind.
            </span>
            {aggregation.alertCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                {aggregation.alertCount} alertes
              </span>
            )}
            {aggregation.degradingCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">
                {aggregation.degradingCount} dégr.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="flex border-b bg-muted/30">
        {(['overview', 'details', 'history'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' && "Vue d'ensemble"}
            {tab === 'details' && 'Détail'}
            {tab === 'history' && 'Historique'}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedSTId ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-12 h-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-muted-foreground">
              Sélectionnez un sous-traitant pour voir ses indicateurs qualité
            </p>
          </div>
        ) : stKQIs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-12 h-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm text-muted-foreground">Aucun KQI pour ce sous-traitant</p>
          </div>
        ) : activeTab === 'overview' ? (
          <KQIOverviewGrid indicators={byIndicator} />
        ) : activeTab === 'details' ? (
          <KQIDetailsList indicators={byIndicator} />
        ) : (
          <KQIHistory indicators={byIndicator} />
        )}
      </div>
    </div>
  );
}

// Grille vue d'ensemble
function KQIOverviewGrid({ indicators }: { indicators: Record<string, KQI[]> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(indicators).map(([name, measures]) => {
        const latest = measures[0];
        if (!latest) return null;
        const trend = getTrendIcon(latest.tendance);

        return (
          <div
            key={name}
            className={`p-4 rounded-lg border-2 transition-colors ${
              latest.statut === 'Alerte' || latest.statut === 'Critique'
                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                : latest.statut === 'Attention'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                  : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
            }`}
          >
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{name}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatKQIValue(latest.valeur, name)}</span>
              {trend === 'up' && (
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trend === 'stable' && (
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Objectif : {latest.seuil_objectif}</span>
              <span className="mx-2">|</span>
              <span>Alerte : {latest.seuil_alerte}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Liste détaillée
function KQIDetailsList({ indicators }: { indicators: Record<string, KQI[]> }) {
  return (
    <div className="space-y-4">
      {Object.entries(indicators).map(([name, measures]) => {
        const latest = measures[0];
        if (!latest) return null;
        const previous = measures[1];
        const evolution = previous ? calculateEvolution(latest.valeur, previous.valeur) : null;

        return (
          <div key={name} className="p-4 rounded-lg border bg-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">{name}</h4>
                <p className="text-sm text-slate-500 mt-1">Dernière mesure : {latest.periode}</p>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  latest.statut === 'Alerte' || latest.statut === 'Critique'
                    ? 'bg-red-100 text-red-700'
                    : latest.statut === 'Attention'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {latest.statut}
              </span>
            </div>

            <div className="mt-4 flex items-end gap-4">
              <div>
                <div className="text-3xl font-bold text-slate-900">
                  {formatKQIValue(latest.valeur, name)}
                </div>
                {evolution !== null && (
                  <div
                    className={`text-sm mt-1 ${evolution > 0 ? 'text-emerald-600' : evolution < 0 ? 'text-red-600' : 'text-slate-500'}`}
                  >
                    {evolution > 0 ? '+' : ''}
                    {evolution.toFixed(1)}% vs période précédente
                  </div>
                )}
              </div>
            </div>

            {/* Jauge simplifiée */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>0</span>
                <span>Objectif: {latest.seuil_objectif}</span>
                <span>Alerte: {latest.seuil_alerte}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    latest.statut === 'Alerte' || latest.statut === 'Critique'
                      ? 'bg-red-500'
                      : latest.statut === 'Attention'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (latest.valeur / Math.max(latest.seuil_alerte, latest.seuil_objectif, latest.valeur)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Historique récent */}
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-sm font-medium text-slate-700 mb-2">Historique récent</h5>
              <div className="space-y-1">
                {measures.slice(0, 4).map((m) => (
                  <div key={m.periode} className="flex justify-between text-sm">
                    <span className="text-slate-500">{m.periode}</span>
                    <span
                      className={`font-medium ${
                        m.statut === 'Alerte' || m.statut === 'Critique'
                          ? 'text-red-600'
                          : m.statut === 'Attention'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }`}
                    >
                      {formatKQIValue(m.valeur, name)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Historique - Affiche tous les indicateurs avec leur évolution
function KQIHistory({ indicators }: { indicators: Record<string, KQI[]> }) {
  if (Object.keys(indicators).length === 0) {
    return <p className="text-sm text-muted-foreground text-center">Aucun historique disponible</p>;
  }

  const BAR_MAX_HEIGHT = 48; // pixels

  return (
    <div className="space-y-4">
      {Object.entries(indicators).map(([name, measures]) => {
        if (!measures || measures.length === 0) return null;

        // Trier par période croissante (ancien -> récent)
        const sortedMeasures = [...measures].sort((a, b) => a.periode.localeCompare(b.periode));
        const values = sortedMeasures.map((m) => m.valeur);
        const maxValue = Math.max(...values, 1);
        const latest = measures[0]; // Le plus récent (non trié)

        return (
          <div key={name} className="p-3 rounded-lg border bg-card shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-foreground">{name}</h4>
              {latest && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                    latest.statut === 'Alerte' || latest.statut === 'Critique'
                      ? 'bg-red-100 text-red-700'
                      : latest.statut === 'Attention'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {latest.statut}
                </span>
              )}
            </div>

            {/* Graphique en barres - hauteur en pixels */}
            <div
              className="flex items-end gap-1 border-b border-slate-200 dark:border-slate-700"
              style={{ height: `${BAR_MAX_HEIGHT + 4}px` }}
            >
              {sortedMeasures.map((m, idx) => {
                const barHeight = Math.max(Math.round((m.valeur / maxValue) * BAR_MAX_HEIGHT), 4);
                const barColor = m.statut === 'Alerte' || m.statut === 'Critique'
                  ? '#ef4444'
                  : m.statut === 'Attention'
                    ? '#f59e0b'
                    : '#10b981';

                return (
                  <div
                    key={m.periode}
                    className="flex-1 relative group"
                    style={{ height: `${BAR_MAX_HEIGHT}px` }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: barColor,
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        {m.periode}: <strong>{formatKQIValue(m.valeur, name)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Périodes */}
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
              <span>{sortedMeasures[0]?.periode}</span>
              <span>{sortedMeasures[sortedMeasures.length - 1]?.periode}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KQIPanel;
