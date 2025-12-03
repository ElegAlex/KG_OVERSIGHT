/**
 * KG-Oversight - Hook pour le drag & drop des nœuds
 * Implémente un drag interactif style Obsidian avec effet élastique
 */

import { useEffect, useRef, useCallback } from 'react';
import type Sigma from 'sigma';
import type Graph from 'graphology';

interface DragState {
  isDragging: boolean;
  draggedNode: string | null;
  startPosition: { x: number; y: number } | null;
  initialNodePositions: Map<string, { x: number; y: number }>;
}

interface UseNodeDragOptions {
  /** Instance Sigma */
  sigma: Sigma | null;
  /** Instance Graphology */
  graph: Graph | null;
  /** IDs des nœuds sélectionnés (pour drag multi-sélection) */
  selectedNodeIds: Set<string>;
  /** Force de l'effet élastique (0 = désactivé, 1 = max) */
  elasticStrength?: number;
  /** Rayon d'influence de l'effet élastique */
  elasticRadius?: number;
  /** Callback quand le drag commence */
  onDragStart?: (nodeId: string) => void;
  /** Callback quand le drag termine */
  onDragEnd?: (nodeId: string) => void;
  /** Activer/désactiver le drag */
  enabled?: boolean;
}

/**
 * Hook pour gérer le drag & drop des nœuds avec effet élastique
 */
