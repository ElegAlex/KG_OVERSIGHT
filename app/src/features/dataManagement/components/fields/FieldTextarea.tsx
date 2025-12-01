/**
 * KG-Oversight - Composant FieldTextarea
 * Champ de saisie multilignes avec validation
 */

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '../../types';

interface FieldTextareaProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export const FieldTextarea = forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  ({ field, value, onChange, error, disabled = false, rows = 3, className }, ref) => {
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

        <textarea
          ref={ref}
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !field.editable}
          placeholder={field.placeholder}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border transition-colors resize-none',
            'bg-slate-800/50 text-slate-200 placeholder:text-slate-600',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
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

FieldTextarea.displayName = 'FieldTextarea';

export default FieldTextarea;
