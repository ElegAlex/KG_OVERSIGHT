/**
 * KG-Oversight - Chip de filtre moderne
 */

import { cn } from '@/lib/utils';
import { dotColors, type DotColor } from '@/styles/colors';

interface FilterChipProps {
  label: string;
  color: DotColor;
  count: number;
  checked?: boolean;
  onChange?: () => void;
}

export function FilterChip({
  label,
  color,
  count,
  checked = true,
  onChange,
}: FilterChipProps) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm w-full',
        'transition-all duration-200',
        checked
          ? 'bg-white/5 text-white'
          : 'bg-transparent text-slate-500 hover:text-slate-400 hover:bg-white/[0.02]'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full transition-opacity',
          dotColors[color],
          !checked && 'opacity-30'
        )}
      />
      <span className="flex-1 text-left">{label}</span>
      <span
        className={cn(
          'text-xs tabular-nums',
          checked ? 'text-slate-400' : 'text-slate-600'
        )}
      >
        {count}
      </span>
    </button>
  );
}

export default FilterChip;