export function useNodeDrag({
  sigma,
  graph,
  selectedNodeIds,
  elasticStrength = 0.3,
  elasticRadius = 2,
  onDragStart,
  onDragEnd,
  enabled = true,
}: UseNodeDragOptions) {
  const dragState = useRef<DragState>({
    isDragging: false,
    draggedNode: null,
    startPosition: null,
    initialNodePositions: new Map(),
  });

  // Sauvegarder les positions initiales des nœuds voisins
  const captureInitialPositions = useCallback((nodeId: string) => {
    if (!graph) return;

    const positions = new Map<string, { x: number; y: number }>();

    // Position du nœud principal
    positions.set(nodeId, {
      x: graph.getNodeAttribute(nodeId, 'x'),
      y: graph.getNodeAttribute(nodeId, 'y'),
    });

    // Positions des nœuds sélectionnés (pour drag multi-sélection)
    selectedNodeIds.forEach((id) => {
      if (id !== nodeId && graph.hasNode(id)) {
        positions.set(id, {
          x: graph.getNodeAttribute(id, 'x'),
          y: graph.getNodeAttribute(id, 'y'),
        });
      }
    });

    // Positions des voisins pour l'effet élastique (jusqu'à N niveaux)
    const visited = new Set<string>(positions.keys());
    let frontier = [nodeId];

    for (let level = 0; level < elasticRadius; level++) {
      const nextFrontier: string[] = [];

      for (const currentNode of frontier) {
        graph.forEachNeighbor(currentNode, (neighbor) => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            nextFrontier.push(neighbor);
            positions.set(neighbor, {
              x: graph.getNodeAttribute(neighbor, 'x'),
              y: graph.getNodeAttribute(neighbor, 'y'),
            });
          }
        });
      }

      frontier = nextFrontier;
    }

    dragState.current.initialNodePositions = positions;
  }, [graph, selectedNodeIds, elasticRadius]);

  // Calculer la distance de graphe entre deux nœuds
  const getGraphDistance = useCallback((fromId: string, toId: string): number => {
    if (!graph || fromId === toId) return 0;

    // BFS pour trouver la distance
    const visited = new Set<string>([fromId]);
    let frontier = [fromId];
    let distance = 0;

    while (frontier.length > 0 && distance < elasticRadius + 1) {
      distance++;
      const nextFrontier: string[] = [];

      for (const node of frontier) {
        const neighbors: string[] = [];
        graph.forEachNeighbor(node, (n) => neighbors.push(n));

        for (const neighbor of neighbors) {
          if (neighbor === toId) return distance;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            nextFrontier.push(neighbor);
          }
        }
      }

      frontier = nextFrontier;
    }

    return Infinity;
  }, [graph, elasticRadius]);

  // Appliquer l'effet élastique aux nœuds voisins
  const applyElasticEffect = useCallback((
    draggedNodeId: string,
    deltaX: number,
    deltaY: number
  ) => {
    if (!graph || elasticStrength === 0) return;

    const { initialNodePositions } = dragState.current;

    initialNodePositions.forEach((initialPos, nodeId) => {
      if (nodeId === draggedNodeId) return;

      // Si le nœud est sélectionné, il suit complètement (drag multi-sélection)
      if (selectedNodeIds.has(nodeId)) {
        graph.setNodeAttribute(nodeId, 'x', initialPos.x + deltaX);
        graph.setNodeAttribute(nodeId, 'y', initialPos.y + deltaY);
        return;
      }

      // Calculer la distance de graphe
      const distance = getGraphDistance(draggedNodeId, nodeId);
      if (distance === Infinity || distance > elasticRadius) return;

      // Facteur d'atténuation basé sur la distance (plus loin = moins d'effet)
      // distance 1 = elasticStrength, distance 2 = elasticStrength/2, etc.
      const falloff = elasticStrength / distance;

      // Appliquer le déplacement atténué
      graph.setNodeAttribute(nodeId, 'x', initialPos.x + deltaX * falloff);
      graph.setNodeAttribute(nodeId, 'y', initialPos.y + deltaY * falloff);
    });
  }, [graph, selectedNodeIds, elasticStrength, elasticRadius, getGraphDistance]);

  // Handler: début du drag
  const handleDownNode = useCallback((event: { node: string; event: MouseEvent }) => {
    if (!enabled || !sigma || !graph) return;

    const nodeId = event.node;

    // Capturer la position initiale de la souris
    const mousePos = sigma.viewportToGraph(event.event);

    // Sauvegarder l'état
    dragState.current = {
      isDragging: true,
      draggedNode: nodeId,
      startPosition: mousePos,
      initialNodePositions: new Map(),
    };

    // Capturer les positions initiales
    captureInitialPositions(nodeId);

    // Désactiver le pan de la caméra pendant le drag
    sigma.getCamera().disable();

    // Feedback visuel - curseur grabbing
    const container = sigma.getContainer();
    container.classList.add('dragging');

    // Highlight du nœud
    graph.setNodeAttribute(nodeId, 'highlighted', true);

    onDragStart?.(nodeId);
  }, [enabled, sigma, graph, captureInitialPositions, onDragStart]);

  // Handler: mouvement pendant le drag
  const handleMouseMove = useCallback((event: { event: MouseEvent; x: number; y: number }) => {
    if (!dragState.current.isDragging || !sigma || !graph) return;

    const { draggedNode, startPosition, initialNodePositions } = dragState.current;
    if (!draggedNode || !startPosition) return;

    // Convertir les coordonnées viewport en coordonnées graphe
    const mousePos = sigma.viewportToGraph(event.event);

    // Calculer le delta
    const initialPos = initialNodePositions.get(draggedNode);
    if (!initialPos) return;

    const deltaX = mousePos.x - startPosition.x;
    const deltaY = mousePos.y - startPosition.y;

    // Mettre à jour la position du nœud principal
    graph.setNodeAttribute(draggedNode, 'x', initialPos.x + deltaX);
    graph.setNodeAttribute(draggedNode, 'y', initialPos.y + deltaY);

    // Appliquer l'effet élastique aux voisins
    applyElasticEffect(draggedNode, deltaX, deltaY);

    // Forcer le refresh (Sigma détecte les changements automatiquement, mais au cas où)
    sigma.refresh();
  }, [sigma, graph, applyElasticEffect]);

  // Handler: fin du drag
  const handleMouseUp = useCallback((_event?: unknown) => {
    if (!dragState.current.isDragging || !sigma || !graph) return;

    const { draggedNode } = dragState.current;

    // Réactiver le pan de la caméra
    sigma.getCamera().enable();

    // Retirer le curseur grabbing
    const container = sigma.getContainer();
    container.classList.remove('dragging');

    // Retirer le highlight
    if (draggedNode && graph.hasNode(draggedNode)) {
      graph.setNodeAttribute(draggedNode, 'highlighted', false);
    }

    // Callback
    if (draggedNode) {
      onDragEnd?.(draggedNode);
    }

    // Reset l'état
    dragState.current = {
      isDragging: false,
      draggedNode: null,
      startPosition: null,
      initialNodePositions: new Map(),
    };
  }, [sigma, graph, onDragEnd]);

  // Handler: quitter le canvas annule le drag
  const handleMouseLeave = useCallback(() => {
    if (dragState.current.isDragging) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  // Enregistrer les événements Sigma + DOM
  useEffect(() => {
    if (!sigma || !enabled) return;

    // Événements Sigma
    // downNode: clic enfoncé sur un nœud
    // moveBody: mouvement de la souris sur le canvas
    sigma.on('downNode', handleDownNode as any);
    sigma.on('moveBody', handleMouseMove as any);

    // Utiliser les événements DOM pour mouseup (plus fiable)
    // Car l'utilisateur peut relâcher la souris n'importe où
    const onMouseUp = () => handleMouseUp();
    document.addEventListener('mouseup', onMouseUp);

    // Cleanup
    return () => {
      sigma.off('downNode', handleDownNode as any);
      sigma.off('moveBody', handleMouseMove as any);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [sigma, enabled, handleDownNode, handleMouseMove, handleMouseUp]);

  return {
    isDragging: dragState.current.isDragging,
    draggedNode: dragState.current.draggedNode,
  };
}

export default useNodeDrag;
