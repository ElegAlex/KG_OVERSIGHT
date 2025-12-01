/**
 * KG-Oversight - Utilitaires de normalisation KQI
 *
 * Centralise la logique de normalisation des valeurs KQI pour garantir
 * la cohérence entre les données CSV, le cache IndexedDB et les types TypeScript.
 *
 * IMPORTANT: Ce module est la source de vérité pour la normalisation.
 * Toute modification des règles de normalisation doit être faite ici.
 */

import type { KQI, Tendance } from '@data/types';

/** Statuts KQI normalisés selon le type TypeScript */
export type KQIStatutNormalized = 'OK' | 'Attention' | 'Alerte' | 'Critique';

/** Tendances KQI normalisées selon le type TypeScript */
export type KQITendanceNormalized = Tendance;

/**
 * Table de mapping statut CSV → statut normalisé
 * Permet une correspondance exhaustive et maintenable
 */
const STATUT_MAPPING: Record<string, KQIStatutNormalized> = {
  // Valeurs normalisées (identité)
  'ok': 'OK',
  'attention': 'Attention',
  'alerte': 'Alerte',
  'critique': 'Critique',
  // Valeurs CSV legacy
  'conforme': 'OK',
  'à surveiller': 'Attention',
  'a surveiller': 'Attention',
  // Variantes possibles
  'warning': 'Attention',
  'alert': 'Alerte',
  'critical': 'Critique',
  'good': 'OK',
  'satisfaisant': 'OK',
  'non satisfaisant': 'Critique',
};

/**
 * Normalise un statut KQI vers les valeurs attendues par le type TypeScript.
 *
 * @param statut - Valeur brute du statut (depuis CSV ou cache)
 * @returns Statut normalisé conforme au type KQI['statut']
 *
 * @example
 * normalizeKQIStatut('Conforme') // → 'OK'
 * normalizeKQIStatut('À surveiller') // → 'Attention'
 * normalizeKQIStatut('OK') // → 'OK'
 */
export function normalizeKQIStatut(statut: string | undefined | null): KQIStatutNormalized {
  if (!statut) return 'OK';

  const normalized = statut.toLowerCase().trim();
  const mapped = STATUT_MAPPING[normalized];

  if (mapped) return mapped;

  // Fallback intelligent basé sur des patterns partiels
  if (normalized.includes('critique') || normalized.includes('critical')) return 'Critique';
  if (normalized.includes('alerte') || normalized.includes('alert')) return 'Alerte';
  if (normalized.includes('attention') || normalized.includes('warning') || normalized.includes('surveiller')) return 'Attention';

  // Par défaut, considérer comme OK (cas non reconnu)
  console.warn(`[KQI Normalization] Statut non reconnu: "${statut}", normalisé en "OK"`);
  return 'OK';
}

/**
 * Table de mapping tendance CSV → tendance normalisée
 */
const TENDANCE_MAPPING: Record<string, KQITendanceNormalized> = {
  // Valeurs normalisées (identité)
  'amélioration': 'Amélioration',
  'stable': 'Stable',
  'dégradation': 'Dégradation',
  // Variantes sans accents
  'amelioration': 'Amélioration',
  'degradation': 'Dégradation',
  // Variantes anglaises
  'improvement': 'Amélioration',
  'degrading': 'Dégradation',
  'declining': 'Dégradation',
};

/**
 * Normalise une tendance KQI vers les valeurs attendues par le type TypeScript.
 *
 * @param tendance - Valeur brute de la tendance (depuis CSV ou cache)
 * @returns Tendance normalisée conforme au type KQI['tendance']
 *
 * @example
 * normalizeKQITendance('↑ Amélioration') // → 'Amélioration'
 * normalizeKQITendance('→ Stable') // → 'Stable'
 * normalizeKQITendance('↓ Dégradation') // → 'Dégradation'
 */
export function normalizeKQITendance(tendance: string | undefined | null): KQITendanceNormalized {
  if (!tendance) return 'Stable';

  const normalized = tendance.toLowerCase().trim();

  // Vérifier le mapping exact d'abord
  const mapped = TENDANCE_MAPPING[normalized];
  if (mapped) return mapped;

  // Détection par symboles unicode (flèches)
  if (normalized.includes('↑')) return 'Amélioration';
  if (normalized.includes('↓')) return 'Dégradation';
  if (normalized.includes('→') || normalized.includes('−') || normalized.includes('-')) return 'Stable';

  // Détection par mots-clés partiels
  if (normalized.includes('amélioration') || normalized.includes('amelioration') || normalized.includes('improv')) return 'Amélioration';
  if (normalized.includes('dégradation') || normalized.includes('degradation') || normalized.includes('declin')) return 'Dégradation';

  // Par défaut, considérer comme Stable
  return 'Stable';
}

/**
 * Normalise un objet KQI complet.
 * Utile pour normaliser des données provenant du cache IndexedDB
 * qui pourraient contenir des valeurs legacy.
 *
 * @param kqi - Objet KQI potentiellement avec des valeurs non normalisées
 * @returns KQI avec statut et tendance normalisés
 */
export function normalizeKQI<T extends { statut?: string; tendance?: string }>(kqi: T): T & { statut: KQIStatutNormalized; tendance: KQITendanceNormalized } {
  return {
    ...kqi,
    statut: normalizeKQIStatut(kqi.statut),
    tendance: normalizeKQITendance(kqi.tendance),
  };
}

/**
 * Normalise un tableau de KQI.
 * Applique la normalisation à chaque élément du tableau.
 *
 * @param kqis - Tableau de KQI potentiellement avec des valeurs non normalisées
 * @returns Tableau de KQI normalisés
 */
export function normalizeKQIArray(kqis: KQI[]): KQI[] {
  return kqis.map((kqi) => normalizeKQI(kqi) as KQI);
}

/**
 * Vérifie si un statut KQI est déjà normalisé.
 * Utile pour éviter une double normalisation.
 *
 * @param statut - Statut à vérifier
 * @returns true si le statut est déjà dans un format normalisé
 */
export function isStatutNormalized(statut: string | undefined | null): statut is KQIStatutNormalized {
  if (!statut) return false;
  return ['OK', 'Attention', 'Alerte', 'Critique'].includes(statut);
}

/**
 * Vérifie si une tendance KQI est déjà normalisée.
 *
 * @param tendance - Tendance à vérifier
 * @returns true si la tendance est déjà dans un format normalisé
 */
export function isTendanceNormalized(tendance: string | undefined | null): tendance is KQITendanceNormalized {
  if (!tendance) return false;
  return ['Amélioration', 'Stable', 'Dégradation'].includes(tendance);
}
