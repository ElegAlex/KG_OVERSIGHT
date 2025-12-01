/**
 * KG-Oversight - ID Generator Service
 * Génération d'identifiants uniques pour les entités du Knowledge Graph
 *
 * Format: {PREFIX}-{YYYYMMDD}-{SEQ}
 * Exemple: ST-20251130-001, AUD-20251130-042
 */

import type { NodeType } from '@data/types';
import { getEntitySchema } from '../constants/entitySchemas';

// =============================================================================
// Types
// =============================================================================

interface SequenceState {
  date: string;           // Format YYYYMMDD
  counters: Map<string, number>;  // prefix -> count
}

interface GeneratedId {
  id: string;
  prefix: string;
  date: string;
  sequence: number;
}

// =============================================================================
// État du générateur
// =============================================================================

// État des séquences (en mémoire, réinitialisé chaque jour)
let sequenceState: SequenceState = {
  date: '',
  counters: new Map(),
};

// Cache des IDs existants pour garantir l'unicité
const existingIds = new Set<string>();

// =============================================================================
// Fonctions utilitaires
// =============================================================================

/**
 * Formate la date courante en YYYYMMDD
 */
function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Formate un numéro de séquence avec padding (ex: 1 -> "001")
 */
function formatSequence(seq: number, padding: number = 3): string {
  return String(seq).padStart(padding, '0');
}

/**
 * Parse un ID existant pour extraire ses composants
 */
export function parseId(id: string): GeneratedId | null {
  // Format attendu: PREFIX-YYYYMMDD-SEQ
  const regex = /^([A-Z]+)-(\d{8})-(\d+)$/;
  const match = id.match(regex);

  if (!match) {
    // Tenter un format alternatif sans date (legacy)
    const legacyRegex = /^([A-Z]+)-(\d+)$/;
    const legacyMatch = id.match(legacyRegex);
    if (legacyMatch) {
      return {
        id,
        prefix: legacyMatch[1],
        date: '',
        sequence: parseInt(legacyMatch[2], 10),
      };
    }
    return null;
  }

  return {
    id,
    prefix: match[1],
    date: match[2],
    sequence: parseInt(match[3], 10),
  };
}

/**
 * Vérifie si un ID respecte le format attendu
 */
export function isValidIdFormat(id: string): boolean {
  // Format standard: PREFIX-YYYYMMDD-SEQ
  const standardRegex = /^[A-Z]+-\d{8}-\d{3,}$/;
  // Format legacy: PREFIX-SEQ
  const legacyRegex = /^[A-Z]+-\d+$/;

  return standardRegex.test(id) || legacyRegex.test(id);
}

/**
 * Vérifie si un ID personnalisé est valide et disponible
 */
export function validateCustomId(
  customId: string,
  entityType: NodeType
): { valid: boolean; error?: string } {
  // Vérifier le format
  if (!customId || customId.trim().length === 0) {
    return { valid: false, error: 'L\'identifiant ne peut pas être vide' };
  }

  // Longueur minimale et maximale
  if (customId.length < 3) {
    return { valid: false, error: 'L\'identifiant doit contenir au moins 3 caractères' };
  }

  if (customId.length > 50) {
    return { valid: false, error: 'L\'identifiant ne peut pas dépasser 50 caractères' };
  }

  // Caractères autorisés: lettres, chiffres, tirets, underscores
  const validCharsRegex = /^[A-Za-z0-9_-]+$/;
  if (!validCharsRegex.test(customId)) {
    return {
      valid: false,
      error: 'L\'identifiant ne peut contenir que des lettres, chiffres, tirets et underscores'
    };
  }

  // Vérifier que le préfixe correspond au type d'entité (recommandation, pas obligation)
  const schema = getEntitySchema(entityType);
  if (schema) {
    const expectedPrefix = schema.idPrefix;
    if (!customId.toUpperCase().startsWith(expectedPrefix)) {
      // Warning mais pas erreur - on permet des IDs personnalisés
      console.warn(
        `ID personnalisé "${customId}" ne commence pas par le préfixe attendu "${expectedPrefix}" pour le type ${entityType}`
      );
    }
  }

  // Vérifier l'unicité
  if (existingIds.has(customId)) {
    return { valid: false, error: `L'identifiant "${customId}" existe déjà` };
  }

  return { valid: true };
}

// =============================================================================
// Fonctions principales
// =============================================================================

/**
 * Génère un nouvel ID unique pour un type d'entité
 */
