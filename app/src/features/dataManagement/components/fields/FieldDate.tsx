/**
 * KG-Oversight - Composant FieldDate
 * Champ de saisie de date avec format français
 */

import { forwardRef, useId } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '../../types';

interface FieldDateProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const FieldDate = forwardRef<HTMLInputElement, FieldDateProps>(
  ({ field, value, onChange, error, disabled = false, className }, ref) => {
    const id = useId();

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
          <input
            ref={ref}
            id={id}
            type="date"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || !field.editable}
            className={cn(
              'w-full px-3 py-2 text-sm rounded-lg border transition-colors',
              'bg-slate-800/50 text-slate-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              // Style pour le calendrier natif
              '[&::-webkit-calendar-picker-indicator]:opacity-0',
              '[&::-webkit-calendar-picker-indicator]:absolute',
              '[&::-webkit-calendar-picker-indicator]:right-0',
              '[&::-webkit-calendar-picker-indicator]:w-full',
              '[&::-webkit-calendar-picker-indicator]:h-full',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              error
                ? 'border-red-500/50 focus:ring-red-500/30'
                : 'border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/30',
              (disabled || !field.editable) && 'opacity-50 cursor-not-allowed'
            )}
          />

          <Calendar
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

FieldDate.displayName = 'FieldDate';

export default FieldDate;
