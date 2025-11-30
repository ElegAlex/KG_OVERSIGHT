/**
 * KG-Oversight - Sélecteur de layout pour le graphe
 * Permet de choisir entre différents algorithmes de positionnement
 */

import { useState } from 'react';
import {
  GitBranch,
  Target,
  Circle,
  Shuffle,
  ScatterChart,
  ChevronDown,
  Check,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import type { LayoutType } from '../services/layoutService';

interface LayoutOption {
  type: LayoutType;
  name: string;
  description: string;
  icon: typeof GitBranch;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    type: 'forceAtlas2',
    name: 'Force Atlas',
    description: 'Layout organique basé sur les forces',
    icon: ScatterChart,
  },
  {
    type: 'dagre',
    name: 'Hiérarchique',
    description: 'Organisation en niveaux',
    icon: GitBranch,
  },
  {
    type: 'radial',
    name: 'Radial',
    description: 'Cercles concentriques',
    icon: Target,
  },
  {
    type: 'circular',
    name: 'Circulaire',
    description: 'Disposition en cercle',
    icon: Circle,
  },
];

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  isLayoutRunning?: boolean;
  className?: string;
}

export function LayoutSelector({
  currentLayout,
  onLayoutChange,
  isLayoutRunning = false,
  className,
}: LayoutSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = LAYOUT_OPTIONS.find((opt) => opt.type === currentLayout) ?? LAYOUT_OPTIONS[0]!;
  const CurrentIcon = currentOption.icon;

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={isLayoutRunning}
          className={cn(
            'flex items-center gap-2 px-3 py-2',
            'bg-slate-800/80 backdrop-blur-sm',
            'border border-white/10 rounded-lg',
            'text-sm text-slate-200',
            'hover:bg-slate-700/80 hover:border-white/20',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
        >
          {isLayoutRunning ? (
            <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
          ) : (
            <CurrentIcon className="w-4 h-4 text-indigo-400" />
          )}
          <span>{currentOption.name}</span>
          <ChevronDown className={cn(
            'w-4 h-4 text-slate-400 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="start"
          className={cn(
            'min-w-[220px] p-1',
            'bg-slate-800/95 backdrop-blur-xl',
            'border border-white/10 rounded-xl',
            'shadow-2xl shadow-black/40',
            'animate-in fade-in-0 zoom-in-95',
            'z-50'
          )}
        >
          <div className="px-2 py-1.5 mb-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Algorithme de layout
            </span>
          </div>

          {LAYOUT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = option.type === currentLayout;

            return (
              <DropdownMenu.Item
                key={option.type}
                onSelect={() => onLayoutChange(option.type)}
                className={cn(
                  'flex items-center gap-3 px-2 py-2 rounded-lg',
                  'cursor-pointer outline-none',
                  'transition-colors',
                  isSelected
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-200 hover:bg-white/5'
                )}
              >
                <Icon className={cn(
                  'w-4 h-4',
                  isSelected ? 'text-indigo-400' : 'text-slate-400'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{option.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                )}
              </DropdownMenu.Item>
            );
          })}

          <DropdownMenu.Separator className="h-px bg-white/10 my-1" />

          <div className="px-2 py-1.5">
            <p className="text-xs text-slate-500">
              Double-clic sur un nœud pour un layout radial centré
            </p>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default LayoutSelector;
