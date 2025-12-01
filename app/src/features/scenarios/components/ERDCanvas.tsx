/**
 * KG-Oversight - Canvas ERD interactif
 * Visualisation du schéma entités-relations avec notation Crow's Foot
 *
 * Features:
 * - Layout automatique par catégories
 * - Relations SVG avec cardinalités
 * - Zoom/pan avec molette et drag
 * - Sélection d'entités pour construire un parcours
 * - Animation des connexions
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  MousePointer2,
} from 'lucide-react';

import {
  schemaEntities,
  schemaRelations,
  getEntityByType,
  categoryColors,
  type SchemaEntity,
  type SchemaRelation,
} from '../data/schemaDefinition';
import type { NodeType } from '@data/types/entities';

// =============================================================================
// Types
// =============================================================================

interface Position {
  x: number;
  y: number;
}

interface EntityPosition extends Position {
  entity: SchemaEntity;
}

interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  dragStart: Position | null;
}

interface ERDCanvasProps {
  /** Entités actuellement dans le parcours */
  pathEntities: NodeType[];
  /** Dernière entité du parcours (pour highlight des connexions) */
  lastEntity: NodeType | null;
  /** Entités connectées à la dernière */
  connectedEntities: NodeType[];
  /** Callback quand une entité est cliquée */
  onEntityClick: (entityType: NodeType) => void;
  /** Mode d'interaction */
  mode: 'select' | 'pan';
  /** Hauteur du canvas */
  height?: number;
}

// =============================================================================
// Layout calculation
// =============================================================================

const ENTITY_WIDTH = 160;
const ENTITY_HEIGHT = 80;
const HORIZONTAL_GAP = 100;
const VERTICAL_GAP = 60;
const CATEGORY_GAP = 80;

function calculateEntityPositions(): Map<NodeType, Position> {
  const positions = new Map<NodeType, Position>();

  // Grouper par catégorie
  const categories = ['core', 'quality', 'compliance', 'monitoring'];
  const byCategory = new Map<string, SchemaEntity[]>();

  for (const cat of categories) {
    byCategory.set(cat, schemaEntities.filter(e => e.category === cat));
  }

  let currentY = 60;

  for (const [category, entities] of byCategory) {
    // Layout en grille 3 colonnes par catégorie
    const cols = 3;
    entities.forEach((entity, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      positions.set(entity.type, {
        x: 80 + col * (ENTITY_WIDTH + HORIZONTAL_GAP),
        y: currentY + row * (ENTITY_HEIGHT + VERTICAL_GAP),
      });
    });

    const rows = Math.ceil(entities.length / cols);
    currentY += rows * (ENTITY_HEIGHT + VERTICAL_GAP) + CATEGORY_GAP;
  }

  return positions;
}

// =============================================================================
// SVG Crow's Foot notation helpers
// =============================================================================

interface RelationPathProps {
  relation: SchemaRelation;
  sourcePos: Position;
  targetPos: Position;
  isHighlighted: boolean;
  isInPath: boolean;
}

function getCardinalitySymbol(cardinality: string, isTarget: boolean): string {
  // Crow's Foot notation
  const [sourceSide, targetSide] = cardinality.split(':');
  const side = isTarget ? targetSide : sourceSide;

  if (side === '1') return 'one';
  if (side === 'N' || side === 'M') return 'many';
  return 'one';
}

