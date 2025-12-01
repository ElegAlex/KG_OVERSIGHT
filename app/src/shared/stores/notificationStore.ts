/**
 * KG-Oversight - Notification Store
 * Système de notifications/toasts global avec Jotai
 */

import { atom } from 'jotai';

// =============================================================================
// Types
// =============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // ms, undefined = ne disparaît pas automatiquement
  timestamp: number;
}

// =============================================================================
// Atoms
// =============================================================================

/** Liste des notifications actives */
export const notificationsAtom = atom<Notification[]>([]);

/** Compteur pour générer des IDs uniques */
let notificationIdCounter = 0;

// =============================================================================
// Actions
// =============================================================================

/**
 * Ajoute une notification
 */
export function createNotification(
  type: NotificationType,
  message: string,
  duration: number = 4000
): Notification {
  return {
    id: `notification-${++notificationIdCounter}`,
    type,
    message,
    duration,
    timestamp: Date.now(),
  };
}

/**
 * Atom pour ajouter une notification
 */
export const addNotificationAtom = atom(
  null,
  (get, set, notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${++notificationIdCounter}`,
      timestamp: Date.now(),
    };

    set(notificationsAtom, (prev) => [...prev, newNotification]);

    // Auto-dismiss après la durée spécifiée
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        set(notificationsAtom, (prev) =>
          prev.filter((n) => n.id !== newNotification.id)
        );
      }, notification.duration);
    }

    return newNotification.id;
  }
);

/**
 * Atom pour supprimer une notification
 */
export const removeNotificationAtom = atom(null, (get, set, id: string) => {
  set(notificationsAtom, (prev) => prev.filter((n) => n.id !== id));
});

/**
 * Atom pour supprimer toutes les notifications
 */
export const clearNotificationsAtom = atom(null, (get, set) => {
  set(notificationsAtom, []);
});

// =============================================================================
// Helpers pour utilisation simplifiée
// =============================================================================

export const showSuccessAtom = atom(
  null,
  (get, set, message: string, duration: number = 4000) => {
    set(addNotificationAtom, { type: 'success', message, duration });
  }
);

export const showErrorAtom = atom(
  null,
  (get, set, message: string, duration: number = 6000) => {
    set(addNotificationAtom, { type: 'error', message, duration });
  }
);

export const showWarningAtom = atom(
  null,
  (get, set, message: string, duration: number = 5000) => {
    set(addNotificationAtom, { type: 'warning', message, duration });
  }
);

export const showInfoAtom = atom(
  null,
  (get, set, message: string, duration: number = 4000) => {
    set(addNotificationAtom, { type: 'info', message, duration });
  }
);
