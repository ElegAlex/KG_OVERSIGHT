/**
 * KG-Oversight - Validation Service
 * Service de validation des entités du Knowledge Graph
 *
 * Valide les entités selon leur schéma :
 * - Champs requis
 * - Types de données
 * - Contraintes (longueur, format, plage)
 * - Références vers d'autres entités
 */

import type { NodeType, EdgeType, GraphNode } from '@data/types';
import type {
  ValidationResult,
  ValidationError,
  ValidationRule,
  ValidationRuleType,
  FieldDefinition,
} from '../types';
import { getEntitySchema } from '../constants/entitySchemas';

// =============================================================================
// Configuration
// =============================================================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Messages d'erreur en français
const ERROR_MESSAGES: Record<ValidationRuleType, string> = {
  required: 'Ce champ est obligatoire',
  minLength: 'Minimum {value} caractères requis',
  maxLength: 'Maximum {value} caractères autorisés',
  pattern: 'Format invalide',
  oneOf: 'Valeur non autorisée',
  date: 'Format de date invalide (attendu: AAAA-MM-JJ)',
  dateAfter: 'La date doit être postérieure à {ref}',
  dateBefore: 'La date doit être antérieure à {ref}',
  number: 'Valeur numérique attendue',
  min: 'Valeur minimale: {value}',
  max: 'Valeur maximale: {value}',
  entityRef: 'Référence invalide vers {value}',
  unique: 'Cette valeur existe déjà',
};

// =============================================================================
// Types internes
// =============================================================================

interface ValidationContext {
  entityType: NodeType;
  existingNodes?: Map<string, GraphNode>;
  isUpdate?: boolean;
  originalId?: string;
}

// =============================================================================
// Fonctions de validation par règle
// =============================================================================

function validateRequired(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return ERROR_MESSAGES.required;
  }
  if (Array.isArray(value) && value.length === 0) {
    return ERROR_MESSAGES.required;
  }
  return null;
}

function validateMinLength(
  value: unknown,
  rule: Partial<ValidationRule>
): string | null {
  if (typeof value !== 'string') return null;
  const minLength = rule.value as number;
  if (value.length < minLength) {
    return ERROR_MESSAGES.minLength.replace('{value}', String(minLength));
  }
  return null;
}

function validateMaxLength(
  value: unknown,
  rule: Partial<ValidationRule>
): string | null {
  if (typeof value !== 'string') return null;
  const maxLength = rule.value as number;
  if (value.length > maxLength) {
    return ERROR_MESSAGES.maxLength.replace('{value}', String(maxLength));
  }
  return null;
}

function validatePattern(
  value: unknown,
  rule: Partial<ValidationRule>
): string | null {
  if (typeof value !== 'string' || !value) return null;
  const pattern = rule.value as string;
  const regex = new RegExp(pattern);
  if (!regex.test(value)) {
    return rule.message || ERROR_MESSAGES.pattern;
  }
  return null;
}

function validateOneOf(
  value: unknown,
  rule: Partial<ValidationRule>
): string | null {
  if (value === undefined || value === null || value === '') return null;
  const allowedValues = rule.value as (string | number)[];
  if (!allowedValues.includes(value as string | number)) {
    return ERROR_MESSAGES.oneOf;
  }
  return null;
}

function validateDate(value: unknown): string | null {
  if (!value || value === '') return null;
  if (typeof value !== 'string') {
    return ERROR_MESSAGES.date;
  }
  if (!DATE_REGEX.test(value)) {
    return ERROR_MESSAGES.date;
  }
  // Vérifier que la date est valide
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return ERROR_MESSAGES.date;
  }
  return null;
}

function validateDateAfter(
  value: unknown,
  rule: Partial<ValidationRule>,
  data: Record<string, unknown>
): string | null {
  if (!value || !rule.ref) return null;
  const refValue = data[rule.ref];
  if (!refValue) return null;

  const date = new Date(value as string);
  const refDate = new Date(refValue as string);

  if (date <= refDate) {
    return ERROR_MESSAGES.dateAfter.replace('{ref}', rule.ref);
  }
  return null;
}

function validateDateBefore(
  value: unknown,
  rule: Partial<ValidationRule>,
  data: Record<string, unknown>
): string | null {
  if (!value || !rule.ref) return null;
  const refValue = data[rule.ref];
  if (!refValue) return null;

  const date = new Date(value as string);
  const refDate = new Date(refValue as string);

  if (date >= refDate) {
    return ERROR_MESSAGES.dateBefore.replace('{ref}', rule.ref);
  }
  return null;
}

function validateNumber(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return null;
  if (typeof value === 'string' && !isNaN(parseFloat(value))) return null;
  return ERROR_MESSAGES.number;
}

function validateMin(
  value: unknown,
  rule: Partial<ValidationRule>
): string | null {
  if (value === undefined || value === null || value === '') return null;
  const numValue = typeof value === 'number' ? value : parseFloat(value as string);
  if (isNaN(numValue)) return null;
  const minValue = rule.value as number;
  if (numValue < minValue) {
    return ERROR_MESSAGES.min.replace('{value}', String(minValue));
  }
  return null;
}

