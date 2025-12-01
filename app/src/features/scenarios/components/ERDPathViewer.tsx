/**
 * KG-Oversight - Visualisation ERD dynamique du parcours de scénario
 * Affiche le parcours sous forme de diagramme avec animations
 */

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronRight,
  Users,
  CheckCircle2,
  Filter,
  Layers,
} from 'lucide-react';
import type { ERDPathStep } from '../stores/erdEditorStore';
import { getEntityByType, schemaRelations } from '../data/schemaDefinition';
import type { NodeType } from '@data/types/entities';

// Icônes mapping (même que ERDScenarioEditor)
import {
  Building2,
  FileText,
  FileCheck,
  FlaskConical,
  ClipboardCheck,
  Search,
  AlertTriangle,
  AlertCircle,
  Gavel,
  Shield,
  Scale,
  BarChart3,
  Bell,
  Calendar,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  FileText,
  FileCheck,
  FlaskConical,
  Layers,
  ClipboardCheck,
  Search,
  AlertTriangle,
  AlertCircle,
  Users,
  Gavel,
  Shield,
  Scale,
  BarChart3,
  Bell,
  Calendar,
};

function EntityIcon({ iconName, className, style }: { iconName: string; className?: string; style?: React.CSSProperties }) {
  const Icon = iconMap[iconName] || Building2;
  return <Icon className={className} style={style} />;
}

// =============================================================================
// Types
// =============================================================================

