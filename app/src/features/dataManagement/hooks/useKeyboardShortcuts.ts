/**
 * KG-Oversight - Hook useKeyboardShortcuts
 * Gestion des raccourcis clavier globaux pour l'application
 *
 * Raccourcis disponibles :
 * - Ctrl+Z : Annuler (Undo)
 * - Ctrl+Y / Ctrl+Shift+Z : Rétablir (Redo)
 * - Ctrl+N : Créer une nouvelle entité
 * - Delete / Backspace : Supprimer la sélection (si callback fourni)
 * - Escape : Fermer les dialogs / Désélectionner
 */

import { useEffect, useCallback } from 'react';
import { useUndoRedo } from './useUndoRedo';

// =============================================================================
// Types
// =============================================================================

interface KeyboardShortcutsOptions {
  /** Callback appelé quand Ctrl+N est pressé */
  onCreateNew?: () => void;
  /** Callback appelé quand Delete/Backspace est pressé */
  onDelete?: () => void;
  /** Callback appelé quand Escape est pressé */
  onEscape?: () => void;
  /** Désactiver tous les raccourcis (ex: quand un input est focusé) */
  disabled?: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { onCreateNew, onDelete, onEscape, disabled = false } = options;
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignorer si désactivé
      if (disabled) return;

      // Ignorer si on est dans un input, textarea, ou contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="dialog"]') // Ignorer dans les dialogs
      ) {
        // Exception : Escape fonctionne même dans un input
        if (event.key !== 'Escape') {
          return;
        }
      }

      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isModKey = ctrlKey || metaKey; // Support Mac (Cmd) et Windows (Ctrl)

      // Ctrl+Z : Undo
      if (isModKey && key === 'z' && !shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      // Ctrl+Y ou Ctrl+Shift+Z : Redo
      if (isModKey && (key === 'y' || (key === 'z' && shiftKey))) {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }

      // Ctrl+N : Créer nouvelle entité
      if (isModKey && key === 'n') {
        event.preventDefault();
        onCreateNew?.();
        return;
      }

      // Delete ou Backspace : Supprimer
      if ((key === 'Delete' || key === 'Backspace') && !isModKey) {
        // Ne pas prévenir le comportement par défaut si on n'a pas de callback
        if (onDelete) {
          event.preventDefault();
          onDelete();
        }
        return;
      }

      // Escape : Fermer / Désélectionner
      if (key === 'Escape') {
        event.preventDefault();
        onEscape?.();
        return;
      }
    },
    [disabled, canUndo, canRedo, undo, redo, onCreateNew, onDelete, onEscape]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
