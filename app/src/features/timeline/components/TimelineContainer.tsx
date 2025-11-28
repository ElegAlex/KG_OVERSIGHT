/**
 * KG-Oversight - Container Timeline moderne
 * Placeholder prêt pour vis-timeline
 */

import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineContainerProps {
  className?: string;
}

function TimeScaleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-xs rounded-md transition-all duration-200',
        active
          ? 'bg-indigo-500/20 text-indigo-400 font-medium'
          : 'text-slate-500 hover:text-slate-400 hover:bg-white/5'
      )}
    >
      {label}
    </button>
  );
}

export function TimelineContainer({ className }: TimelineContainerProps) {
  return (
    <div className={cn('app-timeline flex flex-col', className)}>
      {/* Header timeline */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-300">Timeline</span>
          <span className="text-xs text-slate-500">2023 - 2025</span>
        </div>

        <div className="flex items-center gap-1">
          <TimeScaleButton label="Jour" active={false} />
          <TimeScaleButton label="Mois" active />
          <TimeScaleButton label="Année" active={false} />
        </div>
      </div>

      {/* Zone timeline (placeholder) */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="relative">
            <Clock className="w-5 h-5 text-slate-600" />
            <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full opacity-50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">
              Timeline des événements
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Visualisation chronologique à implémenter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimelineContainer;
