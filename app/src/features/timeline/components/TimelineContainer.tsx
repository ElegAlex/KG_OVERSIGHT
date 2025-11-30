/**
 * KG-Oversight - Timeline interactive avec vis-timeline
 * Synchronisation bidirectionnelle avec le graphe
 */

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import type { TimelineOptions, DataItem, TimelineEventPropertiesResult } from 'vis-timeline/types';
import { Calendar, ZoomIn, ZoomOut, Maximize2, ChevronUp, ChevronDown, Minimize2, X } from 'lucide-react';
import {
  allNodesAtom,
  allEdgesAtom,
  selectedNodeIdsAtom,
  highlightedNodeIdsAtom,
  filteredNodesAtom,
  timelineSizeAtom,
  type TimelineSize,
} from '@shared/stores/selectionAtoms';
import { getNodeColor, getCriticiteColor } from '@shared/utils/nodeStyles';
import { cn } from '@/lib/utils';
import type { GraphNode, NodeType } from '@data/types';

import 'vis-timeline/styles/vis-timeline-graph2d.css';

interface TimelineContainerProps {
  className?: string;
}

// Types d'événements à afficher sur la timeline
const TIMELINE_NODE_TYPES: NodeType[] = [
  'Audit',
  'Inspection',
  'Finding',
  'EvenementQualite',
  'Decision',
  'Alerte',
  'ReunionQualite',
  'EvaluationRisque',
];

// Groupes pour la timeline (catégories d'événements)
const TIMELINE_GROUPS = [
  { id: 'audit', content: '🔍 Audits', order: 1 },
  { id: 'inspection', content: '📋 Inspections', order: 2 },
  { id: 'finding', content: '⚠️ Findings', order: 3 },
  { id: 'qualite', content: '🚨 Événements Qualité', order: 4 },
  { id: 'decision', content: '⚖️ Décisions', order: 5 },
  { id: 'alerte', content: '🔔 Alertes', order: 6 },
  { id: 'reunion', content: '📅 Réunions', order: 7 },
];

// Mapping type de nœud vers groupe
function getGroupId(nodeType: NodeType): string {
  switch (nodeType) {
    case 'Audit': return 'audit';
    case 'Inspection': return 'inspection';
    case 'Finding': return 'finding';
    case 'EvenementQualite': return 'qualite';
    case 'Decision': return 'decision';
    case 'Alerte': return 'alerte';
    case 'ReunionQualite': return 'reunion';
    case 'EvaluationRisque': return 'decision';
    default: return 'qualite';
  }
}

// Extraire les dates d'un nœud
function getNodeDates(node: GraphNode): { start: Date | null; end: Date | null } {
  let startStr: string | undefined;
  let endStr: string | undefined;

  switch (node._type) {
    case 'Audit':
    case 'Inspection':
    case 'EtudeClinique':
      startStr = node.date_debut;
      endStr = node.date_fin;
      break;
    case 'Finding':
      startStr = node.date_detection;
      endStr = node.date_cloture;
      break;
    case 'EvenementQualite':
    case 'Alerte':
    case 'Evenement':
      startStr = node.date_creation;
      endStr = (node as any).date_cloture ?? (node as any).date_resolution;
      break;
    case 'Decision':
      startStr = node.date_decision;
      break;
    case 'EvaluationRisque':
      startStr = node.date_evaluation;
      break;
    case 'ReunionQualite':
      startStr = node.date_reunion;
      break;
    default:
      startStr = undefined;
  }

  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;

  return { start, end };
}

// Obtenir le label du nœud
function getNodeLabel(node: GraphNode): string {
  if ('nom' in node && node.nom) return node.nom;
  if ('description' in node && node.description) {
    return node.description.length > 40
      ? node.description.substring(0, 40) + '...'
      : node.description;
  }
  return node.id;
}

type TimeScale = 'day' | 'month' | 'year';

function TimeScaleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-xs rounded-md transition-all duration-200',
        active
          ? 'bg-indigo-500/20 text-indigo-400 font-medium'
          : 'text-slate-500 hover:text-slate-400 hover:bg-white/5'
      )}
    >
      {label}
    </button>
  );
}