function validateMax(
  value: unknown,
  rule: Partial<ValidationRule>
): string | null {
  if (value === undefined || value === null || value === '') return null;
  const numValue = typeof value === 'number' ? value : parseFloat(value as string);
  if (isNaN(numValue)) return null;
  const maxValue = rule.value as number;
  if (numValue > maxValue) {
    return ERROR_MESSAGES.max.replace('{value}', String(maxValue));
  }
  return null;
}

function validateEntityRef(
  value: unknown,
  rule: Partial<ValidationRule>,
  context: ValidationContext
): string | null {
  if (!value || value === '') return null;
  const refType = rule.value as string;

  // Si pas de map des nœuds existants, on ne peut pas valider
  if (!context.existingNodes) {
    console.warn('Validation entityRef sans contexte de nœuds existants');
    return null;
  }

  const refNode = context.existingNodes.get(value as string);
  if (!refNode) {
    return `L'entité référencée "${value}" n'existe pas`;
  }

  if (refNode.type !== refType) {
    return `L'entité "${value}" n'est pas du type attendu (${refType})`;
  }

  return null;
}

function validateUnique(
  value: unknown,
  rule: Partial<ValidationRule>,
  context: ValidationContext
): string | null {
  if (!value || value === '') return null;

  // Si pas de map des nœuds existants, on ne peut pas valider
  if (!context.existingNodes) {
    return null;
  }

  const fieldName = rule.field as string;

  for (const [nodeId, node] of context.existingNodes) {
    // Ignorer le nœud en cours de modification
    if (context.isUpdate && nodeId === context.originalId) {
      continue;
    }

    // Ignorer les nœuds d'un autre type
    if (node.type !== context.entityType) {
      continue;
    }

    // Comparer les valeurs
    const existingValue = (node as Record<string, unknown>)[fieldName];
    if (existingValue === value) {
      return ERROR_MESSAGES.unique;
    }
  }

  return null;
}

// =============================================================================
// Dispatcher de validation
// =============================================================================

function validateRule(
  value: unknown,
  rule: Partial<ValidationRule> & { rule: ValidationRuleType },
  data: Record<string, unknown>,
  context: ValidationContext
): string | null {
  switch (rule.rule) {
    case 'required':
      return validateRequired(value);
    case 'minLength':
      return validateMinLength(value, rule);
    case 'maxLength':
      return validateMaxLength(value, rule);
    case 'pattern':
      return validatePattern(value, rule);
    case 'oneOf':
      return validateOneOf(value, rule);
    case 'date':
      return validateDate(value);
    case 'dateAfter':
      return validateDateAfter(value, rule, data);
    case 'dateBefore':
      return validateDateBefore(value, rule, data);
    case 'number':
      return validateNumber(value);
    case 'min':
      return validateMin(value, rule);
    case 'max':
      return validateMax(value, rule);
    case 'entityRef':
      return validateEntityRef(value, rule, context);
    case 'unique':
      return validateUnique(value, rule, context);
    default:
      console.warn(`Règle de validation inconnue: ${rule.rule}`);
      return null;
  }
}

// =============================================================================
// Validation d'un champ
// =============================================================================

function validateField(
  field: FieldDefinition,
  data: Record<string, unknown>,
  context: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const value = data[field.name];

  // Validation required
  if (field.required) {
    const error = validateRequired(value, {});
    if (error) {
      errors.push({
        field: field.name,
        rule: 'required',
        message: error,
        value,
      });
      // Si required échoue, pas la peine de continuer
      return errors;
    }
  }

  // Si la valeur est vide et non required, pas de validation supplémentaire
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // Validation du type de champ
  switch (field.type) {
    case 'date': {
      const dateError = validateDate(value);
      if (dateError) {
        errors.push({
          field: field.name,
          rule: 'date',
          message: dateError,
          value,
        });
      }
      break;
    }

    case 'number': {
      const numError = validateNumber(value);
      if (numError) {
        errors.push({
          field: field.name,
          rule: 'number',
          message: numError,
          value,
        });
      }
      break;
    }

    case 'select': {
      if (field.options) {
        const allowedValues = field.options.map((opt) => opt.value);
        const selectError = validateOneOf(value, { value: allowedValues });
        if (selectError) {
          errors.push({
            field: field.name,
            rule: 'oneOf',
            message: selectError,
            value,
          });
        }
      }
      break;
    }

    case 'entityRef': {
      if (field.entityRefType) {
        const refError = validateEntityRef(
          value,
          { value: field.entityRefType },
          context
        );
        if (refError) {
          errors.push({
            field: field.name,
            rule: 'entityRef',
            message: refError,
            value,
          });
        }
      }
      break;
    }
  }

  // Validation des règles personnalisées
  if (field.validation) {
    for (const rule of field.validation) {
      const error = validateRule(
        value,
        { ...rule, field: field.name },
        data,
        context
      );
      if (error) {
        errors.push({
          field: field.name,
          rule: rule.rule,
          message: rule.message || error,
          value,
        });
      }
    }
  }

  return errors;
}

