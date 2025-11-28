/**
 * KG-Oversight - Design System Colors
 * Palette moderne inspirée Linear/Vercel/Arc
 */

export const colors = {
  // Backgrounds (gradients subtils, pas de gris plats)
  bg: {
    app: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
    sidebar: 'bg-slate-900/80 backdrop-blur-xl',
    card: 'bg-slate-800/50 backdrop-blur-sm',
    cardHover: 'bg-slate-700/50',
    graph: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    timeline: 'bg-slate-900/90 backdrop-blur-md',
    header: 'bg-slate-900/80 backdrop-blur-xl',
  },

  // Bordures (subtiles, pas de gris dur)
  border: {
    subtle: 'border-white/5',
    default: 'border-white/10',
    hover: 'border-white/20',
    active: 'border-indigo-500/50',
  },

  // Texte (hiérarchie d'opacité)
  text: {
    primary: 'text-white',
    secondary: 'text-slate-300',
    tertiary: 'text-slate-400',
    muted: 'text-slate-500',
  },

  // Accents
  accent: {
    primary: 'text-indigo-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  },

  // Glow effects
  glow: {
    primary: 'shadow-indigo-500/25',
    success: 'shadow-emerald-500/25',
    warning: 'shadow-amber-500/25',
    danger: 'shadow-red-500/25',
  },
} as const;

// Styles pour les StatPills du header
export const statPillColors = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
} as const;

// Styles pour les badges de section sidebar
export const badgeColors = {
  slate: 'bg-slate-700 text-slate-300',
  red: 'bg-red-500/20 text-red-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/20 text-amber-400',
} as const;

// Couleurs des dots de filtre
export const dotColors = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-500',
  indigo: 'bg-indigo-500',
  sky: 'bg-sky-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
  lime: 'bg-lime-500',
  stone: 'bg-stone-500',
} as const;

// Styles pour les AlertCards
export const alertLevelStyles = {
  high: {
    bg: 'bg-red-500/10 hover:bg-red-500/20',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    dot: 'bg-red-500',
  },
  medium: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-slate-500/10 hover:bg-slate-500/20',
    border: 'border-slate-500/20',
    icon: 'text-slate-400',
    dot: 'bg-slate-500',
  },
} as const;

export type StatPillColor = keyof typeof statPillColors;
export type BadgeColor = keyof typeof badgeColors;
export type DotColor = keyof typeof dotColors;
export type AlertLevel = keyof typeof alertLevelStyles;