function RelationPath({ relation, sourcePos, targetPos, isHighlighted, isInPath }: RelationPathProps) {
  // Calculate path with some curve
  const sx = sourcePos.x + ENTITY_WIDTH;
  const sy = sourcePos.y + ENTITY_HEIGHT / 2;
  const tx = targetPos.x;
  const ty = targetPos.y + ENTITY_HEIGHT / 2;

  // Check if it's a self-referencing relation
  const isSelfRef = relation.source === relation.target;

  let pathD: string;

  if (isSelfRef) {
    // Self-referencing: loop around
    const loopSize = 40;
    pathD = `M ${sx} ${sy}
             C ${sx + loopSize} ${sy - loopSize * 2},
               ${sx + loopSize * 2} ${sy - loopSize * 2},
               ${sx + loopSize * 2} ${sy}
             C ${sx + loopSize * 2} ${sy + loopSize * 2},
               ${sx + loopSize} ${sy + loopSize * 2},
               ${sx} ${sy + 20}`;
  } else {
    // Regular bezier curve
    const midX = (sx + tx) / 2;
    pathD = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
  }

  const strokeColor = isInPath
    ? '#6366f1'
    : isHighlighted
      ? '#22c55e'
      : '#475569';

  const strokeWidth = isInPath || isHighlighted ? 2.5 : 1.5;

  // Get cardinality symbols
  const sourceCard = getCardinalitySymbol(relation.cardinality, false);
  const targetCard = getCardinalitySymbol(relation.cardinality, true);

  return (
    <g className="relation-path">
      {/* Main path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isHighlighted && !isInPath ? '5,5' : undefined}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ filter: isHighlighted ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))' : undefined }}
      />

      {/* Cardinality markers - Source side */}
      {!isSelfRef && (
        <>
          {sourceCard === 'many' ? (
            // Crow's foot (many)
            <g transform={`translate(${sx - 10}, ${sy})`}>
              <line x1="0" y1="-6" x2="10" y2="0" stroke={strokeColor} strokeWidth={strokeWidth} />
              <line x1="0" y1="6" x2="10" y2="0" stroke={strokeColor} strokeWidth={strokeWidth} />
              <line x1="0" y1="0" x2="10" y2="0" stroke={strokeColor} strokeWidth={strokeWidth} />
            </g>
          ) : (
            // Single line (one)
            <line x1={sx - 8} y1={sy - 6} x2={sx - 8} y2={sy + 6} stroke={strokeColor} strokeWidth={strokeWidth} />
          )}

          {/* Target side cardinality */}
          {targetCard === 'many' ? (
            // Crow's foot (many)
            <g transform={`translate(${tx}, ${ty})`}>
              <line x1="0" y1="0" x2="10" y2="-6" stroke={strokeColor} strokeWidth={strokeWidth} />
              <line x1="0" y1="0" x2="10" y2="6" stroke={strokeColor} strokeWidth={strokeWidth} />
              <line x1="0" y1="0" x2="10" y2="0" stroke={strokeColor} strokeWidth={strokeWidth} />
            </g>
          ) : (
            // Single line (one)
            <line x1={tx + 8} y1={ty - 6} x2={tx + 8} y2={ty + 6} stroke={strokeColor} strokeWidth={strokeWidth} />
          )}
        </>
      )}

      {/* Relation label */}
      {!isSelfRef && (
        <text
          x={(sx + tx) / 2}
          y={(sy + ty) / 2 - 8}
          fill={isHighlighted ? '#22c55e' : '#64748b'}
          fontSize="10"
          textAnchor="middle"
          className="pointer-events-none select-none"
        >
          {relation.label}
        </text>
      )}
    </g>
  );
}

// =============================================================================
// Entity Node Component
// =============================================================================

interface EntityNodeProps {
  entity: SchemaEntity;
  position: Position;
  status: 'in-path' | 'connected' | 'available' | 'disabled';
  pathIndex?: number;
  onClick: () => void;
}

function EntityNode({ entity, position, status, pathIndex, onClick }: EntityNodeProps) {
  const statusStyles = {
    'in-path': {
      border: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
      text: '#e0e7ff',
      ring: true,
    },
    connected: {
      border: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#86efac',
      ring: false,
    },
    available: {
      border: '#475569',
      bg: 'rgba(30, 41, 59, 0.8)',
      text: '#94a3b8',
      ring: false,
    },
    disabled: {
      border: '#1e293b',
      bg: 'rgba(15, 23, 42, 0.6)',
      text: '#475569',
      ring: false,
    },
  };

  const style = statusStyles[status];
  const isClickable = status !== 'disabled' && status !== 'in-path';

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Background rect */}
      <rect
        x={position.x}
        y={position.y}
        width={ENTITY_WIDTH}
        height={ENTITY_HEIGHT}
        rx={12}
        ry={12}
        fill={style.bg}
        stroke={style.border}
        strokeWidth={status === 'in-path' || status === 'connected' ? 2.5 : 1.5}
        style={{
          filter: status === 'connected'
            ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.4))'
            : status === 'in-path'
              ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))'
              : undefined,
        }}
      />

      {/* Category indicator bar */}
      <rect
        x={position.x}
        y={position.y}
        width={ENTITY_WIDTH}
        height={4}
        rx={2}
        fill={entity.color}
        clipPath={`inset(0 0 ${ENTITY_HEIGHT - 4}px 0 round 12px)`}
      />

      {/* Entity name */}
      <text
        x={position.x + ENTITY_WIDTH / 2}
        y={position.y + 35}
        fill={style.text}
        fontSize="13"
        fontWeight="600"
        textAnchor="middle"
        className="pointer-events-none select-none"
      >
        {entity.label}
      </text>

      {/* Category label */}
      <text
        x={position.x + ENTITY_WIDTH / 2}
        y={position.y + 52}
        fill="#64748b"
        fontSize="10"
        textAnchor="middle"
        className="pointer-events-none select-none"
      >
        {entity.type}
      </text>

      {/* Path index badge */}
      {pathIndex !== undefined && (
        <g>
          <circle
            cx={position.x + ENTITY_WIDTH - 10}
            cy={position.y + 10}
            r={12}
            fill="#6366f1"
          />
          <text
            x={position.x + ENTITY_WIDTH - 10}
            y={position.y + 14}
            fill="white"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none select-none"
          >
            {pathIndex + 1}
          </text>
        </g>
      )}

      {/* Connected indicator (plus icon) */}
      {status === 'connected' && (
        <g>
          <circle
            cx={position.x + ENTITY_WIDTH - 10}
            cy={position.y + 10}
            r={10}
            fill="#22c55e"
          />
          <text
            x={position.x + ENTITY_WIDTH - 10}
            y={position.y + 14}
            fill="white"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none select-none"
          >
            +
          </text>
        </g>
      )}
    </motion.g>
  );
}

