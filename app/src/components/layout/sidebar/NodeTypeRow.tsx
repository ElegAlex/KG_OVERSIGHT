/**
 * KG-Oversight - Ligne type de noeud avec checkbox custom
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeTypeRowProps {
  label: string;
  color: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}

export function NodeTypeRow({
  label,
  color,
  count,
  checked,
  onChange,
}: NodeTypeRowProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
        'transition-all duration-200',
        checked ? 'bg-white/5' : 'hover:bg-white/[0.02]'
      )}
    >
      {/* Checkbox custom */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-4 h-4 rounded border-2 transition-all duration-200',
            'flex items-center justify-center',
            checked
              ? 'border-indigo-500 bg-indigo-500'
              : 'border-slate-600 bg-transparent'
          )}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>

      {/* Color dot + label */}
      <div
        className="w-3 h-3 rounded-full ring-2 ring-white/10 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span
        className={cn(
          'flex-1 text-sm transition-colors truncate',
          checked ? 'text-slate-200' : 'text-slate-500'
        )}
      >
        {label}
      </span>
      <span className="text-xs text-slate-600 tabular-nums">{count}</span>
    </label>
  );
}

export default NodeTypeRow;