// =============================================================================
// Fonctions publiques
// =============================================================================

/**
 * Valide une entité complète contre son schéma
 */
export function validateEntity(
  entityType: NodeType,
  data: Record<string, unknown>,
  options: {
    existingNodes?: Map<string, GraphNode>;
    isUpdate?: boolean;
    originalId?: string;
  } = {}
): ValidationResult {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return {
      isValid: false,
      errors: [
        {
          field: '_type',
          rule: 'required',
          message: `Type d'entité inconnu: ${entityType}`,
        },
      ],
    };
  }

  const context: ValidationContext = {
    entityType,
    existingNodes: options.existingNodes,
    isUpdate: options.isUpdate,
    originalId: options.originalId,
  };

  const allErrors: ValidationError[] = [];

  // Valider chaque champ du schéma
  for (const field of schema.fields) {
    const fieldErrors = validateField(field, data, context);
    allErrors.push(...fieldErrors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Valide un seul champ
 */
export function validateSingleField(
  entityType: NodeType,
  fieldName: string,
  value: unknown,
  fullData: Record<string, unknown> = {},
  options: {
    existingNodes?: Map<string, GraphNode>;
    isUpdate?: boolean;
    originalId?: string;
  } = {}
): ValidationError[] {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return [
      {
        field: fieldName,
        rule: 'required',
        message: `Type d'entité inconnu: ${entityType}`,
      },
    ];
  }

  const field = schema.fields.find((f) => f.name === fieldName);
  if (!field) {
    return []; // Champ non défini dans le schéma, pas d'erreur
  }

  const context: ValidationContext = {
    entityType,
    existingNodes: options.existingNodes,
    isUpdate: options.isUpdate,
    originalId: options.originalId,
  };

  return validateField(field, { ...fullData, [fieldName]: value }, context);
}

/**
 * Valide une relation entre deux entités
 */
export function validateRelation(
  sourceType: NodeType,
  targetType: NodeType,
  edgeType: string,
  existingNodes?: Map<string, GraphNode>,
  sourceId?: string,
  targetId?: string
): ValidationResult {
  const errors: ValidationError[] = [];

  // Vérifier que le type source accepte cette relation sortante
  const sourceSchema = getEntitySchema(sourceType);
  const typedEdgeType = edgeType as EdgeType;
  if (sourceSchema && !sourceSchema.allowedRelations.outgoing.includes(typedEdgeType)) {
    errors.push({
      field: 'edgeType',
      rule: 'oneOf',
      message: `Le type ${sourceType} n'autorise pas la relation sortante ${edgeType}`,
    });
  }

  // Vérifier que le type cible accepte cette relation entrante
  const targetSchema = getEntitySchema(targetType);
  if (targetSchema && !targetSchema.allowedRelations.incoming.includes(typedEdgeType)) {
    errors.push({
      field: 'edgeType',
      rule: 'oneOf',
      message: `Le type ${targetType} n'autorise pas la relation entrante ${edgeType}`,
    });
  }

  // Vérifier que les nœuds existent
  if (existingNodes) {
    if (sourceId && !existingNodes.has(sourceId)) {
      errors.push({
        field: 'source',
        rule: 'entityRef',
        message: `Le nœud source "${sourceId}" n'existe pas`,
      });
    }
    if (targetId && !existingNodes.has(targetId)) {
      errors.push({
        field: 'target',
        rule: 'entityRef',
        message: `Le nœud cible "${targetId}" n'existe pas`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valide les données avant suppression
 */
export function validateDeletion(
  nodeId: string,
  edges: { source: string; target: string }[],
  options: { cascade?: boolean } = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  // Trouver les relations impactées
  const affectedEdges = edges.filter(
    (e) => e.source === nodeId || e.target === nodeId
  );

  if (affectedEdges.length > 0 && !options.cascade) {
    errors.push({
      field: 'relations',
      rule: 'required',
      message: `Ce nœud a ${affectedEdges.length} relation(s). Utilisez la suppression en cascade ou supprimez d'abord les relations.`,
      value: affectedEdges.length,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formatte les erreurs de validation pour affichage
 */
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map((error) => {
    const fieldLabel = error.field === '_type' ? 'Type' : error.field;
    return `${fieldLabel}: ${error.message}`;
  });
}

/**
 * Groupe les erreurs par champ
 */
export function groupErrorsByField(
  errors: ValidationError[]
): Record<string, ValidationError[]> {
  const grouped: Record<string, ValidationError[]> = {};

  for (const error of errors) {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field].push(error);
  }

  return grouped;
}

/**
 * Vérifie si un email est valide
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Vérifie si une date est dans le futur
 */
export function isDateInFuture(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return date > now;
}

/**
 * Vérifie si une date est dans le passé
 */
export function isDateInPast(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return date < now;
}

// =============================================================================
// Export default
// =============================================================================

export default {
  validateEntity,
  validateSingleField,
  validateRelation,
  validateDeletion,
  formatValidationErrors,
  groupErrorsByField,
  isValidEmail,
  isDateInFuture,
  isDateInPast,
};