export function TimelineContainer({ className }: TimelineContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const itemsRef = useRef<DataSet<DataItem> | null>(null);
  const isTimelineReady = useRef(false);

  const allNodes = useAtomValue(allNodesAtom);
  const allEdges = useAtomValue(allEdgesAtom);
  const filteredNodes = useAtomValue(filteredNodesAtom);
  const [selectedNodeIds, setSelectedNodeIds] = useAtom(selectedNodeIdsAtom);
  const setHighlightedNodeIds = useSetAtom(highlightedNodeIdsAtom);

  const [timeScale, setTimeScale] = useState<TimeScale>('month');
  const [eventCount, setEventCount] = useState(0);
  const [relatedEventCount, setRelatedEventCount] = useState<number | null>(null);
  const [timelineSize, setTimelineSize] = useAtom(timelineSizeAtom);

  // Calculer les nœuds liés au nœud sélectionné (voisins directs)
  const relatedNodeIds = useMemo(() => {
    if (selectedNodeIds.size === 0) return new Set<string>();

    const related = new Set<string>();

    // Ajouter les nœuds sélectionnés eux-mêmes
    for (const nodeId of selectedNodeIds) {
      related.add(nodeId);
    }

    // Parcourir les arêtes pour trouver les voisins
    for (const [, edge] of allEdges) {
      if (selectedNodeIds.has(edge.source)) {
        related.add(edge.target);
      }
      if (selectedNodeIds.has(edge.target)) {
        related.add(edge.source);
      }
    }

    return related;
  }, [selectedNodeIds, allEdges]);

  // Convertir les nœuds en items de timeline
  const timelineItems = useMemo(() => {
    const items: DataItem[] = [];

    for (const [id, node] of filteredNodes) {
      // Ne garder que les types d'événements pertinents
      if (!TIMELINE_NODE_TYPES.includes(node._type)) continue;

      const { start, end } = getNodeDates(node);
      if (!start) continue; // Ignorer les nœuds sans date

      // Couleur basée sur la criticité ou le type
      const bgColor = node.criticite
        ? getCriticiteColor(node.criticite)
        : getNodeColor(node._type);

      const item: DataItem = {
        id,
        content: getNodeLabel(node),
        start,
        end: end ?? undefined,
        group: getGroupId(node._type),
        className: `timeline-item-${node._type.toLowerCase()}`,
        style: `
          background-color: ${bgColor};
          border-color: ${bgColor};
          color: white;
          border-radius: 4px;
          font-size: 11px;
          padding: 2px 6px;
        `,
        title: `${node._type}: ${getNodeLabel(node)}${node.criticite ? ` (${node.criticite})` : ''}`,
      };

      items.push(item);
    }

    return items;
  }, [filteredNodes]);

  // Initialiser la timeline
  useEffect(() => {
    if (!containerRef.current) return;

    // Créer les datasets
    const items = new DataSet<DataItem>(timelineItems);
    const groups = new DataSet(TIMELINE_GROUPS);
    itemsRef.current = items;

    // Options de la timeline - améliorées pour meilleure visibilité
    const options: TimelineOptions = {
      stack: true,
      stackSubgroups: true,
      showCurrentTime: true,
      zoomable: true,
      moveable: true,
      selectable: true,
      multiselect: true,
      orientation: { axis: 'top', item: 'top' },
      margin: {
        item: { horizontal: 5, vertical: 8 },
        axis: 5,
      },
      min: new Date('2022-01-01'),
      max: new Date('2026-12-31'),
      start: new Date('2023-06-01'),
      end: new Date('2025-06-01'),
      groupOrder: 'order',
      groupHeightMode: 'auto',
      tooltip: {
        followMouse: true,
        overflowMethod: 'cap',
      },
      verticalScroll: false,
      horizontalScroll: true,
      zoomKey: 'ctrlKey',
      height: '100%',
      maxHeight: '100%',
    };

    // Créer la timeline
    const timeline = new Timeline(containerRef.current, items, groups, options);
    timelineRef.current = timeline;

    // Événement de sélection
    timeline.on('select', (properties: TimelineEventPropertiesResult) => {
      const selectedItems = properties.items as string[];
      if (selectedItems.length > 0) {
        setSelectedNodeIds(new Set(selectedItems));
        setHighlightedNodeIds(new Set(selectedItems));
      }
    });

    // Événement de double-clic pour centrer
    timeline.on('doubleClick', (properties: TimelineEventPropertiesResult) => {
      if (properties.item) {
        timeline.focus(properties.item);
      }
    });

    setEventCount(items.length);

    // Marquer la timeline comme prête après un court délai
    setTimeout(() => {
      isTimelineReady.current = true;
    }, 200);

    return () => {
      isTimelineReady.current = false;
      timeline.destroy();
      timelineRef.current = null;
      itemsRef.current = null;
    };
  }, []); // Ne recréer que si le composant est remonté

  // Mettre à jour les items quand les données changent
  useEffect(() => {
    if (!itemsRef.current || !timelineRef.current) return;

    // Mettre à jour les items
    itemsRef.current.clear();
    itemsRef.current.add(timelineItems);
    setEventCount(timelineItems.length);

    // Rafraîchir la timeline
    timelineRef.current.redraw();
  }, [timelineItems]);

  // Synchroniser la sélection depuis le graphe et mettre en évidence les items liés
  useEffect(() => {
    if (!timelineRef.current || !itemsRef.current || !isTimelineReady.current) return;

    const selectedArray = Array.from(selectedNodeIds);
    const hasSelection = selectedArray.length > 0;

    // Si pas de sélection, restaurer tous les items à leur état normal
    if (!hasSelection) {
      setRelatedEventCount(null);
      // Restaurer l'opacité de tous les items
      const allItems = itemsRef.current.get();
      const updates: DataItem[] = [];
      for (const item of allItems) {
        const node = filteredNodes.get(item.id as string);
        if (!node) continue;

        const bgColor = node.criticite
          ? getCriticiteColor(node.criticite)
          : getNodeColor(node._type);

        updates.push({
          ...item,
          className: `timeline-item-${node._type.toLowerCase()}`,
          style: `
            background-color: ${bgColor};
            border-color: ${bgColor};
            color: white;
            border-radius: 4px;
            font-size: 11px;
            padding: 2px 6px;
            opacity: 1;
          `,
        });
      }
      if (updates.length > 0) {
        itemsRef.current.update(updates);
      }
      return;
    }

    // Mettre en évidence les items liés, atténuer les autres
    const allItems = itemsRef.current.get();
    const updates: DataItem[] = [];
    let relatedCount = 0;
    const relatedItemIds: string[] = [];

    for (const item of allItems) {
      const itemId = item.id as string;
      const isRelated = relatedNodeIds.has(itemId);
      const node = filteredNodes.get(itemId);
      if (!node) continue;

      if (isRelated) {
        relatedCount++;
        relatedItemIds.push(itemId);
      }

      const bgColor = node.criticite
        ? getCriticiteColor(node.criticite)
        : getNodeColor(node._type);

      updates.push({
        ...item,
        className: `timeline-item-${node._type.toLowerCase()} ${isRelated ? 'timeline-item-related' : 'timeline-item-dimmed'}`,
        style: `
          background-color: ${bgColor};
          border-color: ${isRelated ? '#6366f1' : bgColor};
          border-width: ${isRelated ? '2px' : '0'};
          color: white;
          border-radius: 4px;
          font-size: 11px;
          padding: 2px 6px;
          opacity: ${isRelated ? 1 : 0.3};
          ${isRelated ? 'box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);' : ''}
        `,
      });
    }

    if (updates.length > 0) {
      itemsRef.current.update(updates);
    }

    setRelatedEventCount(relatedCount);

    // Sélectionner et centrer sur les items liés (avec délai pour s'assurer que la timeline est prête)
    if (relatedItemIds.length > 0) {
      try {
        timelineRef.current.setSelection(relatedItemIds);
        // Vérifier que les items existent avant de faire focus
        const existingItems = relatedItemIds.filter(id => itemsRef.current?.get(id) !== null);
        if (existingItems.length > 0) {
          setTimeout(() => {
            if (timelineRef.current && existingItems.length > 0) {
              try {
                timelineRef.current.focus(existingItems, { animation: { duration: 400 } });
              } catch (e) {
                console.warn('[Timeline] Focus error:', e);
              }
            }
          }, 100);
        }
      } catch (e) {
        console.warn('[Timeline] Selection error:', e);
      }
    }
  }, [selectedNodeIds, relatedNodeIds, filteredNodes]);

  // Changer l'échelle de temps
  const handleTimeScaleChange = useCallback((scale: TimeScale) => {
    setTimeScale(scale);
    if (!timelineRef.current) return;

    const now = new Date();
    let start: Date;
    let end: Date;

    switch (scale) {
      case 'day':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 6, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear() - 2, 0, 1);
        end = new Date(now.getFullYear() + 2, 11, 31);
        break;
    }

    timelineRef.current.setWindow(start, end, { animation: true });
  }, []);

  // Contrôles de zoom
  const handleZoomIn = useCallback(() => {
    timelineRef.current?.zoomIn(0.5);
  }, []);

  const handleZoomOut = useCallback(() => {
    timelineRef.current?.zoomOut(0.5);
  }, []);

  const handleFitAll = useCallback(() => {
    timelineRef.current?.fit({ animation: true });
  }, []);

  // Contrôles de taille
  const toggleSize = useCallback(() => {
    setTimelineSize((prev) => {
      if (prev === 'collapsed') return 'normal';
      if (prev === 'normal') return 'expanded';
      return 'normal';
    });
  }, []);

  const collapseTimeline = useCallback(() => {
    setTimelineSize('collapsed');
  }, []);

  const expandTimeline = useCallback(() => {
    setTimelineSize('expanded');
    // Ajuster la vue pour montrer tous les événements après l'expansion
    setTimeout(() => {
      timelineRef.current?.fit({ animation: true });
    }, 400);
  }, []);

  // Redessiner la timeline après changement de taille (avec délai pour l'animation CSS)
  useEffect(() => {
    if (timelineSize !== 'collapsed' && timelineRef.current) {
      setTimeout(() => {
        timelineRef.current?.redraw();
      }, 350);
    }
  }, [timelineSize]);

  return (
    <div className={cn(
      'app-timeline flex flex-col transition-all duration-300 ease-in-out',
      timelineSize === 'collapsed' && 'collapsed',
      timelineSize === 'expanded' && 'expanded',
      className
    )}>
      {/* Header timeline */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-900/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Bouton collapse/expand */}
          <button
            onClick={toggleSize}
            className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            title={timelineSize === 'collapsed' ? 'Agrandir' : 'Réduire'}
          >
            {timelineSize === 'collapsed' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-300">Timeline</span>
          </div>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {eventCount} événements
          </span>
          {relatedEventCount !== null && (
            <button
              onClick={() => setSelectedNodeIds(new Set())}
              className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full hover:bg-indigo-500/30 transition-colors"
              title="Cliquer pour désélectionner et voir tous les événements"
            >
              {relatedEventCount} liés
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Contrôles (masqués si collapsed) */}
        {timelineSize !== 'collapsed' && (
          <div className="flex items-center gap-4">
            {/* Échelle de temps */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-0.5">
              <TimeScaleButton
                label="Jour"
                active={timeScale === 'day'}
                onClick={() => handleTimeScaleChange('day')}
              />
              <TimeScaleButton
                label="Mois"
                active={timeScale === 'month'}
                onClick={() => handleTimeScaleChange('month')}
              />
              <TimeScaleButton
                label="Année"
                active={timeScale === 'year'}
                onClick={() => handleTimeScaleChange('year')}
              />
            </div>

            {/* Contrôles de zoom */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleFitAll}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                title="Ajuster à tous les événements"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={collapseTimeline}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  timelineSize === 'collapsed'
                    ? "text-indigo-400 bg-indigo-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
                title="Réduire"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={expandTimeline}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  timelineSize === 'expanded'
                    ? "text-indigo-400 bg-indigo-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
                title="Agrandir"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zone timeline (masquée visuellement si collapsed, mais reste dans le DOM) */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 timeline-dark-theme overflow-hidden transition-all duration-300",
          timelineSize === 'collapsed' && "hidden"
        )}
      />

      {/* Styles personnalisés pour le thème sombre */}
      <style>{`
        .timeline-dark-theme {
          height: 100%;
        }

        .timeline-dark-theme .vis-timeline {
          background: transparent;
          border: none;
          font-family: Inter, system-ui, sans-serif;
          height: 100% !important;
        }

        .timeline-dark-theme .vis-panel.vis-center,
        .timeline-dark-theme .vis-panel.vis-left,
        .timeline-dark-theme .vis-panel.vis-right,
        .timeline-dark-theme .vis-panel.vis-top,
        .timeline-dark-theme .vis-panel.vis-bottom {
          border-color: rgba(255, 255, 255, 0.05);
        }

        .timeline-dark-theme .vis-time-axis .vis-text {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 500;
        }

        .timeline-dark-theme .vis-time-axis .vis-text.vis-major {
          font-weight: 600;
          color: #cbd5e1;
        }

        .timeline-dark-theme .vis-time-axis .vis-grid.vis-minor {
          border-color: rgba(255, 255, 255, 0.03);
        }

        .timeline-dark-theme .vis-time-axis .vis-grid.vis-major {
          border-color: rgba(255, 255, 255, 0.1);
        }

        /* Labels des groupes (colonne gauche) */
        .timeline-dark-theme .vis-labelset .vis-label {
          background: rgba(15, 23, 42, 0.95);
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 500;
          border-color: rgba(255, 255, 255, 0.08);
          padding: 8px 12px;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .timeline-dark-theme .vis-labelset {
          min-width: 160px;
        }

        /* Lignes de groupes */
        .timeline-dark-theme .vis-foreground .vis-group {
          border-color: rgba(255, 255, 255, 0.05);
          min-height: 44px;
        }

        .timeline-dark-theme .vis-background .vis-group {
          background: rgba(30, 41, 59, 0.3);
        }

        .timeline-dark-theme .vis-background .vis-group:nth-child(odd) {
          background: rgba(30, 41, 59, 0.5);
        }

        /* Items de timeline */
        .timeline-dark-theme .vis-item {
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          border-width: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          min-height: 24px;
          display: flex;
          align-items: center;
        }

        .timeline-dark-theme .vis-item .vis-item-content {
          padding: 4px 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .timeline-dark-theme .vis-item.vis-selected {
          border: 2px solid #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }

        .timeline-dark-theme .vis-item.vis-range {
          border-radius: 6px;
        }

        .timeline-dark-theme .vis-item.vis-box {
          border-radius: 6px;
        }

        .timeline-dark-theme .vis-item.vis-point .vis-dot {
          border-radius: 50%;
          width: 12px;
          height: 12px;
        }

        /* Ligne du temps actuel */
        .timeline-dark-theme .vis-current-time {
          background-color: #ef4444;
          width: 2px;
          z-index: 5;
        }

        .timeline-dark-theme .vis-custom-time {
          background-color: #6366f1;
          width: 2px;
        }

        /* Tooltip */
        .timeline-dark-theme .vis-tooltip {
          background: rgba(15, 23, 42, 0.98);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f1f5f9;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          max-width: 300px;
        }

        /* Scrollbar dans la timeline */
        .timeline-dark-theme .vis-panel.vis-center {
          overflow-y: auto;
        }

        .timeline-dark-theme .vis-panel.vis-center::-webkit-scrollbar {
          width: 6px;
        }

        .timeline-dark-theme .vis-panel.vis-center::-webkit-scrollbar-track {
          background: transparent;
        }

        .timeline-dark-theme .vis-panel.vis-center::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.4);
          border-radius: 3px;
        }

        /* Animation sur hover des items */
        .timeline-dark-theme .vis-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 5;
        }
      `}</style>
    </div>
  );
}

export default TimelineContainer;
