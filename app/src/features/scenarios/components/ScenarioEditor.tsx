/**
 * KG-Oversight - Éditeur visuel de scénarios
 * Canvas de modélisation type entités-relations pour créer des scénarios
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Link2,
  MousePointer,
  Undo2,
  Redo2,
  Save,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GripVertical,
} from 'lucide-react';

import {
  isEditorOpenAtom,
  closeEditorAtom,
  resetEditorAtom,
  editorStateAtom,
  editorModeAtom,
  editorNodesAtom,
  editorConnectionsAtom,
  selectedNodeAtom,
  editorMetadataAtom,
  editorViewportAtom,
  canUndoAtom,
  canRedoAtom,
  isScenarioValidAtom,
  addNodeAtom,
  deleteNodeAtom,
  moveNodeAtom,
  selectNodeAtom,
  updateNodeDataAtom,
  addConnectionAtom,
  deleteConnectionAtom,
  startConnectingAtom,
  cancelConnectingAtom,
  updateMetadataAtom,
  updateViewportAtom,
  undoAtom,
  redoAtom,
  exportScenarioAtom,
  saveScenarioAtom,
} from '../stores/editorStore';
import { startScenarioAtom } from '../stores/scenarioStore';
import { stepTemplates } from '../types/editor';
import type { EditorStepNode, EditorConnection, EditorMode, Position } from '../types/editor';
import type { ScenarioStep } from '../types/scenario';
import { StepConfigPanel } from './StepConfigPanel';

// =============================================================================
// Constantes
// =============================================================================

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const CONNECTION_CURVE = 50;

// =============================================================================
// Composants de nœud
// =============================================================================

interface NodeComponentProps {
  node: EditorStepNode;
  isSelected: boolean;
  isConnecting: boolean;
  connectingFrom: string | null;
  mode: EditorMode;
  onSelect: () => void;
  onMove: (position: Position) => void;
  onDelete: () => void;
  onStartConnect: () => void;
  onEndConnect: () => void;
  zoom: number;
}

function NodeComponent({
  node,
  isSelected,
  isConnecting,
  connectingFrom,
  mode,
  onSelect,
  onMove,
  onDelete,
  onStartConnect,
  onEndConnect,
  zoom,
}: NodeComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode === 'delete') {
      onDelete();
      return;
    }

    if (mode === 'connect') {
      if (connectingFrom && connectingFrom !== node.id) {
        onEndConnect();
      } else if (!connectingFrom) {
        onStartConnect();
      }
      return;
    }

    // Mode select - déplacer ou sélectionner
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      nodeX: node.position.x,
      nodeY: node.position.y,
    });
  }, [mode, connectingFrom, node.id, node.position, onSelect, onDelete, onStartConnect, onEndConnect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;

    onMove({
      x: dragStart.nodeX + dx,
      y: dragStart.nodeY + dy,
    });
  }, [isDragging, dragStart, zoom, onMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const canBeConnected = isConnecting && connectingFrom && connectingFrom !== node.id;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: NODE_WIDTH,
      }}
      className={`
        group rounded-xl border-2 bg-slate-800/90 backdrop-blur-sm
        cursor-pointer select-none
        transition-colors
        ${isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : canBeConnected
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-600 hover:border-slate-500'
        }
        ${mode === 'delete' ? 'hover:border-red-500 hover:bg-red-500/10' : ''}
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Handle de drag */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-slate-500" />
      </div>

      {/* Point de connexion sortant (droite) */}
      <div
        className={`
          absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
          border-2 border-slate-500 bg-slate-700
          transition-colors cursor-crosshair
          ${mode === 'connect' ? 'hover:border-indigo-500 hover:bg-indigo-500/20' : ''}
        `}
        onClick={(e) => {
          e.stopPropagation();
          if (mode === 'connect' && !connectingFrom) {
            onStartConnect();
          }
        }}
      />

      {/* Point de connexion entrant (gauche) */}
      <div
        className={`
          absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
          border-2 border-slate-500 bg-slate-700
          transition-colors
          ${canBeConnected ? 'border-emerald-500 bg-emerald-500/20 cursor-pointer' : ''}
        `}
        onClick={(e) => {
          e.stopPropagation();
          if (canBeConnected) {
            onEndConnect();
          }
        }}
      />

      {/* Contenu */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-1">
          <span className="text-xs font-mono text-slate-500">
            {node.type === 'start' ? '▶' : node.type === 'end' ? '■' : '●'}
          </span>
          <h4 className="text-sm font-medium text-slate-200 line-clamp-1 flex-1">
            {node.data.title || 'Sans titre'}
          </h4>
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 pl-5">
          {node.data.description || 'Cliquez pour configurer...'}
        </p>

        {/* Actions */}
        {node.data.actions && node.data.actions.length > 0 && (
          <div className="flex items-center gap-1 mt-2 pl-5">
            {node.data.actions.slice(0, 3).map((action) => (
              <span
                key={action}
                className="px-1.5 py-0.5 text-[10px] rounded bg-slate-700 text-slate-400"
              >
                {action}
              </span>
            ))}
            {node.data.actions.length > 3 && (
              <span className="text-[10px] text-slate-500">+{node.data.actions.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Composant de connexion (flèche)
// =============================================================================

interface ConnectionComponentProps {
  connection: EditorConnection;
  sourceNode: EditorStepNode;
  targetNode: EditorStepNode;
  isSelected: boolean;
  mode: EditorMode;
  onSelect: () => void;
  onDelete: () => void;
}

function ConnectionComponent({
  connection,
  sourceNode,
  targetNode,
  isSelected,
  mode,
  onSelect,
  onDelete,
}: ConnectionComponentProps) {
  // Calculer les points de la courbe
  const sourceX = sourceNode.position.x + NODE_WIDTH;
  const sourceY = sourceNode.position.y + NODE_HEIGHT / 2;
  const targetX = targetNode.position.x;
  const targetY = targetNode.position.y + NODE_HEIGHT / 2;

  // Courbe de Bézier
  const controlX1 = sourceX + CONNECTION_CURVE;
  const controlY1 = sourceY;
  const controlX2 = targetX - CONNECTION_CURVE;
  const controlY2 = targetY;

  const path = `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;

  // Calculer la position de la flèche
  const arrowSize = 8;
  const arrowAngle = Math.atan2(targetY - controlY2, targetX - controlX2);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'delete') {
      onDelete();
    } else {
      onSelect();
    }
  };

  return (
    <g onClick={handleClick} className="cursor-pointer">
      {/* Ligne invisible pour faciliter le clic */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
      />

      {/* Ligne visible */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? '#6366f1' : mode === 'delete' ? '#ef4444' : '#475569'}
        strokeWidth={2}
        strokeDasharray={isSelected ? '0' : '0'}
        className={`transition-colors ${mode === 'delete' ? 'hover:stroke-red-500' : 'hover:stroke-indigo-400'}`}
      />

      {/* Flèche */}
      <polygon
        points={`
          ${targetX},${targetY}
          ${targetX - arrowSize * Math.cos(arrowAngle - Math.PI / 6)},${targetY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)}
          ${targetX - arrowSize * Math.cos(arrowAngle + Math.PI / 6)},${targetY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)}
        `}
        fill={isSelected ? '#6366f1' : mode === 'delete' ? '#ef4444' : '#475569'}
        className={`transition-colors ${mode === 'delete' ? 'hover:fill-red-500' : 'hover:fill-indigo-400'}`}
      />

      {/* Label */}
      {connection.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2 - 10}
          textAnchor="middle"
          className="text-xs fill-slate-400"
        >
          {connection.label}
        </text>
      )}
    </g>
  );
}

// =============================================================================
// Toolbar
// =============================================================================

interface ToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreview: () => void;
  isValid: boolean;
  isDirty: boolean;
}

function Toolbar({
  mode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onPreview,
  isValid,
  isDirty,
}: ToolbarProps) {
  const modes: { id: EditorMode; icon: typeof MousePointer; label: string }[] = [
    { id: 'select', icon: MousePointer, label: 'Sélectionner' },
    { id: 'add-step', icon: Plus, label: 'Ajouter étape' },
    { id: 'connect', icon: Link2, label: 'Connecter' },
    { id: 'delete', icon: Trash2, label: 'Supprimer' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-800/50 border-b border-slate-700">
      {/* Modes d'édition */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-lg">
        {modes.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={`
              p-2 rounded-md transition-colors
              ${mode === id
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
              }
            `}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-slate-700" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-md text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Annuler (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-md text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Rétablir (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={onPreview}
        disabled={!isValid}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Tester le scénario"
      >
        <Play className="w-4 h-4" />
        <span className="text-sm">Tester</span>
      </button>

      <button
        onClick={onSave}
        disabled={!isValid}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md
          ${isDirty
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }
          disabled:opacity-30 disabled:cursor-not-allowed
        `}
        title="Sauvegarder (Ctrl+S)"
      >
        <Save className="w-4 h-4" />
        <span className="text-sm">Sauvegarder</span>
      </button>
    </div>
  );
}

// =============================================================================
// Panneau de templates
// =============================================================================

interface TemplatesPanelProps {
  onAddTemplate: (template: typeof stepTemplates[0]) => void;
}

function TemplatesPanel({ onAddTemplate }: TemplatesPanelProps) {
  return (
    <div className="w-64 bg-slate-800/50 border-r border-slate-700 overflow-y-auto">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-sm font-medium text-slate-300">Templates d'étapes</h3>
        <p className="text-xs text-slate-500 mt-1">
          Glissez ou cliquez pour ajouter
        </p>
      </div>

      <div className="p-2 space-y-2">
        {stepTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onAddTemplate(template)}
            className="w-full p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-400 text-sm">●</span>
              <span className="text-sm font-medium text-slate-200">
                {template.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 pl-5">
              {template.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Composant principal
// =============================================================================

export function ScenarioEditor() {
  const isOpen = useAtomValue(isEditorOpenAtom);
  const closeEditor = useSetAtom(closeEditorAtom);
  const resetEditor = useSetAtom(resetEditorAtom);

  const state = useAtomValue(editorStateAtom);
  const [mode, setMode] = useAtom(editorModeAtom);
  const nodes = useAtomValue(editorNodesAtom);
  const connections = useAtomValue(editorConnectionsAtom);
  const selectedNode = useAtomValue(selectedNodeAtom);
  const metadata = useAtomValue(editorMetadataAtom);
  const viewport = useAtomValue(editorViewportAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const isValid = useAtomValue(isScenarioValidAtom);
  const exportedScenario = useAtomValue(exportScenarioAtom);

  const addNode = useSetAtom(addNodeAtom);
  const deleteNode = useSetAtom(deleteNodeAtom);
  const moveNode = useSetAtom(moveNodeAtom);
  const selectNode = useSetAtom(selectNodeAtom);
  const updateNodeData = useSetAtom(updateNodeDataAtom);
  const addConnection = useSetAtom(addConnectionAtom);
  const deleteConnection = useSetAtom(deleteConnectionAtom);
  const startConnecting = useSetAtom(startConnectingAtom);
  const cancelConnecting = useSetAtom(cancelConnectingAtom);
  const updateMetadata = useSetAtom(updateMetadataAtom);
  const updateViewport = useSetAtom(updateViewportAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const saveScenario = useSetAtom(saveScenarioAtom);
  const startScenario = useSetAtom(startScenarioAtom);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Map des nœuds pour les connexions
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  // Gestionnaire de clic sur le canvas
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;

    if (mode === 'add-step') {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewport.panX) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.panY) / viewport.zoom;
      addNode({ position: { x, y } });
      setMode('select');
    } else {
      selectNode(null);
      cancelConnecting();
    }
  }, [mode, viewport, addNode, selectNode, cancelConnecting, setMode]);

  // Gestionnaire de zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(2, viewport.zoom + delta));
    updateViewport({ zoom: newZoom });
  }, [viewport.zoom, updateViewport]);

  // Gestionnaire de pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current && mode === 'select')) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        panX: viewport.panX,
        panY: viewport.panY,
      });
    }
  }, [mode, viewport.panX, viewport.panY]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning || !panStart) return;

    updateViewport({
      panX: panStart.panX + e.clientX - panStart.x,
      panY: panStart.panY + e.clientY - panStart.y,
    });
  }, [isPanning, panStart, updateViewport]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 's') {
          e.preventDefault();
          if (isValid) saveScenario();
        }
      } else if (e.key === 'Escape') {
        if (state.connectingFromId) {
          cancelConnecting();
        } else if (selectedNode) {
          selectNode(null);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode && document.activeElement?.tagName !== 'INPUT') {
          deleteNode(selectedNode.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, state.connectingFromId, selectedNode, isValid, undo, redo, saveScenario, cancelConnecting, selectNode, deleteNode]);

  // Ajouter un template
  const handleAddTemplate = useCallback((template: typeof stepTemplates[0]) => {
    addNode({
      position: { x: 300 + nodes.length * 50, y: 200 + nodes.length * 30 },
    });
    // Mettre à jour le dernier nœud ajouté avec les données du template
    const lastNode = nodes[nodes.length - 1];
    if (lastNode) {
      updateNodeData({ id: lastNode.id, data: template.defaultData });
    }
  }, [addNode, nodes, updateNodeData]);

  // Tester le scénario
  const handlePreview = useCallback(() => {
    startScenario(exportedScenario);
    closeEditor();
  }, [exportedScenario, startScenario, closeEditor]);

  // Sauvegarder
  const handleSave = useCallback(() => {
    saveScenario();
  }, [saveScenario]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <button
              onClick={closeEditor}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div>
              <input
                type="text"
                value={metadata.title || ''}
                onChange={(e) => updateMetadata({ title: e.target.value })}
                placeholder="Nom du scénario..."
                className="text-lg font-semibold text-slate-200 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-500"
              />
              <input
                type="text"
                value={metadata.description || ''}
                onChange={(e) => updateMetadata({ description: e.target.value })}
                placeholder="Description..."
                className="block text-sm text-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-600 w-96"
              />
            </div>
          </div>

          {state.isDirty && (
            <span className="text-xs text-amber-400">● Non sauvegardé</span>
          )}
        </div>

        {/* Toolbar */}
        <Toolbar
          mode={mode}
          onModeChange={setMode}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onSave={handleSave}
          onPreview={handlePreview}
          isValid={isValid}
          isDirty={state.isDirty}
        />

        {/* Contenu */}
        <div className="flex-1 flex overflow-hidden">
          {/* Templates */}
          <TemplatesPanel onAddTemplate={handleAddTemplate} />

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden bg-slate-950">
            {/* Grille de fond */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #334155 1px, transparent 1px),
                  linear-gradient(to bottom, #334155 1px, transparent 1px)
                `,
                backgroundSize: `${40 * viewport.zoom}px ${40 * viewport.zoom}px`,
                backgroundPosition: `${viewport.panX}px ${viewport.panY}px`,
              }}
            />

            {/* Zone de dessin */}
            <div
              ref={canvasRef}
              className={`
                absolute inset-0
                ${mode === 'add-step' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'}
              `}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
            >
              <div
                style={{
                  transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
                  transformOrigin: '0 0',
                }}
              >
                {/* Connexions (SVG) */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ overflow: 'visible' }}
                >
                  <g className="pointer-events-auto">
                    {connections.map((conn) => {
                      const sourceNode = nodeMap.get(conn.sourceId);
                      const targetNode = nodeMap.get(conn.targetId);
                      if (!sourceNode || !targetNode) return null;

                      return (
                        <ConnectionComponent
                          key={conn.id}
                          connection={conn}
                          sourceNode={sourceNode}
                          targetNode={targetNode}
                          isSelected={state.selectedConnectionId === conn.id}
                          mode={mode}
                          onSelect={() => selectNode(null)}
                          onDelete={() => deleteConnection(conn.id)}
                        />
                      );
                    })}
                  </g>
                </svg>

                {/* Nœuds */}
                <AnimatePresence>
                  {nodes.map((node) => (
                    <NodeComponent
                      key={node.id}
                      node={node}
                      isSelected={state.selectedNodeId === node.id}
                      isConnecting={mode === 'connect'}
                      connectingFrom={state.connectingFromId}
                      mode={mode}
                      onSelect={() => selectNode(node.id)}
                      onMove={(pos) => moveNode({ id: node.id, position: pos })}
                      onDelete={() => deleteNode(node.id)}
                      onStartConnect={() => startConnecting(node.id)}
                      onEndConnect={() => {
                        if (state.connectingFromId) {
                          addConnection({ sourceId: state.connectingFromId, targetId: node.id });
                        }
                      }}
                      zoom={viewport.zoom}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Contrôles de zoom */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => updateViewport({ zoom: Math.min(2, viewport.zoom + 0.1) })}
                className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => updateViewport({ zoom: Math.max(0.25, viewport.zoom - 0.1) })}
                className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ZoomOut className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => updateViewport({ zoom: 1, panX: 0, panY: 0 })}
                className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-slate-400" />
              </button>
              <div className="text-xs text-slate-500 text-center">
                {Math.round(viewport.zoom * 100)}%
              </div>
            </div>

            {/* Indicateur de mode */}
            <div className="absolute bottom-4 left-4 px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg">
              <span className="text-xs text-slate-400">
                {mode === 'select' && 'Mode: Sélection'}
                {mode === 'add-step' && 'Mode: Cliquez pour ajouter une étape'}
                {mode === 'connect' && (state.connectingFromId ? 'Cliquez sur une cible' : 'Cliquez sur une source')}
                {mode === 'delete' && 'Mode: Suppression'}
              </span>
            </div>

            {/* Instructions */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <Plus className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">
                    Commencez votre scénario
                  </h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Utilisez les templates à gauche ou passez en mode "Ajouter" et cliquez sur le canvas.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Panneau de configuration */}
          <AnimatePresence>
            {selectedNode && (
              <StepConfigPanel
                node={selectedNode}
                onUpdate={(data) => updateNodeData({ id: selectedNode.id, data })}
                onClose={() => selectNode(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ScenarioEditor;
