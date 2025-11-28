/**
 * KG-Oversight - Carte d'alerte moderne
 */

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { alertLevelStyles, type AlertLevel } from '@/styles/colors';

interface AlertCardProps {
  level: AlertLevel;
  title: string;
  entity: string;
  time: string;
  onClick?: () => void;
}

export function AlertCard({
  level,
  title,
  entity,
  time,
  onClick,
}: AlertCardProps) {
  const styles = alertLevelStyles[level];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-xl border text-left',
        'transition-all duration-200',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex-shrink-0">
          <AlertTriangle className={cn('w-4 h-4', styles.icon)} />
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse',
              styles.dot
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{entity}</p>
        </div>
        <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">
          {time}
        </span>
      </div>
    </button>
  );
}

export default AlertCard;
