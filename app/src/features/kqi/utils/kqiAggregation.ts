/**
 * KG-Oversight - Utilitaires d'agrégation KQI
 * Calcule les statuts agrégés des KQI par sous-traitant
 */

import type { KQI } from '@data/types';

export type KQIStatus = 'good' | 'warning' | 'critical';

export interface KQIAggregation {
  stId: string;
  status: KQIStatus;
  totalCount: number;
  alertCount: number;
  warningCount: number;
  okCount: number;
  degradingCount: number;
  latestPeriod: string;
}

/**
 * Agrège les KQI pour un sous-traitant donné
 * Prend uniquement la dernière période pour chaque indicateur
 */
export function aggregateKQIForST(kqiData: KQI[], stId: string): KQIAggregation {
  const stKQIs = kqiData.filter((k) => k.sous_traitant_id === stId);

  if (stKQIs.length === 0) {
    return {
      stId,
      status: 'good',
      totalCount: 0,
      alertCount: 0,
      warningCount: 0,
      okCount: 0,
      degradingCount: 0,
      latestPeriod: '',
    };
  }

  // Prendre uniquement la dernière période pour chaque indicateur
  const latestByIndicator = new Map<string, KQI>();
  stKQIs.forEach((kqi) => {
    const existing = latestByIndicator.get(kqi.indicateur);
    if (!existing || kqi.periode > existing.periode) {
      latestByIndicator.set(kqi.indicateur, kqi);
    }
  });

  const latestKQIs = Array.from(latestByIndicator.values());

  const alertCount = latestKQIs.filter((k) => k.statut === 'Alerte' || k.statut === 'Critique').length;
  const warningCount = latestKQIs.filter((k) => k.statut === 'Attention').length;
  const okCount = latestKQIs.filter((k) => k.statut === 'OK').length;
  const degradingCount = latestKQIs.filter((k) => k.tendance === 'Dégradation').length;

  let status: KQIStatus;
  if (alertCount > 0) {
    status = 'critical';
  } else if (warningCount > 0 || degradingCount > 0) {
    status = 'warning';
  } else {
    status = 'good';
  }

  // Trouver la période la plus récente
  const latestPeriod = latestKQIs.reduce(
    (latest, kqi) => (kqi.periode > latest ? kqi.periode : latest),
    ''
  );

  return {
    stId,
    status,
    totalCount: latestKQIs.length,
    alertCount,
    warningCount,
    okCount,
    degradingCount,
    latestPeriod,
  };
}

/**
 * Obtient la couleur associée à un statut KQI
 */
export function getKQIStatusColor(status: KQIStatus): string {
  switch (status) {
    case 'critical':
      return '#ef4444'; // Red
    case 'warning':
      return '#f59e0b'; // Amber
    case 'good':
      return '#10b981'; // Emerald
  }
}

/**
 * Obtient le libellé d'un statut KQI
 */
export function getKQIStatusLabel(status: KQIStatus): string {
  switch (status) {
    case 'critical':
      return 'Critique';
    case 'warning':
      return 'Attention';
    case 'good':
      return 'OK';
  }
}

/**
 * Groupe les KQI par indicateur
 */
export function groupKQIByIndicator(kqiData: KQI[]): Record<string, KQI[]> {
  const grouped: Record<string, KQI[]> = {};

  for (const kqi of kqiData) {
    const group = grouped[kqi.indicateur];
    if (!group) {
      grouped[kqi.indicateur] = [kqi];
    } else {
      group.push(kqi);
    }
  }

  // Trier chaque groupe par période décroissante
  for (const indicator of Object.keys(grouped)) {
    const group = grouped[indicator];
    if (group) {
      group.sort((a, b) => b.periode.localeCompare(a.periode));
    }
  }

  return grouped;
}

/**
 * Calcule l'évolution entre deux valeurs
 */
export function calculateEvolution(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Formate une valeur KQI selon le type d'indicateur
 */
export function formatKQIValue(value: number, indicator: string): string {
  // Indicateurs en pourcentage
  const percentageIndicators = [
    'Taux de conformité',
    'Taux de livraison',
    'Taux de rétention',
    'Taux de réponse',
  ];

  if (percentageIndicators.some((p) => indicator.toLowerCase().includes(p.toLowerCase()))) {
    return `${value.toFixed(1)}%`;
  }

  // Indicateurs en jours
  const daysIndicators = ['Délai', 'Durée', 'Temps'];
  if (daysIndicators.some((d) => indicator.toLowerCase().includes(d.toLowerCase()))) {
    return `${value.toFixed(0)} j`;
  }

  // Valeur par défaut
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

/**
 * Obtient l'icône de tendance
 */
export function getTrendIcon(trend: string): 'up' | 'down' | 'stable' {
  switch (trend) {
    case 'Amélioration':
      return 'up';
    case 'Dégradation':
      return 'down';
    default:
      return 'stable';
  }
}

/**
 * Calcule les agrégations KQI pour tous les sous-traitants
 */
export function aggregateAllSTsKQI(
  kqiData: KQI[],
  stIds: string[]
): Map<string, KQIAggregation> {
  const aggregations = new Map<string, KQIAggregation>();

  for (const stId of stIds) {
    aggregations.set(stId, aggregateKQIForST(kqiData, stId));
  }

  return aggregations;
}

/**
 * Exporte les données KQI en format CSV
 */
export function exportKQIToCSV(kqiData: KQI[], filename = 'kqi-export.csv'): void {
  if (kqiData.length === 0) {
    console.warn('[KQI Export] No data to export');
    return;
  }

  // Définir les colonnes
  const headers = [
    'ID',
    'Sous-traitant ID',
    'Sous-traitant',
    'Indicateur',
    'Période',
    'Valeur',
    'Seuil Objectif',
    'Seuil Alerte',
    'Statut',
    'Tendance',
  ];

  // Construire les lignes de données
  const rows = kqiData.map((kqi) => [
    kqi.id,
    kqi.sous_traitant_id,
    kqi.sous_traitant_nom,
    kqi.indicateur,
    kqi.periode,
    kqi.valeur.toString(),
    kqi.seuil_objectif.toString(),
    kqi.seuil_alerte.toString(),
    kqi.statut,
    kqi.tendance,
  ]);

  // Échapper les valeurs pour CSV
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Construire le contenu CSV
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  // Ajouter le BOM UTF-8 pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Télécharger le fichier
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);

  console.log(`[KQI Export] Exported ${kqiData.length} records to ${filename}`);
}

/**
 * Exporte les agrégations KQI par sous-traitant en CSV
 */
export function exportKQIAggregationsToCSV(
  aggregations: Map<string, KQIAggregation>,
  stNames: Map<string, string>,
  filename = 'kqi-synthese.csv'
): void {
  if (aggregations.size === 0) {
    console.warn('[KQI Export] No data to export');
    return;
  }

  const headers = [
    'Sous-traitant ID',
    'Sous-traitant',
    'Statut Global',
    'Nb Indicateurs',
    'Nb Alertes',
    'Nb Attention',
    'Nb OK',
    'Nb Dégradations',
    'Dernière Période',
  ];

  const rows = Array.from(aggregations.entries()).map(([stId, agg]) => [
    stId,
    stNames.get(stId) ?? stId,
    getKQIStatusLabel(agg.status),
    agg.totalCount.toString(),
    agg.alertCount.toString(),
    agg.warningCount.toString(),
    agg.okCount.toString(),
    agg.degradingCount.toString(),
    agg.latestPeriod,
  ]);

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);

  console.log(`[KQI Export] Exported ${aggregations.size} ST aggregations to ${filename}`);
}
