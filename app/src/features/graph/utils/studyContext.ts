/**
 * KG-Oversight - Contexte d'étude pour le styling N1/N2
 *
 * RÈGLE MÉTIER IMPORTANTE :
 * Un sous-traitant n'est PAS intrinsèquement N1 ou N2.
 * Son niveau dépend de l'étude clinique :
 * - ST-004 peut être N1 pour ETU-2023-001
 * - ST-008 peut être N2 via ST-004 pour la même étude
 *
 * Le niveau est stocké dans la relation IMPLIQUE_ST (Étude → SousTraitant)
 */

import type Graph from 'graphology';
import type { SigmaEdgeAttributes } from '@data/types';

// Interface pour la relation IMPLIQUE_ST
export interface ImpliqueST {
  etude_id: string;
  st_id: string;
  niveau: 1 | 2;
  role: string;
  via: string | null;
}

// Extended node attributes pour le contexte
interface ContextNodeAttributes {
  size: number;
  color: string;
  borderColor?: string;
  borderSize?: number;
  opacity?: number;
  contextLevel?: 1 | 2 | null;
  viaNode?: string | null;
  originalColor?: string;
  originalSize?: number;
}

// Stockage des relations IMPLIQUE_ST
let impliqueSTRelations: ImpliqueST[] = [];

// Couleurs pour les niveaux contextuels
export const CONTEXT_COLORS = {
  N1: {
    color: '#10b981',
    borderColor: '#065f46',
    size: 22,
    borderSize: 3,
  },
  N2: {
    color: '#6ee7b7',
    borderColor: '#10b981',
    size: 16,
    borderSize: 2,
  },
  NOT_IN_STUDY: {
    color: '#94a3b8',
    size: 12,
    opacity: 0.3,
  },
  VIA_EDGE: {
    color: '#f59e0b',
    size: 2,
  },
};

/**
 * Initialise les relations IMPLIQUE_ST depuis les données chargées
 */
export function setImpliqueSTData(relations: ImpliqueST[]) {
  impliqueSTRelations = relations;
}

/**
 * Récupère les relations IMPLIQUE_ST
 */
export function getImpliqueSTData(): ImpliqueST[] {
  return impliqueSTRelations;
}

/**
 * Parse les relations IMPLIQUE_ST depuis les edges du graphe
 */
export function parseImpliqueSTFromEdges(
  edges: Map<string, { source: string; target: string; _type: string; niveau?: number; role?: string; via?: string }>
): ImpliqueST[] {
  const relations: ImpliqueST[] = [];

  for (const [, edge] of edges) {
    if (edge._type === 'IMPLIQUE_ST') {
      relations.push({
        etude_id: edge.source,
        st_id: edge.target,
        niveau: (edge.niveau === 2 ? 2 : 1) as 1 | 2,
        role: edge.role ?? '',
        via: edge.via ?? null,
      });
    }
  }

  return relations;
}

/**
 * Applique le contexte d'une étude au graphe
 * - Les ST N1 de l'étude sont mis en évidence (gros, vert foncé)
 * - Les ST N2 de l'étude sont mis en évidence (moyen, vert clair)
 * - Les autres ST sont grisés
 */
