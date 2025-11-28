/**
 * KG-Oversight - Animation variants for Framer Motion
 * Micro-interactions fluides et modernes
 */

import type { Variants, Transition } from 'framer-motion';

// Transitions de base
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

export const slowTransition: Transition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
};

// Fade In
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide In depuis la droite
export const slideInRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

// Slide In depuis la gauche
export const slideInLeft: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

// Slide In depuis le bas
export const slideInUp: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

// Slide In depuis le haut
export const slideInDown: Variants = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

// Scale In
export const scaleIn: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

// Scale In from center (pour les modales)
export const scaleInCenter: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

// Stagger container pour listes
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

// Item de liste avec stagger
export const listItem: Variants = {
  initial: { x: -10, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -10, opacity: 0 },
};

// Collapse/Expand pour accordéon
export const collapseContent: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.2, delay: 0.05 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.1 },
    },
  },
};

// Hover scale pour les boutons
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

// Tap scale pour les boutons
export const tapScale = {
  scale: 0.98,
};

// Pulse animation pour les badges d'alerte
export const pulseAnimation: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Rotation pour les icônes d'accordéon
export const rotateChevron: Variants = {
  closed: { rotate: 0 },
  open: { rotate: 90 },
};

// Glow pulse pour les éléments importants
export const glowPulse: Variants = {
  initial: { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(99, 102, 241, 0)',
      '0 0 20px 5px rgba(99, 102, 241, 0.3)',
      '0 0 0 0 rgba(99, 102, 241, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Skeleton loading animation
export const skeletonPulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Overlay backdrop
export const overlayBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Panel slide (pour les sidebars)
export const panelSlide: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

// Tooltip apparition
export const tooltipIn: Variants = {
  initial: { opacity: 0, y: 5, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    y: 5,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};
