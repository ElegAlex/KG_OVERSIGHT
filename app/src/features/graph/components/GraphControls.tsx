/**
 * KG-Oversight - Contrôles du graphe modernes
 * Zoom, reset, export
 */

import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { LucideIcon } from 'lucide-react';

interface ControlButtonProps {
  icon: LucideIcon;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

function ControlButton({ icon: Icon, tooltip, onClick, disabled }: ControlButtonProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'p-2 rounded-lg',
              'text-slate-400 hover:text-white',
              'hover:bg-white/10',
              'transition-all duration-200',
              'active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="left"
            sideOffset={8}
            className="px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl animate-fade-in"
          >
            {tooltip}
            <Tooltip.Arrow className="fill-slate-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

interface GraphControlsProps {
  className?: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  onResetLayout: () => void;
  onExportPNG?: () => void;
  isLayoutRunning?: boolean;
}

export function GraphControls({
  className,
  onZoomIn,
  onZoomOut,
  onFitToView,
  onResetLayout,
  onExportPNG,
  isLayoutRunning = false,
}: GraphControlsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-1.5',
        'bg-slate-800/80 backdrop-blur-xl',
        'border border-white/10 rounded-xl',
        'shadow-xl shadow-black/20',
        className
      )}
    >
      <ControlButton icon={ZoomIn} tooltip="Zoom +" onClick={onZoomIn} />
      <ControlButton icon={ZoomOut} tooltip="Zoom -" onClick={onZoomOut} />
      <div className="h-px bg-white/10 mx-1" />
      <ControlButton icon={Maximize2} tooltip="Ajuster à la vue" onClick={onFitToView} />
      <ControlButton
        icon={RefreshCw}
        tooltip="Recalculer le layout"
        onClick={onResetLayout}
        disabled={isLayoutRunning}
      />
      {onExportPNG && (
        <>
          <div className="h-px bg-white/10 mx-1" />
          <ControlButton icon={Download} tooltip="Exporter PNG" onClick={onExportPNG} />
        </>
      )}
    </div>
  );
}

export default GraphControls;
