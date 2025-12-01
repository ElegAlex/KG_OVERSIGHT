/**
 * KG-Oversight - Composant FieldNumber
 * Champ de saisie numérique avec validation
 */

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '../../types';

interface FieldNumberProps {
  field: FieldDefinition;
  value: number | string;
  onChange: (value: number | string) => void;
  error?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const FieldNumber = forwardRef<HTMLInputElement, FieldNumberProps>(
  ({ field, value, onChange, error, disabled = false, min, max, step = 1, className }, ref) => {
    const id = useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '') {
        onChange('');
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          onChange(num);
        }
      }
    };

    return (
      <div className={cn('space-y-1.5', className)}>
        <label
          htmlFor={id}
          className="block text-xs font-medium text-slate-400"
        >
          {field.label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>

        <input
          ref={ref}
          id={id}
          type="number"
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled || !field.editable}
          placeholder={field.placeholder}
          min={min}
          max={max}
          step={step}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border transition-colors',
            'bg-slate-800/50 text-slate-200 placeholder:text-slate-600',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // Masquer les spinners par défaut
            '[&::-webkit-inner-spin-button]:appearance-none',
            '[&::-webkit-outer-spin-button]:appearance-none',
            'appearance-textfield',
            error
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/30',
            (disabled || !field.editable) && 'opacity-50 cursor-not-allowed'
          )}
        />

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

FieldNumber.displayName = 'FieldNumber';

export default FieldNumber;
