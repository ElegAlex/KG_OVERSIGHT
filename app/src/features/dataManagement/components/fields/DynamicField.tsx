/**
 * KG-Oversight - Composant DynamicField
 * Rendu dynamique du champ approprié selon le type défini dans le schéma
 */

import type { FieldDefinition } from '../../types';
import { FieldInput } from './FieldInput';
import { FieldTextarea } from './FieldTextarea';
import { FieldSelect } from './FieldSelect';
import { FieldDate } from './FieldDate';
import { FieldNumber } from './FieldNumber';
import { FieldBoolean } from './FieldBoolean';

interface DynamicFieldProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
  disabled = false,
  className,
}: DynamicFieldProps) {
  switch (field.type) {
    case 'text':
      return (
        <FieldInput
          field={field}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case 'textarea':
      return (
        <FieldTextarea
          field={field}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case 'select':
      return (
        <FieldSelect
          field={field}
          value={(value as string | number) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case 'date':
      return (
        <FieldDate
          field={field}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case 'number':
      return (
        <FieldNumber
          field={field}
          value={(value as number | string) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case 'boolean':
      return (
        <FieldBoolean
          field={field}
          value={Boolean(value)}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    case 'entityRef':
      // Pour les références d'entités, on utilise un champ texte pour l'instant
      // Un sélecteur d'entités sera implémenté dans Phase 11.5
      return (
        <FieldInput
          field={{
            ...field,
            helpText: field.helpText ?? `Référence vers ${field.entityRefType}`,
          }}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );

    default:
      return (
        <FieldInput
          field={field}
          value={String(value ?? '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      );
  }
}

export default DynamicField;