export function applyStudyContext<N extends ContextNodeAttributes, E extends SigmaEdgeAttributes>(
  graph: Graph<N, E>,
  studyId: string
): void {
  // Trouver tous les ST impliqués dans cette étude
  const stInStudy = impliqueSTRelations.filter((r) => r.etude_id === studyId);
  const stN1 = new Set(stInStudy.filter((r) => r.niveau === 1).map((r) => r.st_id));
  const stN2 = new Set(stInStudy.filter((r) => r.niveau === 2).map((r) => r.st_id));
  const stN2ViaMap = new Map(
    stInStudy.filter((r) => r.niveau === 2 && r.via).map((r) => [r.st_id, r.via])
  );

  // Appliquer les styles aux nœuds
  graph.forEachNode((nodeId, attrs) => {
    const nodeType = (attrs as any).nodeType;

    if (nodeType !== 'SousTraitant') {
      // Non-ST : opacity normale, mais dimmer si pas l'étude sélectionnée
      if (nodeType === 'EtudeClinique' && nodeId !== studyId) {
        graph.setNodeAttribute(nodeId, 'opacity' as any, 0.4);
      }
      return;
    }

    // Sauvegarder les couleurs originales si pas déjà fait
    if (!attrs.originalColor) {
      graph.setNodeAttribute(nodeId, 'originalColor' as any, attrs.color);
      graph.setNodeAttribute(nodeId, 'originalSize' as any, attrs.size);
    }

    if (stN1.has(nodeId)) {
      // N1 pour cette étude
      graph.mergeNodeAttributes(nodeId, {
        size: CONTEXT_COLORS.N1.size,
        color: CONTEXT_COLORS.N1.color,
        opacity: 1,
        contextLevel: 1,
      } as Partial<N>);
    } else if (stN2.has(nodeId)) {
      // N2 pour cette étude
      graph.mergeNodeAttributes(nodeId, {
        size: CONTEXT_COLORS.N2.size,
        color: CONTEXT_COLORS.N2.color,
        opacity: 1,
        contextLevel: 2,
        viaNode: stN2ViaMap.get(nodeId) ?? null,
      } as Partial<N>);
    } else {
      // ST non impliqué dans cette étude
      graph.mergeNodeAttributes(nodeId, {
        size: CONTEXT_COLORS.NOT_IN_STUDY.size,
        color: CONTEXT_COLORS.NOT_IN_STUDY.color,
        opacity: CONTEXT_COLORS.NOT_IN_STUDY.opacity,
        contextLevel: null,
      } as Partial<N>);
    }
  });

  // Appliquer les styles aux arêtes
  graph.forEachEdge((edgeId, _attrs, source, target) => {
    // Relations IMPLIQUE_ST de cette étude
    if (source === studyId && (stN1.has(target) || stN2.has(target))) {
      const niveau = stN1.has(target) ? 1 : 2;
      graph.mergeEdgeAttributes(edgeId, {
        size: niveau === 1 ? 3 : 2,
        color: niveau === 1 ? CONTEXT_COLORS.N1.color : CONTEXT_COLORS.N2.color,
        hidden: false,
      } as Partial<E>);
    }
    // Relation ST N2 → ST N1 (via)
    else if (stN2ViaMap.get(source) === target || stN2ViaMap.get(target) === source) {
      graph.mergeEdgeAttributes(edgeId, {
        size: CONTEXT_COLORS.VIA_EDGE.size,
        color: CONTEXT_COLORS.VIA_EDGE.color,
        hidden: false,
      } as Partial<E>);
    }
    // Autres relations impliquant l'étude sélectionnée
    else if (source === studyId || target === studyId) {
      graph.setEdgeAttribute(edgeId, 'hidden' as any, false);
    }
    // Relations non liées à l'étude
    else {
      graph.setEdgeAttribute(edgeId, 'hidden' as any, true);
    }
  });
}

/**
 * Réinitialise le contexte d'étude (vue globale)
 */
export function resetStudyContext<N extends ContextNodeAttributes, E extends SigmaEdgeAttributes>(
  graph: Graph<N, E>
): void {
  graph.forEachNode((nodeId, attrs) => {
    const nodeType = (attrs as any).nodeType;

    if (nodeType === 'SousTraitant') {
      // Restaurer les attributs originaux
      const originalColor = attrs.originalColor;
      const originalSize = attrs.originalSize;

      graph.mergeNodeAttributes(nodeId, {
        size: originalSize ?? 18,
        color: originalColor ?? '#10b981',
        opacity: 1,
        contextLevel: null,
        viaNode: null,
      } as Partial<N>);
    } else {
      graph.setNodeAttribute(nodeId, 'opacity' as any, 1);
    }
  });

  graph.forEachEdge((edgeId) => {
    graph.setEdgeAttribute(edgeId, 'hidden' as any, false);
  });
}

/**
 * Obtenir les infos de niveau pour un ST dans une étude donnée
 */
export function getSTLevelInStudy(stId: string, studyId: string): { niveau: 1 | 2; via: string | null } | null {
  const relation = impliqueSTRelations.find(
    (r) => r.st_id === stId && r.etude_id === studyId
  );

  if (!relation) return null;

  return {
    niveau: relation.niveau,
    via: relation.via,
  };
}

/**
 * Obtenir tous les ST impliqués dans une étude avec leurs niveaux
 */
export function getSTsInStudy(studyId: string): Map<string, { niveau: 1 | 2; role: string; via: string | null }> {
  const result = new Map<string, { niveau: 1 | 2; role: string; via: string | null }>();

  for (const relation of impliqueSTRelations) {
    if (relation.etude_id === studyId) {
      result.set(relation.st_id, {
        niveau: relation.niveau,
        role: relation.role,
        via: relation.via,
      });
    }
  }

  return result;
}

/**
 * Obtenir les études dans lesquelles un ST est impliqué
 */
export function getStudiesForST(stId: string): Map<string, { niveau: 1 | 2; role: string; via: string | null }> {
  const result = new Map<string, { niveau: 1 | 2; role: string; via: string | null }>();

  for (const relation of impliqueSTRelations) {
    if (relation.st_id === stId) {
      result.set(relation.etude_id, {
        niveau: relation.niveau,
        role: relation.role,
        via: relation.via,
      });
    }
  }

  return result;
}
