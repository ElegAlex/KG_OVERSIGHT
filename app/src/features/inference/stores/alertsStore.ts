/**
 * KG-Oversight - Store Jotai pour le panneau des alertes
 */

import { atom } from 'jotai';
import type { InferredAlert } from '../rules/ruleDefinitions';

/** Le panneau d'alertes est-il ouvert ? */
export const alertsPanelOpenAtom = atom<boolean>(false);

/** Liste des alertes générées par le moteur de règles */
export const inferredAlertsAtom = atom<InferredAlert[]>([]);

/** Filtre par niveau d'alerte */
export const alertsLevelFilterAtom = atom<'all' | 'HAUTE' | 'MOYENNE' | 'BASSE'>('all');

/** Filtre par sous-traitant */
export const alertsSTFilterAtom = atom<string | null>(null);

/** Alerte sélectionnée pour navigation */
export const selectedAlertAtom = atom<InferredAlert | null>(null);

/** Alertes filtrées */
export const filteredAlertsAtom = atom((get) => {
  const alerts = get(inferredAlertsAtom);
  const levelFilter = get(alertsLevelFilterAtom);
  const stFilter = get(alertsSTFilterAtom);

  return alerts.filter((alert) => {
    if (levelFilter !== 'all' && alert.level !== levelFilter) return false;
    if (stFilter && alert.stId !== stFilter) return false;
    return true;
  });
});

/** Compteurs par niveau */
export const alertsCountByLevelAtom = atom((get) => {
  const alerts = get(inferredAlertsAtom);
  return {
    total: alerts.length,
    haute: alerts.filter((a) => a.level === 'HAUTE').length,
    moyenne: alerts.filter((a) => a.level === 'MOYENNE').length,
    basse: alerts.filter((a) => a.level === 'BASSE').length,
  };
});

/** Action : ouvrir le panneau d'alertes */
export const openAlertsPanelAtom = atom(null, (_get, set) => {
  set(alertsPanelOpenAtom, true);
});

/** Action : fermer le panneau d'alertes */
export const closeAlertsPanelAtom = atom(null, (_get, set) => {
  set(alertsPanelOpenAtom, false);
});

/** Action : mettre à jour les alertes */
export const setAlertsAtom = atom(null, (_get, set, alerts: InferredAlert[]) => {
  set(inferredAlertsAtom, alerts);
});

/** Action : sélectionner une alerte */
export const selectAlertAtom = atom(null, (_get, set, alert: InferredAlert | null) => {
  set(selectedAlertAtom, alert);
});
