/**
 * KG-Oversight - Configuration visuelle des nœuds
 * Couleurs, formes et styles par type de nœud
 * Palette harmonisée avec distinction N1/N2
 */

import type { NodeType, Criticite, NiveauAlerte, ScoreRisque, CategorieStatut } from '@data/types';

// =============================================================================
// Palette couleurs harmonisée (bg + border)
// =============================================================================

export const NODE_COLORS: Record<NodeType, { bg: string; border: string }> = {
  // Études - Indigo (hub central)
  EtudeClinique: { bg: '#6366f1', border: '#4338ca' },

  // Sous-traitants - Emerald (différenciation N1/N2 dans getNodeColor)
  SousTraitant: { bg: '#10b981', border: '#065f46' },

  // Contrats et accords - Sky/Cyan
  Contrat: { bg: '#0ea5e9', border: '#0369a1' },
  AccordQualite: { bg: '#06b6d4', border: '#0e7490' },

  // Audits et inspections - Amber/Red
  Audit: { bg: '#f59e0b', border: '#b45309' },
  Inspection: { bg: '#ef4444', border: '#b91c1c' },

  // Findings - Gradation rouge/orange/jaune selon criticité
  Finding: { bg: '#f97316', border: '#c2410c' },

  // Événements qualité - Pink
  EvenementQualite: { bg: '#ec4899', border: '#be185d' },

  // Décisions et évaluations
  Decision: { bg: '#64748b', border: '#334155' },
  EvaluationRisque: { bg: '#8b5cf6', border: '#6d28d9' },
  ReunionQualite: { bg: '#14b8a6', border: '#0f766e' },

  // Domaines et contexte
  DomaineService: { bg: '#84cc16', border: '#4d7c0f' },
  ContexteReglementaire: { bg: '#78716c', border: '#44403c' },

  // Alertes et événements
  Alerte: { bg: '#ef4444', border: '#7f1d1d' },
  Evenement: { bg: '#a855f7', border: '#7e22ce' },

  // KQI
  KQI: { bg: '#84cc16', border: '#4d7c0f' },
};

// Couleurs spéciales pour sous-traitants N1/N2
export const ST_COLORS = {
  N1: { bg: '#10b981', border: '#065f46' },      // Emerald foncé
  N2: { bg: '#6ee7b7', border: '#10b981' },      // Emerald clair
};

// Couleurs par criticité pour les findings
export const FINDING_COLORS: Record<string, { bg: string; border: string }> = {
  Critique: { bg: '#dc2626', border: '#991b1b' },
  Majeur: { bg: '#f97316', border: '#c2410c' },
  Standard: { bg: '#fbbf24', border: '#b45309' },
  Mineur: { bg: '#fde047', border: '#ca8a04' },
  Observation: { bg: '#a3e635', border: '#65a30d' },
};

// =============================================================================
// Libellés français pour les types de nœuds
// =============================================================================

export const NODE_LABELS: Record<NodeType, string> = {
  SousTraitant: 'Sous-Traitant',
  Contrat: 'Contrat',
  AccordQualite: 'Accord Qualité',
  Audit: 'Audit',
  Inspection: 'Inspection',
  Finding: 'Finding',
  EvenementQualite: 'Événement Qualité',
  Decision: 'Décision',
  EvaluationRisque: 'Évaluation Risque',
  ReunionQualite: 'Réunion Qualité',
  EtudeClinique: 'Étude Clinique',
  DomaineService: 'Domaine de Service',
  ContexteReglementaire: 'Contexte Réglementaire',
  Alerte: 'Alerte',
  Evenement: 'Événement',
  KQI: 'KQI',
};

// =============================================================================
// Tailles par défaut des nœuds (augmentées pour meilleure visibilité)
// =============================================================================

export const NODE_SIZES: Record<NodeType, number> = {
  EtudeClinique: 22,      // Hub central - très visible
  SousTraitant: 18,       // Entités principales (N1=20, N2=14 via getNodeSize)
  Contrat: 12,
  AccordQualite: 12,
  Audit: 16,
  Inspection: 16,
  Finding: 12,
  EvenementQualite: 14,
  Decision: 12,
  EvaluationRisque: 14,
  ReunionQualite: 10,
  DomaineService: 10,
  ContexteReglementaire: 10,
  Alerte: 14,
  Evenement: 10,
  KQI: 8,
};

// =============================================================================
// Couleurs de criticité
// =============================================================================

export const CRITICITE_COLORS: Record<Criticite, string> = {
  Critique: '#DC2626',
  Majeur: '#F97316',
  Standard: '#3B82F6',
  Mineur: '#6B7280',
  Observation: '#84CC16',
};

// =============================================================================
// Couleurs des niveaux d'alerte
// =============================================================================

export const ALERTE_COLORS: Record<NiveauAlerte, string> = {
  HAUTE: '#DC2626',
  MOYENNE: '#F59E0B',
  BASSE: '#3B82F6',
};

// =============================================================================
// Couleurs des scores de risque
// =============================================================================

export const RISQUE_COLORS: Record<ScoreRisque, string> = {
  Low: '#22C55E',
  Medium: '#F59E0B',
  High: '#DC2626',
};

