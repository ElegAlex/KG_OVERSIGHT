/**
 * KG-Oversight - Store Jotai pour le panneau KQI
 */

import { atom } from 'jotai';

/** Le panneau KQI est-il ouvert ? */
export const kqiPanelOpenAtom = atom<boolean>(false);

/** ID du sous-traitant sélectionné pour afficher ses KQI */
export const selectedSTForKQIAtom = atom<string | null>(null);

/** Action : ouvrir le panneau KQI pour un ST */
export const openKQIPanelForSTAtom = atom(null, (_get, set, stId: string) => {
  set(selectedSTForKQIAtom, stId);
  set(kqiPanelOpenAtom, true);
});

/** Action : fermer le panneau KQI */
export const closeKQIPanelAtom = atom(null, (_get, set) => {
  set(kqiPanelOpenAtom, false);
  // Garder le ST sélectionné pour réouverture rapide
});

/** Action : naviguer vers un autre ST dans le panneau */
export const navigateToSTAtom = atom(null, (_get, set, stId: string) => {
  set(selectedSTForKQIAtom, stId);
});