interface ERDPathViewerProps {
  path: ERDPathStep[];
  currentStepIndex?: number;
  onStepClick?: (index: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onReset?: () => void;
  showControls?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

// =============================================================================
// Composant Nœud ERD
// =============================================================================

interface ERDNodeProps {
  step: ERDPathStep;
  index: number;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
  onClick?: () => void;
  totalInstances?: number;
}

function ERDNode({ step, index, isActive, isPast, isFuture, onClick, totalInstances }: ERDNodeProps) {
  const entity = getEntityByType(step.entityType);

  const stateStyles = {
    active: {
      scale: 1.1,
      boxShadow: `0 0 30px ${entity?.color}60, 0 0 60px ${entity?.color}30`,
    },
    past: {
      scale: 1,
      opacity: 0.7,
    },
    future: {
      scale: 1,
      opacity: 0.4,
    },
  };

  const currentState = isActive ? 'active' : isPast ? 'past' : 'future';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: stateStyles[currentState].scale,
        opacity: stateStyles[currentState].opacity ?? 1,
        boxShadow: isActive ? stateStyles.active.boxShadow : 'none',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={`
        relative cursor-pointer transition-all duration-300
        ${isActive ? 'z-20' : 'z-10'}
      `}
    >
      {/* Numéro d'étape */}
      <motion.div
        animate={{
          scale: isActive ? 1.2 : 1,
          backgroundColor: isActive ? entity?.color : isPast ? '#10b981' : '#475569',
        }}
        className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg z-30"
      >
        {isPast ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
      </motion.div>

      {/* Carte principale */}
      <motion.div
        animate={{
          borderColor: isActive ? entity?.color : isPast ? '#10b981' : '#334155',
          backgroundColor: isActive ? `${entity?.color}15` : isPast ? 'rgba(16, 185, 129, 0.05)' : 'rgba(30, 41, 59, 0.8)',
        }}
        className="relative p-5 rounded-2xl border-2 min-w-[180px] backdrop-blur-sm"
      >
        {/* Icône et nom */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{
              backgroundColor: `${entity?.color}25`,
              scale: isActive ? 1.1 : 1,
            }}
            className="w-16 h-16 rounded-xl flex items-center justify-center"
          >
            <EntityIcon
              iconName={entity?.icon || 'Building2'}
              className="w-8 h-8"
              style={{ color: entity?.color }}
            />
          </motion.div>

          <div className="text-center">
            <p className="font-semibold text-slate-200">{entity?.label}</p>
            {step.description && (
              <p className="text-xs text-slate-400 mt-1 max-w-[150px] line-clamp-2">
                {step.description}
              </p>
            )}
          </div>

          {/* Indicateur de sélection */}
          <div className="flex items-center gap-1.5 text-xs">
            {step.selectionMode === 'all' && (
              <span className="flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
                <Layers className="w-3 h-3" />
                Tous{totalInstances ? ` (${totalInstances})` : ''}
              </span>
            )}
            {step.selectionMode === 'specific' && step.selectedNodeIds && (
              <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {step.selectedNodeIds.length} sélectionné{step.selectedNodeIds.length > 1 ? 's' : ''}
              </span>
            )}
            {step.selectionMode === 'filtered' && step.filters && (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full">
                <Filter className="w-3 h-3" />
                {step.filters.length} filtre{step.filters.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Effet de pulsation pour l'étape active */}
        {isActive && (
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-2xl border-2"
            style={{ borderColor: entity?.color }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Composant Connexion (flèche animée)
// =============================================================================

interface ERDConnectionProps {
  fromStep: ERDPathStep;
  toStep: ERDPathStep;
  isActive: boolean;
  isPast: boolean;
}

function ERDConnection({ fromStep, toStep, isActive, isPast }: ERDConnectionProps) {
  const relation = schemaRelations.find(
    (r) =>
      (r.source === fromStep.entityType && r.target === toStep.entityType) ||
      (r.target === fromStep.entityType && r.source === toStep.entityType)
  );

  return (
    <div className="flex flex-col items-center justify-center px-4 min-w-[120px]">
      {/* Label de relation */}
      <motion.span
        animate={{
          opacity: isActive ? 1 : isPast ? 0.6 : 0.3,
          scale: isActive ? 1.05 : 1,
        }}
        className="text-[10px] text-slate-400 text-center mb-2 max-w-[100px] leading-tight"
      >
        {relation?.label || 'lié à'}
      </motion.span>

      {/* Flèche SVG animée */}
      <svg width="80" height="24" viewBox="0 0 80 24" className="overflow-visible">
        {/* Ligne de base */}
        <motion.line
          x1="0"
          y1="12"
          x2="65"
          y2="12"
          stroke={isPast ? '#10b981' : isActive ? '#6366f1' : '#475569'}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* Pointe de flèche */}
        <motion.polygon
          points="65,6 80,12 65,18"
          fill={isPast ? '#10b981' : isActive ? '#6366f1' : '#475569'}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />

        {/* Animation de flux (particule) */}
        {isActive && (
          <motion.circle
            r="4"
            fill="#6366f1"
            initial={{ cx: 0, cy: 12 }}
            animate={{ cx: [0, 70, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </svg>

      {/* Cardinality */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0.5 }}
        className="flex items-center gap-4 mt-2 text-[10px] text-slate-500"
      >
        <span>{relation?.sourceCardinality || '1'}</span>
        <span>{relation?.targetCardinality || '*'}</span>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Composant Principal
// =============================================================================

export function ERDPathViewer({
  path,
  currentStepIndex = 0,
  onStepClick,
  isPlaying = false,
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  showControls = true,
  autoPlay = false,
  autoPlayInterval = 2000,
}: ERDPathViewerProps) {
  const [internalStepIndex, setInternalStepIndex] = useState(currentStepIndex);
  const [internalPlaying, setInternalPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs pour auto-scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const activeIndex = currentStepIndex ?? internalStepIndex;
  const playing = isPlaying ?? internalPlaying;

  // Auto-scroll vers le nœud actif
  useEffect(() => {
    const activeNode = nodeRefs.current.get(activeIndex);
    if (activeNode && containerRef.current) {
      activeNode.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [activeIndex]);

  // Auto-play logic
  useEffect(() => {
    if (!playing || path.length === 0) return;

    const timer = setInterval(() => {
      if (onNext) {
        onNext();
      } else {
        setInternalStepIndex((prev) => (prev + 1) % path.length);
      }
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [playing, path.length, autoPlayInterval, onNext]);

  const handlePlayPause = useCallback(() => {
    if (onPlayPause) {
      onPlayPause();
    } else {
      setInternalPlaying((prev) => !prev);
    }
  }, [onPlayPause]);

  const handleNext = useCallback(() => {
    if (onNext) {
      onNext();
    } else {
      setInternalStepIndex((prev) => Math.min(prev + 1, path.length - 1));
    }
  }, [onNext, path.length]);

  const handlePrev = useCallback(() => {
    if (onPrev) {
      onPrev();
    } else {
      setInternalStepIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [onPrev]);

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    } else {
      setInternalStepIndex(0);
      setInternalPlaying(false);
    }
  }, [onReset]);

  if (path.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>Ajoutez des entités pour visualiser le parcours</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : ''}`}>
      {/* Header avec contrôles */}
      {showControls && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Étape {activeIndex + 1} / {path.length}
            </span>
            <div className="h-1.5 w-32 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                animate={{ width: `${((activeIndex + 1) / path.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Précédent"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              title={playing ? 'Pause' : 'Lecture'}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleNext}
              disabled={activeIndex === path.length - 1}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Suivant"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Réduire' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Zone de visualisation */}
      <div ref={containerRef} className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <div className="flex items-center justify-center min-w-max h-full">
          <AnimatePresence mode="wait">
            {path.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center"
                ref={(el) => {
                  if (el) nodeRefs.current.set(index, el);
                }}
              >
                <ERDNode
                  step={step}
                  index={index}
                  isActive={index === activeIndex}
                  isPast={index < activeIndex}
                  isFuture={index > activeIndex}
                  onClick={() => onStepClick?.(index)}
                />

                {index < path.length - 1 && (
                  <ERDConnection
                    fromStep={step}
                    toStep={path[index + 1]}
                    isActive={index === activeIndex}
                    isPast={index < activeIndex}
                  />
                )}
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline en bas */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-2">
          {path.map((step, index) => {
            const entity = getEntityByType(step.entityType);
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <button
                key={step.id}
                onClick={() => onStepClick?.(index)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
                  ${isActive
                    ? 'bg-indigo-500/20 border border-indigo-500/50'
                    : isPast
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                  }
                `}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${entity?.color}30` }}
                >
                  <EntityIcon
                    iconName={entity?.icon || 'Building2'}
                    className="w-3 h-3"
                    style={{ color: entity?.color }}
                  />
                </div>
                <span className={`text-xs ${isActive ? 'text-indigo-300' : isPast ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {entity?.label}
                </span>
                {index < path.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ERDPathViewer;
