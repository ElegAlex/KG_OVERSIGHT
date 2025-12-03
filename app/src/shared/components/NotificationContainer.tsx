/**
 * KG-Oversight - NotificationContainer
 * Conteneur pour afficher les notifications/toasts
 */

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  notificationsAtom,
  removeNotificationAtom,
  addNotificationAtom,
  setGlobalNotificationSetter,
  type Notification,
  type NotificationType,
} from '../stores/notificationStore';

const icons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

const styles: Record<NotificationType, string> = {
  success: 'bg-emerald-500/90 border-emerald-400/50',
  error: 'bg-red-500/90 border-red-400/50',
  warning: 'bg-amber-500/90 border-amber-400/50',
  info: 'bg-blue-500/90 border-blue-400/50',
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={cn(
        'px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 text-white min-w-[280px] max-w-[400px]',
        styles[notification.type]
      )}
    >
      <span className="shrink-0">{icons[notification.type]}</span>
      <p className="text-sm font-medium flex-1">{notification.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function NotificationContainer() {
  const notifications = useAtomValue(notificationsAtom);
  const removeNotification = useSetAtom(removeNotificationAtom);
  const addNotification = useSetAtom(addNotificationAtom);

  // Enregistrer le setter global pour permettre les notifications hors composants
  useEffect(() => {
    setGlobalNotificationSetter(addNotification);
    return () => setGlobalNotificationSetter(() => {});
  }, [addNotification]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default NotificationContainer;