export function generateId(entityType: NodeType): string {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    throw new Error(`Type d'entité inconnu: ${entityType}`);
  }

  const prefix = schema.idPrefix;
  const currentDate = getCurrentDateString();

  // Réinitialiser les compteurs si le jour a changé
  if (sequenceState.date !== currentDate) {
    sequenceState = {
      date: currentDate,
      counters: new Map(),
    };
  }

  // Obtenir et incrémenter le compteur pour ce préfixe
  const currentCount = sequenceState.counters.get(prefix) || 0;
  const newCount = currentCount + 1;
  sequenceState.counters.set(prefix, newCount);

  // Construire l'ID
  const id = `${prefix}-${currentDate}-${formatSequence(newCount)}`;

  // Vérifier l'unicité (au cas où)
  if (existingIds.has(id)) {
    // Collision rare - réessayer avec un compteur plus élevé
    return generateId(entityType);
  }

  // Enregistrer l'ID
  existingIds.add(id);

  return id;
}

/**
 * Génère plusieurs IDs en batch
 */
export function generateIds(entityType: NodeType, count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(generateId(entityType));
  }
  return ids;
}

/**
 * Enregistre un ID existant (lors de l'import ou chargement)
 * Met à jour les compteurs si nécessaire
 */
export function registerExistingId(id: string): void {
  existingIds.add(id);

  // Mettre à jour le compteur si l'ID est du format standard
  const parsed = parseId(id);
  if (parsed && parsed.date) {
    const currentDate = getCurrentDateString();

    // Si l'ID est de la date courante, s'assurer que le compteur est à jour
    if (parsed.date === currentDate) {
      const currentCount = sequenceState.counters.get(parsed.prefix) || 0;
      if (parsed.sequence >= currentCount) {
        sequenceState.counters.set(parsed.prefix, parsed.sequence);
      }
    }
  }
}

/**
 * Enregistre plusieurs IDs existants (batch)
 */
export function registerExistingIds(ids: string[]): void {
  ids.forEach(registerExistingId);
}

/**
 * Vérifie si un ID existe déjà
 */
export function idExists(id: string): boolean {
  return existingIds.has(id);
}

/**
 * Libère un ID (après suppression d'une entité)
 */
export function releaseId(id: string): void {
  existingIds.delete(id);
}

/**
 * Libère plusieurs IDs
 */
export function releaseIds(ids: string[]): void {
  ids.forEach(releaseId);
}

/**
 * Réinitialise complètement le générateur
 * À utiliser lors d'un rechargement complet des données
 */
export function resetIdGenerator(): void {
  sequenceState = {
    date: '',
    counters: new Map(),
  };
  existingIds.clear();
}

/**
 * Synchronise le générateur avec les IDs existants dans le graphe
 */
export function syncWithExistingNodes(nodeIds: string[]): void {
  resetIdGenerator();
  registerExistingIds(nodeIds);
}

// =============================================================================
// Statistiques et debug
// =============================================================================

/**
 * Retourne des statistiques sur les IDs générés
 */
export function getIdGeneratorStats(): {
  totalRegisteredIds: number;
  currentDate: string;
  countersByPrefix: Record<string, number>;
} {
  const countersByPrefix: Record<string, number> = {};
  sequenceState.counters.forEach((count, prefix) => {
    countersByPrefix[prefix] = count;
  });

  return {
    totalRegisteredIds: existingIds.size,
    currentDate: sequenceState.date,
    countersByPrefix,
  };
}

/**
 * Suggère un ID pour un type donné (preview sans réservation)
 */
export function suggestNextId(entityType: NodeType): string {
  const schema = getEntitySchema(entityType);
  if (!schema) {
    return '';
  }

  const prefix = schema.idPrefix;
  const currentDate = getCurrentDateString();

  // Calculer le prochain numéro de séquence
  let nextSeq = 1;
  if (sequenceState.date === currentDate) {
    nextSeq = (sequenceState.counters.get(prefix) || 0) + 1;
  }

  return `${prefix}-${currentDate}-${formatSequence(nextSeq)}`;
}

// =============================================================================
// Export default
// =============================================================================

export default {
  generateId,
  generateIds,
  registerExistingId,
  registerExistingIds,
  idExists,
  releaseId,
  releaseIds,
  resetIdGenerator,
  syncWithExistingNodes,
  parseId,
  isValidIdFormat,
  validateCustomId,
  suggestNextId,
  getIdGeneratorStats,
};
