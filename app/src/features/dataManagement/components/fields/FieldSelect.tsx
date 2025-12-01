/**
 * KG-Oversight - Composant FieldSelect
 * Champ de sélection dropdown avec options
 */

import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '../../types';

interface FieldSelectProps {
  field: FieldDefinition;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const FieldSelect = forwardRef<HTMLSelectElement, FieldSelectProps>(
  ({ field, value, onChange, error, disabled = false, className }, ref) => {
    const id = useId();
    const options = field.options ?? [];

    return (
      <div className={cn('space-y-1.5', className)}>
        <label
          htmlFor={id}
          className="block text-xs font-medium text-slate-400"
        >
          {field.label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>

        <div className="relative">
          <select
            ref={ref}
            id={id}
            value={value ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              // Convertir en nombre si l'option originale était un nombre
              const originalOption = options.find(o => String(o.value) === val);
              onChange(typeof originalOption?.value === 'number' ? Number(val) : val);
            }}
            disabled={disabled || !field.editable}
            className={cn(
              'w-full px-3 py-2 text-sm rounded-lg border transition-colors appearance-none',
              'bg-slate-800/50 text-slate-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              error
                ? 'border-red-500/50 focus:ring-red-500/30'
                : 'border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/30',
              (disabled || !field.editable) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {!field.required && (
              <option value="">-- Sélectionner --</option>
            )}
            {options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none',
              (disabled || !field.editable) && 'opacity-50'
            )}
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
            {error}
          </p>
        )}

        {field.helpText && !error && (
          <p className="text-xs text-slate-600">{field.helpText}</p>
        )}
      </div>
    );
  }
);

FieldSelect.displayName = 'FieldSelect';

export default FieldSelect;
