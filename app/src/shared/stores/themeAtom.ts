/**
 * KG-Oversight - Theme Store
 * Gestion du thème dark/light avec persistance localStorage
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type Theme = 'dark' | 'light';

// Atom persisté dans localStorage
export const themeAtom = atomWithStorage<Theme>('kg-oversight-theme', 'dark');

// Atom dérivé pour savoir si on est en mode dark
export const isDarkAtom = atom((get) => get(themeAtom) === 'dark');
