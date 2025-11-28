/**
 * KG-Oversight - Composant principal de visualisation du graphe
 * Utilise Sigma.js v3 avec graphology
 * Améliorations UX : relations visibles, distinction N1/N2, hover highlight
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  filteredNodesAtom,
  filteredEdgesAtom,
  selectedNodeIdsAtom,
  hoveredNodeIdAtom,
  highlightedNodeIdsAtom,
  focusedNodeIdAtom,
  graphViewModeAtom,
  allNodesAtom,
  allEdgesAtom,
  selectedStudyIdAtom,
  kqiDataAtom,
} from '@shared/stores/selectionAtoms';
import {
  getNodeColor,
  getNodeSize,
  getEdgeSize,
  IMPORTANT_RELATIONS,
} from '@shared/utils/nodeStyles';
import {
  setImpliqueSTData,
  parseImpliqueSTFromEdges,
  applyStudyContext,
  resetStudyContext,
} from '../utils/studyContext';
import { openKQIPanelForSTAtom } from '@features/kqi';
import { aggregateAllSTsKQI, getKQIStatusColor } from '@features/kqi';
import { GraphTooltip } from './GraphTooltip';
import type { SigmaNodeAttributes, SigmaEdgeAttributes, GraphNode, KQI } from '@data/types';

interface GraphCanvasProps {
  className?: string;
}

// Extended attributes pour le hover et KQI
interface ExtendedNodeAttributes extends SigmaNodeAttributes {
  originalColor?: string;
  originalSize?: number;
  kqiStatus?: 'good' | 'warning' | 'critical' | null;
  kqiAlertCount?: number;
}

export function GraphCanvas({ className = '' }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph<ExtendedNodeAttributes, SigmaEdgeAttributes> | null>(null);

  // État global
  const filteredNodes = useAtomValue(filteredNodesAtom);
  const filteredEdges = useAtomValue(filteredEdgesAtom);
  const allNodes = useAtomValue(allNodesAtom);
  const allEdges = useAtomValue(allEdgesAtom);
  const [selectedNodeIds, setSelectedNodeIds] = useAtom(selectedNodeIdsAtom);
  const setHoveredNodeId = useSetAtom(hoveredNodeIdAtom);
  const hoveredNodeId = useAtomValue(hoveredNodeIdAtom);
  const highlightedNodeIds = useAtomValue(highlightedNodeIdsAtom);
  const [focusedNodeId, setFocusedNodeId] = useAtom(focusedNodeIdAtom);
  const [graphViewMode, setGraphViewMode] = useAtom(graphViewModeAtom);
  const [selectedStudyId, setSelectedStudyId] = useAtom(selectedStudyIdAtom);
  const kqiData = useAtomValue(kqiDataAtom) as KQI[];
  const openKQIPanelForST = useSetAtom(openKQIPanelForSTAtom);

  // État local
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Calculer les agrégations KQI pour tous les ST
  const kqiAggregations = useMemo(() => {
    const stIds: string[] = [];
    for (const [id, node] of allNodes) {
      if (node._type === 'SousTraitant') {
        stIds.push(id);
      }
    }
    return aggregateAllSTsKQI(kqiData, stIds);
  }, [allNodes, kqiData]);

  // Pré-positionner les études en cercle pour un meilleur layout
  const prePositionStudies = useCallback((graph: Graph) => {
    const studies = graph.filterNodes((_, attrs) => attrs.nodeType === 'EtudeClinique');
    const studyCount = studies.length;
    if (studyCount === 0) return;

    const radius = 400;
    studies.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / studyCount - Math.PI / 2;
      graph.setNodeAttribute(id, 'x', Math.cos(angle) * radius);
      graph.setNodeAttribute(id, 'y', Math.sin(angle) * radius);
    });
  }, []);

  // Appliquer le layout ForceAtlas2
  const applyLayout = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || graph.order === 0) return;

    setIsLayoutRunning(true);

    // Pré-positionner les études
    prePositionStudies(graph);

    // Appliquer ForceAtlas2
    forceAtlas2.assign(graph, {
      iterations: 150,
      settings: {
        gravity: 0.5,
        scalingRatio: 15,
        strongGravityMode: false,
        slowDown: 2,
        barnesHutOptimize: graph.order > 50,
        barnesHutTheta: 0.5,
        adjustSizes: true,
        linLogMode: false,
        outboundAttractionDistribution: true,
      },
    });

    sigmaRef.current?.refresh();
    setIsLayoutRunning(false);
  }, [prePositionStudies]);

  // Highlight des voisins au hover
  const highlightNeighbors = useCallback((nodeId: string | null) => {
    const graph = graphRef.current;
    const sigma = sigmaRef.current;
    if (!graph || !sigma) return;

    if (!nodeId) {
      // Restaurer tous les nœuds et arêtes
      graph.forEachNode((n) => {
        const originalColor = graph.getNodeAttribute(n, 'originalColor');
        const originalSize = graph.getNodeAttribute(n, 'originalSize');
        if (originalColor) graph.setNodeAttribute(n, 'color', originalColor);
        if (originalSize) graph.setNodeAttribute(n, 'size', originalSize);
      });
      graph.forEachEdge((e) => {
        graph.setEdgeAttribute(e, 'hidden', false);
      });
    } else {
      // Obtenir les voisins
      const neighbors = new Set<string>();
      neighbors.add(nodeId);
      graph.forEachNeighbor(nodeId, (neighbor) => {
        neighbors.add(neighbor);
      });

      // Dimmer les nœuds non-voisins
      graph.forEachNode((n) => {
        const currentColor = graph.getNodeAttribute(n, 'color');
        const currentSize = graph.getNodeAttribute(n, 'size');

        // Sauvegarder les valeurs originales
        if (!graph.getNodeAttribute(n, 'originalColor')) {
          graph.setNodeAttribute(n, 'originalColor', currentColor);
          graph.setNodeAttribute(n, 'originalSize', currentSize);
        }

        if (!neighbors.has(n)) {
          // Dimmer : couleur grise et taille réduite
          graph.setNodeAttribute(n, 'color', '#e2e8f0');
          graph.setNodeAttribute(n, 'size', (currentSize ?? 10) * 0.7);
        } else if (n === nodeId) {
          // Nœud survolé : agrandir
          graph.setNodeAttribute(n, 'size', (currentSize ?? 10) * 1.3);
        }
      });

      // Masquer les arêtes non connectées au nœud survolé
      graph.forEachEdge((e, _, source, target) => {
        const connected = source === nodeId || target === nodeId;
        graph.setEdgeAttribute(e, 'hidden', !connected);
      });
    }

    sigma.refresh();
  }, []);

  // Refs pour les valeurs courantes (évite les dépendances dans useEffect)
  const selectedNodeIdsRef = useRef(selectedNodeIds);
  const hoveredNodeIdRef = useRef(hoveredNodeId);
  const kqiAggregationsRef = useRef(kqiAggregations);

  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    selectedNodeIdsRef.current = selectedNodeIds;
  }, [selectedNodeIds]);

  useEffect(() => {
    hoveredNodeIdRef.current = hoveredNodeId;
  }, [hoveredNodeId]);

  useEffect(() => {
    kqiAggregationsRef.current = kqiAggregations;
  }, [kqiAggregations]);

  // Initialisation du graphe Sigma (une seule fois)
  useEffect(() => {
    if (!containerRef.current) return;

    // Créer le graphe graphology
    const graph = new Graph<ExtendedNodeAttributes, SigmaEdgeAttributes>();
    graphRef.current = graph;

    // Créer l'instance Sigma avec settings améliorés
    const sigma = new Sigma(graph, containerRef.current, {
      // Rendu des labels - seuil dynamique selon zoom
      renderLabels: true,
      labelRenderedSizeThreshold: 8,
      labelDensity: 0.5,
      labelFont: 'Inter, system-ui, sans-serif',
      labelSize: 11,
      labelWeight: '500',
      labelColor: { color: '#1e293b' },

      // Couleurs par défaut
      defaultNodeColor: '#6B7280',
      defaultEdgeColor: '#94a3b8',
      defaultNodeType: 'circle',

      // Camera
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      stagePadding: 80,
      allowInvalidContainer: true,

      // Node reducers pour styling dynamique - labels conditionnels
      nodeReducer: (node, data) => {
        const res = { ...data };
        const nodeType = data.nodeType;

        // Toujours afficher le label pour :
        // 1. Nœuds sélectionnés
        // 2. Nœud survolé
        // 3. Études cliniques (hub central)
        // 4. Nœuds mis en évidence
        if (
          selectedNodeIdsRef.current.has(node) ||
          node === hoveredNodeIdRef.current ||
          nodeType === 'EtudeClinique' ||
          data.highlighted
        ) {
          res.forceLabel = true;
        }

        // Masquer le label pour les petits nœuds sauf si importants
        const importantTypes = new Set(['SousTraitant', 'Audit', 'Inspection', 'Alerte', 'EtudeClinique']);
        if (!importantTypes.has(nodeType) && !res.forceLabel) {
          res.label = '';
        }

        return res;
      },

      // Edge reducers pour styling dynamique
      edgeReducer: (_edge, data) => {
        return { ...data };
      },
    });

    sigmaRef.current = sigma as unknown as Sigma;

    // Événements de sélection
    sigma.on('clickNode', ({ node }) => {
      setSelectedNodeIds(new Set([node]));

      // Si c'est une étude clinique, activer le contexte N1/N2
      const graph = graphRef.current;
      if (graph) {
        const nodeType = graph.getNodeAttribute(node, 'nodeType');
        if (nodeType === 'EtudeClinique') {
          setSelectedStudyId(node);
        }
        // Si c'est un sous-traitant, ouvrir le panneau KQI
        if (nodeType === 'SousTraitant') {
          openKQIPanelForST(node);
        }
      }
    });

    sigma.on('clickStage', () => {
      setSelectedNodeIds(new Set());
      // Désactiver le contexte d'étude quand on clique sur le fond
      setSelectedStudyId(null);
    });

    // Événements de survol avec highlight
    sigma.on('enterNode', ({ node, event }) => {
      setHoveredNodeId(node);
      setMousePosition({ x: event.x, y: event.y });
      highlightNeighbors(node);
    });

    sigma.on('leaveNode', () => {
      setHoveredNodeId(null);
      setMousePosition(null);
      highlightNeighbors(null);
    });

    // Suivi de la position de la souris pour le tooltip
    const container = containerRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Double-clic pour drill-down
    sigma.on('doubleClickNode', ({ node }) => {
      setFocusedNodeId(node);
      setGraphViewMode('focus');
      setSelectedNodeIds(new Set([node]));
    });

    // Nettoyage
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      sigma.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [setSelectedNodeIds, setHoveredNodeId, setFocusedNodeId, setGraphViewMode, setSelectedStudyId, highlightNeighbors]);

  // Charger les relations IMPLIQUE_ST pour le contexte N1/N2
  useEffect(() => {
    const relations = parseImpliqueSTFromEdges(allEdges as any);
    setImpliqueSTData(relations);
  }, [allEdges]);

  // Appliquer le contexte d'étude quand une étude est sélectionnée
  useEffect(() => {
    const graph = graphRef.current;
    const sigma = sigmaRef.current;
    if (!graph || !sigma) return;

    if (selectedStudyId) {
      applyStudyContext(graph as any, selectedStudyId);
    } else {
      resetStudyContext(graph as any);
    }

    sigma.refresh();
  }, [selectedStudyId]);

  // Rafraîchir Sigma quand la sélection change (pour les labels)
  useEffect(() => {
    sigmaRef.current?.refresh();
  }, [selectedNodeIds, hoveredNodeId]);

  // Mise à jour des nœuds du graphe
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    // Effacer le graphe existant
    graph.clear();

    // Obtenir les nœuds et arêtes à afficher selon le mode
    const displayNodes = graphViewMode === 'focus' && focusedNodeId
      ? (() => {
          const nodes = new Map<string, GraphNode>();
          const centralNode = allNodes.get(focusedNodeId);
          if (centralNode) nodes.set(focusedNodeId, centralNode);
          for (const [, edge] of allEdges) {
            if (edge.source === focusedNodeId) {
              const neighbor = allNodes.get(edge.target);
              if (neighbor) nodes.set(edge.target, neighbor);
            } else if (edge.target === focusedNodeId) {
              const neighbor = allNodes.get(edge.source);
              if (neighbor) nodes.set(edge.source, neighbor);
            }
          }
          return nodes;
        })()
      : filteredNodes;

    const displayEdges = graphViewMode === 'focus' && focusedNodeId
      ? (() => {
          const edges = new Map<string, typeof allEdges extends Map<string, infer V> ? V : never>();
          for (const [id, edge] of allEdges) {
            if (displayNodes.has(edge.source) && displayNodes.has(edge.target)) {
              edges.set(id, edge);
            }
          }
          return edges;
        })()
      : filteredEdges;

    // Ajouter les nœuds avec positions initiales en cercle
    let index = 0;
    const nodeCount = displayNodes.size;
    const radius = Math.max(200, nodeCount * 8);

    for (const [id, node] of displayNodes) {
      const angle = (index / nodeCount) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      const isFocused = id === focusedNodeId;
      const nodeData = { _type: node._type, niveau_actuel: (node as any).niveau_actuel, criticite: node.criticite };
      let color = getNodeColor(node._type, nodeData);
      let size = getNodeSize(node._type, nodeData) * (isFocused ? 1.5 : 1);

      // Pour les sous-traitants, ajuster la couleur selon le statut KQI
      let kqiStatus: 'good' | 'warning' | 'critical' | null = null;
      let kqiAlertCount = 0;
      if (node._type === 'SousTraitant') {
        const kqiAgg = kqiAggregations.get(id);
        if (kqiAgg && kqiAgg.totalCount > 0) {
          kqiStatus = kqiAgg.status;
          kqiAlertCount = kqiAgg.alertCount;
          // Modifier la couleur du nœud ST selon le statut KQI
          color = getKQIStatusColor(kqiAgg.status);
          // Agrandir légèrement les ST avec alertes
          if (kqiAgg.alertCount > 0) {
            size = size * 1.2;
          }
        }
      }

      graph.addNode(id, {
        x,
        y,
        size,
        color,
        label: node.nom ?? node.description ?? node.id,
        nodeType: node._type,
        hidden: false,
        highlighted: highlightedNodeIds.has(id) || isFocused,
        forceLabel: highlightedNodeIds.has(id) || isFocused,
        originalColor: color,
        originalSize: size,
        kqiStatus,
        kqiAlertCount,
      });

      index++;
    }

    // Ajouter les arêtes avec styles améliorés
    for (const [, edge] of displayEdges) {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        const isImportant = IMPORTANT_RELATIONS.has(edge._type);
        const isConnectedToFocus = edge.source === focusedNodeId || edge.target === focusedNodeId;

        // Couleur basée sur le nœud source
        const sourceColor = graph.getNodeAttribute(edge.source, 'color') ?? '#64748b';

        // Calculer la couleur finale
        let finalColor = '#94a3b8';
        if (isConnectedToFocus) {
          finalColor = '#3B82F6';
        } else if (isImportant) {
          // Convertir hex en rgba
          const hex = sourceColor.replace('#', '');
          if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            finalColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
          } else {
            finalColor = sourceColor;
          }
        }

        graph.addEdge(edge.source, edge.target, {
          size: isConnectedToFocus ? 4 : getEdgeSize(edge._type),
          color: finalColor,
        });
      }
    }

    // Appliquer le layout
    if (graph.order > 0) {
      applyLayout();
    }
    sigmaRef.current?.refresh();
  }, [filteredNodes, filteredEdges, highlightedNodeIds, graphViewMode, focusedNodeId, allNodes, allEdges, applyLayout, kqiAggregations]);

  // Fonction pour réinitialiser la vue
  const resetCamera = useCallback(() => {
    sigmaRef.current?.getCamera().animate(
      { x: 0.5, y: 0.5, ratio: 1 },
      { duration: 500 }
    );
  }, []);

  // Fonction pour quitter le mode focus
  const exitFocusMode = useCallback(() => {
    setFocusedNodeId(null);
    setGraphViewMode('all');
  }, [setFocusedNodeId, setGraphViewMode]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        ref={containerRef}
        className="sigma-container w-full h-full"
      />

      {/* Tooltip au survol des nœuds */}
      <GraphTooltip mousePosition={mousePosition} />

      {/* Indicateur mode focus */}
      {graphViewMode === 'focus' && focusedNodeId && (
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md shadow-md">
          <span className="text-sm font-medium">
            Mode Focus : {allNodes.get(focusedNodeId)?.nom ?? focusedNodeId}
          </span>
          <button
            onClick={exitFocusMode}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
            title="Quitter le mode focus"
          >
            <span className="text-sm">✕</span>
          </button>
        </div>
      )}

      {/* Indicateur contexte étude N1/N2 */}
      {selectedStudyId && graphViewMode !== 'focus' && (
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md shadow-md">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div>
            <span className="text-xs opacity-80">Contexte étude</span>
            <span className="text-sm font-medium block">
              {allNodes.get(selectedStudyId)?.nom ?? selectedStudyId}
            </span>
          </div>
          <button
            onClick={() => setSelectedStudyId(null)}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
            title="Désactiver le contexte étude"
          >
            <span className="text-sm">✕</span>
          </button>
        </div>
      )}

      {/* Indicateur layout en cours */}
      {isLayoutRunning && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-card border rounded-md shadow-sm">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm text-muted-foreground">Calcul du layout...</span>
        </div>
      )}

      {/* Légende rapide - contextuelle */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 max-w-xs">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
          <span className="w-3 h-3 rounded-full bg-[#6366f1]" />
          <span>Études</span>
        </div>
        {selectedStudyId ? (
          <>
            {/* Légende contextuelle N1/N2 quand une étude est sélectionnée */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
              <span className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span>ST N1</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
              <span className="w-3 h-3 rounded-full bg-[#6ee7b7]" />
              <span>ST N2</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
              <span className="w-3 h-3 rounded-full bg-[#94a3b8] opacity-50" />
              <span>Hors étude</span>
            </div>
          </>
        ) : (
          /* Légende KQI par défaut quand aucune étude sélectionnée */
          <>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
              <span className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span>ST OK</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span>ST Attention</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
              <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span>ST Critique</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
          <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
          <span>Audits</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-card/90 border rounded text-xs">
          <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span>Alertes</span>
        </div>
      </div>

      {/* Contrôles du graphe */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => sigmaRef.current?.getCamera().animatedZoom({ duration: 300 })}
          className="p-2 bg-card border rounded-md shadow-sm hover:bg-accent transition-colors"
          title="Zoom avant"
        >
          <span className="text-lg">+</span>
        </button>
        <button
          onClick={() => sigmaRef.current?.getCamera().animatedUnzoom({ duration: 300 })}
          className="p-2 bg-card border rounded-md shadow-sm hover:bg-accent transition-colors"
          title="Zoom arrière"
        >
          <span className="text-lg">−</span>
        </button>
        <button
          onClick={resetCamera}
          className="p-2 bg-card border rounded-md shadow-sm hover:bg-accent transition-colors"
          title="Réinitialiser la vue"
        >
          <span className="text-sm">⟲</span>
        </button>
        <button
          onClick={applyLayout}
          disabled={isLayoutRunning}
          className="p-2 bg-card border rounded-md shadow-sm hover:bg-accent transition-colors disabled:opacity-50"
          title="Recalculer le layout"
        >
          <span className="text-sm">◉</span>
        </button>
      </div>
    </div>
  );
}

export default GraphCanvas;