// =============================================================================
// Main Canvas Component
// =============================================================================

export function ERDCanvas({
  pathEntities,
  lastEntity,
  connectedEntities,
  onEntityClick,
  mode,
  height = 600,
}: ERDCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 0.9,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStart: null,
  });

  // Pre-calculate entity positions
  const entityPositions = useMemo(() => calculateEntityPositions(), []);

  // Determine status for each entity
  const entityStatuses = useMemo(() => {
    const statuses = new Map<NodeType, 'in-path' | 'connected' | 'available' | 'disabled'>();
    const pathSet = new Set(pathEntities);
    const connectedSet = new Set(connectedEntities);

    for (const entity of schemaEntities) {
      if (pathSet.has(entity.type)) {
        statuses.set(entity.type, 'in-path');
      } else if (pathEntities.length === 0 || connectedSet.has(entity.type)) {
        statuses.set(entity.type, pathEntities.length === 0 ? 'available' : 'connected');
      } else {
        statuses.set(entity.type, 'disabled');
      }
    }

    return statuses;
  }, [pathEntities, connectedEntities]);

  // Filter relations to show
  const visibleRelations = useMemo(() => {
    // Show all relations, highlight those in path or connected
    return schemaRelations.map(rel => {
      const sourceInPath = pathEntities.includes(rel.source);
      const targetInPath = pathEntities.includes(rel.target);
      const isInPath = sourceInPath && targetInPath;

      const isHighlighted = lastEntity && (
        (rel.source === lastEntity && connectedEntities.includes(rel.target)) ||
        (rel.target === lastEntity && connectedEntities.includes(rel.source))
      );

      return { relation: rel, isInPath, isHighlighted: !!isHighlighted };
    });
  }, [pathEntities, lastEntity, connectedEntities]);

  // Zoom handlers
  const handleZoom = useCallback((delta: number) => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.max(0.3, Math.min(2, prev.zoom + delta)),
    }));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, [handleZoom]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode === 'pan' || e.button === 1) { // Middle click or pan mode
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: { x: e.clientX - prev.panX, y: e.clientY - prev.panY },
      }));
    }
  }, [mode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (canvasState.isDragging && canvasState.dragStart) {
      setCanvasState(prev => ({
        ...prev,
        panX: e.clientX - prev.dragStart!.x,
        panY: e.clientY - prev.dragStart!.y,
      }));
    }
  }, [canvasState.isDragging, canvasState.dragStart]);

  const handleMouseUp = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      isDragging: false,
      dragStart: null,
    }));
  }, []);

  // Fit to view
  const fitToView = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: 0.85,
      panX: 20,
      panY: 20,
    }));
  }, []);

  // Calculate canvas size
  const canvasWidth = 800;
  const canvasHeight = Math.max(
    height,
    Math.max(...Array.from(entityPositions.values()).map(p => p.y)) + ENTITY_HEIGHT + 100
  );

  return (
    <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-800/90 backdrop-blur-sm rounded-lg p-1 border border-slate-700">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-slate-400" />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-slate-400" />
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          onClick={fitToView}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Fit to view"
        >
          <Maximize2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 z-10 px-2 py-1 bg-slate-800/90 backdrop-blur-sm rounded text-xs text-slate-400 border border-slate-700">
        {Math.round(canvasState.zoom * 100)}%
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 border border-slate-700 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-3 h-3 rounded border-2 border-emerald-500 bg-emerald-500/20" />
          <span>Connecté (cliquable)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-3 h-3 rounded border-2 border-indigo-500 bg-indigo-500/20" />
          <span>Dans le parcours</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-3 h-3 rounded border-2 border-slate-600 bg-slate-800/50" />
          <span>Non connecté</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: mode === 'pan' ? 'grab' : 'default' }}
        className="select-none"
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
            />
          </pattern>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Transform group for zoom/pan */}
        <g transform={`translate(${canvasState.panX}, ${canvasState.panY}) scale(${canvasState.zoom})`}>
          {/* Render relations first (behind entities) */}
          {visibleRelations.map(({ relation, isInPath, isHighlighted }) => {
            const sourcePos = entityPositions.get(relation.source);
            const targetPos = entityPositions.get(relation.target);

            if (!sourcePos || !targetPos) return null;

            return (
              <RelationPath
                key={relation.type}
                relation={relation}
                sourcePos={sourcePos}
                targetPos={targetPos}
                isHighlighted={isHighlighted}
                isInPath={isInPath}
              />
            );
          })}

          {/* Render entities */}
          {schemaEntities.map(entity => {
            const position = entityPositions.get(entity.type);
            if (!position) return null;

            const status = entityStatuses.get(entity.type) || 'disabled';
            const pathIndex = pathEntities.indexOf(entity.type);

            return (
              <EntityNode
                key={entity.type}
                entity={entity}
                position={position}
                status={status}
                pathIndex={pathIndex >= 0 ? pathIndex : undefined}
                onClick={() => onEntityClick(entity.type)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default ERDCanvas;
