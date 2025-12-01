/**
 * KG-Oversight - Composant FieldBoolean
 * Champ booléen avec toggle/checkbox
 */

import { forwardRef, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '../../types';

interface FieldBooleanProps {
  field: FieldDefinition;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const FieldBoolean = forwardRef<HTMLButtonElement, FieldBooleanProps>(
  ({ field, value, onChange, error, disabled = false, className }, ref) => {
    const id = useId();

    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="flex items-center gap-3">
          <button
            ref={ref}
            id={id}
            type="button"
            role="checkbox"
            aria-checked={value}
            onClick={() => !disabled && field.editable && onChange(!value)}
            disabled={disabled || !field.editable}
            className={cn(
              'w-5 h-5 rounded border-2 transition-all flex items-center justify-center shrink-0',
              value
                ? 'bg-indigo-500 border-indigo-500'
                : 'bg-slate-800/50 border-white/20',
              (disabled || !field.editable)
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:border-indigo-400',
              error && 'border-red-500/50'
            )}
          >
            {value && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </button>

          <label
            htmlFor={id}
            className={cn(
              'text-sm text-slate-300 select-none',
              (disabled || !field.editable) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            )}
          >
            {field.label}
            {field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1 ml-8">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
            {error}
          </p>
        )}

        {field.helpText && !error && (
          <p className="text-xs text-slate-600 ml-8">{field.helpText}</p>
        )}
      </div>
    );
  }
);

FieldBoolean.displayName = 'FieldBoolean';

export default FieldBoolean;
