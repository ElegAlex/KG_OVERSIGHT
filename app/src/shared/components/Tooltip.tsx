/**
 * KG-Oversight - Composant Tooltip réutilisable
 * Basé sur Radix UI Tooltip avec style cohérent
 */

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Provider
// =============================================================================

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={100}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

// =============================================================================
// Tooltip composable
// =============================================================================

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
  asChild?: boolean;
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  delayDuration,
  className,
  asChild = true,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild={asChild}>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-50 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 shadow-xl',
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-slate-800" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

// =============================================================================
// Tooltip avec raccourci clavier
// =============================================================================

interface TooltipWithShortcutProps extends Omit<TooltipProps, 'content'> {
  label: string;
  shortcut?: string;
}

export function TooltipWithShortcut({
  children,
  label,
  shortcut,
  ...props
}: TooltipWithShortcutProps) {
  return (
    <Tooltip
      {...props}
      content={
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-slate-400">
              {shortcut}
            </kbd>
          )}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}

// =============================================================================
// Tooltip riche (avec titre et description)
// =============================================================================

interface RichTooltipProps extends Omit<TooltipProps, 'content'> {
  title: string;
  description?: string;
  variant?: 'default' | 'info' | 'warning' | 'error';
}

export function RichTooltip({
  children,
  title,
  description,
  variant = 'default',
  ...props
}: RichTooltipProps) {
  const variantStyles = {
    default: 'border-slate-700',
    info: 'border-blue-500/50 bg-blue-950/50',
    warning: 'border-amber-500/50 bg-amber-950/50',
    error: 'border-red-500/50 bg-red-950/50',
  };

  return (
    <Tooltip
      {...props}
      className={cn('max-w-xs', variantStyles[variant])}
      content={
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}

export default Tooltip;