// =============================================================================
// Couleurs et libellés des catégories de statuts
// =============================================================================

export const STATUT_COLORS: Record<CategorieStatut, string> = {
  actif: '#22C55E',      // Vert - éléments actifs
  en_cours: '#3B82F6',   // Bleu - en traitement
  planifie: '#8B5CF6',   // Violet - futur
  cloture: '#6B7280',    // Gris - terminé
  archive: '#78716C',    // Gris foncé - archivé
};

export const STATUT_LABELS: Record<CategorieStatut, string> = {
  actif: 'Actif',
  en_cours: 'En cours',
  planifie: 'Planifié',
  cloture: 'Clôturé',
  archive: 'Archivé',
};

// =============================================================================
// Relations importantes (épaisseur augmentée)
// =============================================================================

export const IMPORTANT_RELATIONS = new Set([
  'IMPLIQUE_ST',
  'EST_SOUS_TRAITANT_DE',
  'A_ETE_AUDITE_PAR',
  'GENERE_FINDING',
]);

// =============================================================================
// Utilitaires
// =============================================================================

interface NodeData {
  _type: NodeType;
  niveau_actuel?: number;  // DEPRECATED: utiliser contextLevel à la place
  contextLevel?: 1 | 2 | null;  // Niveau contextuel (dépend de l'étude)
  criticite?: Criticite | '';
}

/**
 * Obtient la couleur d'un nœud
 *
 * IMPORTANT pour les SousTraitants :
 * - Le niveau N1/N2 dépend du CONTEXTE de l'étude, pas d'une propriété intrinsèque
 * - Utiliser contextLevel (défini par studyContext.ts) plutôt que niveau_actuel
 * - Sans contexte d'étude, tous les ST ont la même couleur par défaut
 */
export function getNodeColor(type: NodeType, nodeData?: NodeData): string {
  // Sous-traitants : distinction N1/N2 selon le CONTEXTE
  if (type === 'SousTraitant') {
    // Priorité au niveau contextuel (défini par l'étude sélectionnée)
    if (nodeData?.contextLevel === 1) {
      return ST_COLORS.N1.bg;
    }
    if (nodeData?.contextLevel === 2) {
      return ST_COLORS.N2.bg;
    }
    // Fallback sur niveau_actuel si pas de contexte (compatibilité)
    if (nodeData?.niveau_actuel) {
      return nodeData.niveau_actuel === 1 ? ST_COLORS.N1.bg : ST_COLORS.N2.bg;
    }
    // Sans contexte : couleur par défaut
    return NODE_COLORS.SousTraitant.bg;
  }

  // Findings : couleur selon criticité
  if (type === 'Finding' && nodeData?.criticite) {
    const critColor = FINDING_COLORS[nodeData.criticite];
    if (critColor) return critColor.bg;
  }

  return NODE_COLORS[type]?.bg ?? '#6B7280';
}

export function getNodeBorderColor(type: NodeType, nodeData?: NodeData): string {
  if (type === 'SousTraitant') {
    if (nodeData?.contextLevel === 1) {
      return ST_COLORS.N1.border;
    }
    if (nodeData?.contextLevel === 2) {
      return ST_COLORS.N2.border;
    }
    if (nodeData?.niveau_actuel) {
      return nodeData.niveau_actuel === 1 ? ST_COLORS.N1.border : ST_COLORS.N2.border;
    }
    return NODE_COLORS.SousTraitant.border;
  }

  if (type === 'Finding' && nodeData?.criticite) {
    const critColor = FINDING_COLORS[nodeData.criticite];
    if (critColor) return critColor.border;
  }

  return NODE_COLORS[type]?.border ?? '#374151';
}

export function getNodeLabel(type: NodeType): string {
  return NODE_LABELS[type] ?? type;
}

export function getNodeSize(type: NodeType, nodeData?: NodeData): number {
  // Sous-traitants : taille selon le CONTEXTE
  if (type === 'SousTraitant') {
    if (nodeData?.contextLevel === 1) return 22;
    if (nodeData?.contextLevel === 2) return 16;
    if (nodeData?.niveau_actuel) {
      return nodeData.niveau_actuel === 1 ? 20 : 14;
    }
    return NODE_SIZES.SousTraitant;
  }

  return NODE_SIZES[type] ?? 12;
}

export function getCriticiteColor(criticite: Criticite | undefined): string {
  return criticite ? CRITICITE_COLORS[criticite] : '#6B7280';
}

export function getRisqueColor(score: ScoreRisque | undefined): string {
  return score ? RISQUE_COLORS[score] : '#6B7280';
}

export function getEdgeSize(relationType: string): number {
  return IMPORTANT_RELATIONS.has(relationType) ? 3 : 1.5;
}

export function getEdgeColor(sourceColor: string, relationType: string): string {
  // Relations importantes : couleur source avec opacité
  if (IMPORTANT_RELATIONS.has(relationType)) {
    return adjustColorOpacity(sourceColor, 0.7);
  }
  return '#64748b';
}

// Ajuster l'opacité d'une couleur hex
function adjustColorOpacity(hexColor: string, opacity: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
