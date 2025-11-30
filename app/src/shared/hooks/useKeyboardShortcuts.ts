/**
 * KG-Oversight - Hook pour les raccourcis clavier globaux
 * Gère tous les raccourcis de l'application
 */

import { useEffect, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { undoAtom, redoAtom, canUndoAtom, canRedoAtom } from '../stores/historyStore';

// =============================================================================
// Types
// =============================================================================

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: 'navigation' | 'edition' | 'view' | 'general';
  action: () => void;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: Omit<KeyboardShortcut, 'action'>[];
}

// =============================================================================
// Liste des raccourcis pour l'aide
// =============================================================================

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    name: 'Navigation',
    shortcuts: [
      { key: 'ArrowLeft', description: 'Étape précédente (scénario)', category: 'navigation' },
      { key: 'ArrowRight', description: 'Étape suivante (scénario)', category: 'navigation' },
      { key: 'Space', description: 'Étape suivante (scénario)', category: 'navigation' },
      { key: 'Escape', description: 'Fermer le panneau actif', category: 'navigation' },
      { key: '+', description: 'Zoom avant', category: 'navigation' },
      { key: '-', description: 'Zoom arrière', category: 'navigation' },
      { key: '0', description: 'Réinitialiser le zoom', category: 'navigation' },
    ],
  },
  {
    name: 'Édition',
    shortcuts: [
      { key: 'Z', ctrl: true, description: 'Annuler (Undo)', category: 'edition' },
      { key: 'Z', ctrl: true, shift: true, description: 'Rétablir (Redo)', category: 'edition' },
      { key: 'Y', ctrl: true, description: 'Rétablir (Redo)', category: 'edition' },
      { key: 'A', ctrl: true, description: 'Tout sélectionner', category: 'edition' },
      { key: 'D', ctrl: true, description: 'Désélectionner tout', category: 'edition' },
    ],
  },
  {
    name: 'Affichage',
    shortcuts: [
      { key: 'F', description: 'Plein écran (scénario)', category: 'view' },
      { key: 'L', description: 'Afficher/Masquer la légende', category: 'view' },
      { key: 'T', description: 'Afficher/Masquer la timeline', category: 'view' },
      { key: '1', description: 'Layout Force Atlas', category: 'view' },
      { key: '2', description: 'Layout Hiérarchique', category: 'view' },
      { key: '3', description: 'Layout Radial', category: 'view' },
      { key: '4', description: 'Layout Circulaire', category: 'view' },
    ],
  },
  {
    name: 'Général',
    shortcuts: [
      { key: '?', description: "Afficher l'aide des raccourcis", category: 'general' },
      { key: 'S', ctrl: true, description: 'Exporter le graphe', category: 'general' },
      { key: 'O', ctrl: true, description: 'Importer des données', category: 'general' },
      { key: 'P', ctrl: true, description: 'Lancer un scénario', category: 'general' },
    ],
  },
];

// =============================================================================
// Hook principal
// =============================================================================

interface UseKeyboardShortcutsOptions {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToView?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onToggleLegend?: () => void;
  onToggleTimeline?: () => void;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
  onOpenScenarios?: () => void;
  onOpenHelp?: () => void;
  onLayoutChange?: (layout: string) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onZoomIn,
    onZoomOut,
    onFitToView,
    onSelectAll,
    onDeselectAll,
    onToggleLegend,
    onToggleTimeline,
    onOpenExport,
    onOpenImport,
    onOpenScenarios,
    onOpenHelp,
    onLayoutChange,
    enabled = true,
  } = options;

  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignorer si on est dans un input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const { key, ctrlKey, shiftKey, metaKey } = event;
      const modKey = ctrlKey || metaKey; // Support Mac (Cmd) et Windows/Linux (Ctrl)

      // Undo: Ctrl+Z
      if (modKey && !shiftKey && key.toLowerCase() === 'z') {
        event.preventDefault();
        if (canUndo) undo();
        return;
      }

      // Redo: Ctrl+Shift+Z ou Ctrl+Y
      if (modKey && shiftKey && key.toLowerCase() === 'z') {
        event.preventDefault();
        if (canRedo) redo();
        return;
      }
      if (modKey && key.toLowerCase() === 'y') {
        event.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Zoom
      if (key === '+' || key === '=') {
        event.preventDefault();
        onZoomIn?.();
        return;
      }
      if (key === '-') {
        event.preventDefault();
        onZoomOut?.();
        return;
      }
      if (key === '0' && !modKey) {
        event.preventDefault();
        onFitToView?.();
        return;
      }

      // Sélection
      if (modKey && key.toLowerCase() === 'a') {
        event.preventDefault();
        onSelectAll?.();
        return;
      }
      if (modKey && key.toLowerCase() === 'd') {
        event.preventDefault();
        onDeselectAll?.();
        return;
      }

      // Toggles
      if (key.toLowerCase() === 'l' && !modKey) {
        event.preventDefault();
        onToggleLegend?.();
        return;
      }
      if (key.toLowerCase() === 't' && !modKey) {
        event.preventDefault();
        onToggleTimeline?.();
        return;
      }

      // Actions
      if (modKey && key.toLowerCase() === 's') {
        event.preventDefault();
        onOpenExport?.();
        return;
      }
      if (modKey && key.toLowerCase() === 'o') {
        event.preventDefault();
        onOpenImport?.();
        return;
      }
      if (modKey && key.toLowerCase() === 'p') {
        event.preventDefault();
        onOpenScenarios?.();
        return;
      }

      // Aide
      if (key === '?' || (shiftKey && key === '/')) {
        event.preventDefault();
        onOpenHelp?.();
        return;
      }

      // Layouts (1-4)
      if (!modKey && ['1', '2', '3', '4'].includes(key)) {
        event.preventDefault();
        const layouts = ['forceAtlas2', 'dagre', 'radial', 'circular'];
        onLayoutChange?.(layouts[parseInt(key) - 1]);
        return;
      }
    },
    [
      enabled,
      canUndo,
      canRedo,
      undo,
      redo,
      onZoomIn,
      onZoomOut,
      onFitToView,
      onSelectAll,
      onDeselectAll,
      onToggleLegend,
      onToggleTimeline,
      onOpenExport,
      onOpenImport,
      onOpenScenarios,
      onOpenHelp,
      onLayoutChange,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
