/**
 * KG-Oversight - Service de layouts pour le graphe
 * Gère les différents algorithmes de positionnement des nœuds
 */

import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { circular, random } from 'graphology-layout';
import dagre from 'dagre';

export type LayoutType = 'forceAtlas2' | 'dagre' | 'radial' | 'circular' | 'random';

export interface LayoutOptions {
  /** Type de layout à appliquer */
  type: LayoutType;
  /** Nœud central pour le layout radial */
  centerNodeId?: string;
  /** Direction pour le layout dagre */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  /** Espacement entre les nœuds */
  nodeSpacing?: number;
  /** Espacement entre les rangs (dagre) */
  rankSpacing?: number;
  /** Callback de progression */
  onProgress?: (progress: number) => void;
}

const DEFAULT_OPTIONS: Partial<LayoutOptions> = {
  direction: 'TB',
  nodeSpacing: 50,
  rankSpacing: 100,
};

/**
 * Applique le layout ForceAtlas2
 */
function applyForceAtlas2(graph: Graph, iterations = 100): void {
  // Pré-positionner si pas de positions existantes
  let hasPositions = false;
  graph.forEachNode((node) => {
    if (graph.getNodeAttribute(node, 'x') !== undefined) {
      hasPositions = true;
    }
  });

  if (!hasPositions) {
    circular.assign(graph, { scale: 300 });
  }

  forceAtlas2.assign(graph, {
    iterations,
    settings: {
      gravity: 0.5,
      scalingRatio: 15,
      strongGravityMode: false,
      slowDown: 2,
      barnesHutOptimize: graph.order > 100,
      barnesHutTheta: 0.5,
      adjustSizes: true,
      linLogMode: false,
      outboundAttractionDistribution: true,
    },
  });
}

/**
 * Applique le layout hiérarchique Dagre
 */
function applyDagre(
  graph: Graph,
  direction: 'TB' | 'BT' | 'LR' | 'RL' = 'TB',
  nodeSpacing = 50,
  rankSpacing = 100
): void {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 50,
    marginy: 50,
  });

  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Ajouter les nœuds avec leurs dimensions
  graph.forEachNode((nodeId, attrs) => {
    const size = (attrs.size as number) || 10;
    dagreGraph.setNode(nodeId, {
      width: size * 2,
      height: size * 2,
    });
  });

  // Ajouter les arêtes
  graph.forEachEdge((_, __, source, target) => {
    dagreGraph.setEdge(source, target);
  });

  // Calculer le layout
  dagre.layout(dagreGraph);

  // Appliquer les positions au graphe
  dagreGraph.nodes().forEach((nodeId) => {
    const node = dagreGraph.node(nodeId);
    if (node && graph.hasNode(nodeId)) {
      graph.setNodeAttribute(nodeId, 'x', node.x);
      graph.setNodeAttribute(nodeId, 'y', node.y);
    }
  });
}

/**
 * Applique le layout radial centré sur un nœud
 */
function applyRadial(graph: Graph, centerNodeId?: string, scale = 300): void {
  const center = centerNodeId && graph.hasNode(centerNodeId) ? centerNodeId : null;

  if (!center) {
    // Pas de centre défini : layout circulaire simple
    circular.assign(graph, { scale });
    return;
  }

  // Calculer les distances depuis le centre (BFS)
  const distances = new Map<string, number>();
  const queue: string[] = [center];
  distances.set(center, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current)!;

    graph.forEachNeighbor(current, (neighbor) => {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    });
  }

  // Nœuds non connectés au centre
  graph.forEachNode((node) => {
    if (!distances.has(node)) {
      distances.set(node, Infinity);
    }
  });

  // Grouper les nœuds par distance
  const levels = new Map<number, string[]>();
  let maxDistance = 0;

  for (const [node, dist] of distances) {
    if (dist === Infinity) continue;
    maxDistance = Math.max(maxDistance, dist);
    const level = levels.get(dist) || [];
    level.push(node);
    levels.set(dist, level);
  }

  // Positionner le centre
  graph.setNodeAttribute(center, 'x', 0);
  graph.setNodeAttribute(center, 'y', 0);

  // Positionner les autres nœuds en cercles concentriques
  const ringSpacing = scale / (maxDistance + 1);

  for (let dist = 1; dist <= maxDistance; dist++) {
    const nodesAtLevel = levels.get(dist) || [];
    const radius = dist * ringSpacing;
    const angleStep = (2 * Math.PI) / nodesAtLevel.length;

    nodesAtLevel.forEach((nodeId, index) => {
      const angle = index * angleStep - Math.PI / 2;
      graph.setNodeAttribute(nodeId, 'x', Math.cos(angle) * radius);
      graph.setNodeAttribute(nodeId, 'y', Math.sin(angle) * radius);
    });
  }

  // Positionner les nœuds déconnectés en périphérie
  const disconnected = Array.from(distances.entries())
    .filter(([, d]) => d === Infinity)
    .map(([n]) => n);

  if (disconnected.length > 0) {
    const outerRadius = (maxDistance + 2) * ringSpacing;
    const angleStep = (2 * Math.PI) / disconnected.length;

    disconnected.forEach((nodeId, index) => {
      const angle = index * angleStep;
      graph.setNodeAttribute(nodeId, 'x', Math.cos(angle) * outerRadius);
      graph.setNodeAttribute(nodeId, 'y', Math.sin(angle) * outerRadius);
    });
  }
}

/**
 * Applique le layout circulaire
 */
function applyCircular(graph: Graph, scale = 300): void {
  circular.assign(graph, { scale });
}

/**
 * Applique le layout aléatoire
 */
function applyRandom(graph: Graph, scale = 500): void {
  random.assign(graph, { scale });
}

/**
 * Applique un layout au graphe
 */
export function applyLayout(graph: Graph, options: LayoutOptions): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  switch (opts.type) {
    case 'forceAtlas2':
      applyForceAtlas2(graph);
      break;
    case 'dagre':
      applyDagre(graph, opts.direction, opts.nodeSpacing, opts.rankSpacing);
      break;
    case 'radial':
      applyRadial(graph, opts.centerNodeId);
      break;
    case 'circular':
      applyCircular(graph);
      break;
    case 'random':
      applyRandom(graph);
      break;
  }
}

/**
 * Obtient les informations sur les layouts disponibles
 */
export function getLayoutInfo(type: LayoutType): {
  name: string;
  description: string;
  icon: string;
} {
  const layouts: Record<LayoutType, { name: string; description: string; icon: string }> = {
    forceAtlas2: {
      name: 'Force Atlas',
      description: 'Layout organique basé sur les forces',
      icon: 'scatter-chart',
    },
    dagre: {
      name: 'Hiérarchique',
      description: 'Organisation en niveaux (études → ST)',
      icon: 'git-branch',
    },
    radial: {
      name: 'Radial',
      description: 'Cercles concentriques depuis un nœud central',
      icon: 'target',
    },
    circular: {
      name: 'Circulaire',
      description: 'Disposition en cercle',
      icon: 'circle',
    },
    random: {
      name: 'Aléatoire',
      description: 'Positions aléatoires',
      icon: 'shuffle',
    },
  };

  return layouts[type];
}

export const LAYOUT_TYPES: LayoutType[] = ['forceAtlas2', 'dagre', 'radial', 'circular'];

export default {
  applyLayout,
  getLayoutInfo,
  LAYOUT_TYPES,
};
