/**
 * KG-Oversight - ScenarioPlayer
 * Composant principal pour la lecture des scénarios guidés
 * Navigation étape par étape avec highlight et centrage automatique
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Info,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Circle,
  Clock,
  Tag,
} from 'lucide-react';
import {
  currentScenarioAtom,
  currentStepAtom,
  currentStepIndexAtom,
  playerStateAtom,
  isFullscreenAtom,
  isScenarioPanelOpenAtom,
  canGoNextAtom,
  canGoPrevAtom,
  nextStepAtom,
  prevStepAtom,
  stopScenarioAtom,
  toggleFullscreenAtom,
  goToStepAtom,
  resolveNodeSelector,
} from '../stores/scenarioStore';
import {
  allNodesAtom,
  allEdgesAtom,
  highlightedNodeIdsAtom,
  selectedNodeIdsAtom,
} from '@shared/stores/selectionAtoms';
import type { ScenarioStep } from '../types/scenario';

// =============================================================================
// Sous-composants
// =============================================================================

function StepProgress({ current, total }: { current: number; total: number }) {
  const percentage = ((current + 1) / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
        {current + 1} / {total}
      </span>
    </div>
  );
}

function StepTimeline({
  steps,
  currentIndex,
  onGoToStep,
}: {
  steps: ScenarioStep[];
  currentIndex: number;
  onGoToStep: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <button
            key={step.id}
            onClick={() => onGoToStep(index)}
            className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-200 text-xs font-medium
              ${isCurrent ? 'bg-indigo-500 text-white ring-2 ring-indigo-500/50' : ''}
              ${isCompleted ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : ''}
              ${isPending ? 'bg-slate-700 text-slate-500 hover:bg-slate-600' : ''}
            `}
            title={step.title}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </button>
        );
      })}
    </div>
  );
}

function InsightBadge({
  insight,
}: {
  insight: { label: string; value: string | number; severity?: 'info' | 'warning' | 'critical' };
}) {
  const colors = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    critical: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const icons = {
    info: <Info className="w-3 h-3" />,
    warning: <AlertCircle className="w-3 h-3" />,
    critical: <AlertTriangle className="w-3 h-3" />,
  };

  const severity = insight.severity || 'info';

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1 rounded-lg border text-xs
        ${colors[severity]}
      `}
    >
      {icons[severity]}
      <span className="opacity-70">{insight.label}:</span>
      <span className="font-medium">{insight.value}</span>
    </div>
  );
}

function TipsList({ tips }: { tips: string[] }) {
  return (
    <div className="space-y-2">
      {tips.map((tip, index) => (
        <div
          key={index}
          className="flex items-start gap-2 text-sm text-slate-400"
        >
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>{tip}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Composant principal
// =============================================================================

interface ScenarioPlayerProps {
  onCenterOnNodes?: (nodeIds: string[]) => void;
}

export function ScenarioPlayer({ onCenterOnNodes }: ScenarioPlayerProps) {
  const scenario = useAtomValue(currentScenarioAtom);
  const currentStep = useAtomValue(currentStepAtom);
  const [currentStepIndex, setCurrentStepIndex] = useAtom(currentStepIndexAtom);
  const playerState = useAtomValue(playerStateAtom);
  const [isFullscreen, setIsFullscreen] = useAtom(isFullscreenAtom);
  const [isPanelOpen, setIsPanelOpen] = useAtom(isScenarioPanelOpenAtom);
  const canGoNext = useAtomValue(canGoNextAtom);
  const canGoPrev = useAtomValue(canGoPrevAtom);

  const nextStep = useSetAtom(nextStepAtom);
  const prevStep = useSetAtom(prevStepAtom);
  const stopScenario = useSetAtom(stopScenarioAtom);
  const goToStep = useSetAtom(goToStepAtom);

  const allNodes = useAtomValue(allNodesAtom);
  const allEdges = useAtomValue(allEdgesAtom);
  const setHighlightedNodes = useSetAtom(highlightedNodeIdsAtom);
  const setSelectedNodes = useSetAtom(selectedNodeIdsAtom);

  // Résoudre les nœuds de l'étape courante
  const currentNodeIds = useMemo(() => {
    if (!currentStep) return new Set<string>();
    return resolveNodeSelector(currentStep.nodeSelector, allNodes, allEdges);
  }, [currentStep, allNodes, allEdges]);

  // Appliquer le highlight quand l'étape change
  useEffect(() => {
    if (playerState === 'playing' && currentStep) {
      const nodeIds = currentNodeIds;

      console.log('[ScenarioPlayer] Step:', currentStep.title);
      console.log('[ScenarioPlayer] NodeSelector:', currentStep.nodeSelector);
      console.log('[ScenarioPlayer] Found nodes:', nodeIds.size, Array.from(nodeIds).slice(0, 5));
      console.log('[ScenarioPlayer] All nodes count:', allNodes.size);

      // Appliquer les actions
      if (currentStep.actions.includes('highlight')) {
        console.log('[ScenarioPlayer] Setting highlighted nodes:', nodeIds.size);
        setHighlightedNodes(nodeIds);
      }

      if (currentStep.actions.includes('select') && nodeIds.size > 0) {
        setSelectedNodes(nodeIds);
      }

      // Centrer la caméra si demandé
      if (
        (currentStep.actions.includes('focus') || currentStep.config?.autoZoom) &&
        nodeIds.size > 0 &&
        onCenterOnNodes
      ) {
        onCenterOnNodes(Array.from(nodeIds));
      }
    }
  }, [currentStep, currentNodeIds, playerState, setHighlightedNodes, setSelectedNodes, onCenterOnNodes, allNodes.size]);

  // Nettoyer au démontage ou à l'arrêt
  useEffect(() => {
    return () => {
      setHighlightedNodes(new Set());
    };
  }, [setHighlightedNodes]);

  // Handlers
  const handleClose = useCallback(() => {
    stopScenario();
    setHighlightedNodes(new Set());
    setIsPanelOpen(false);
  }, [stopScenario, setHighlightedNodes, setIsPanelOpen]);

  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleGoToStep = useCallback(
    (index: number) => {
      goToStep(index);
    },
    [goToStep]
  );

  const handleRestart = useCallback(() => {
    goToStep(0);
  }, [goToStep]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen, setIsFullscreen]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPanelOpen || playerState === 'idle') return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          if (canGoNext) handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (canGoPrev) handlePrev();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            handleClose();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleToggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, playerState, canGoNext, canGoPrev, isFullscreen, handleNext, handlePrev, handleClose, handleToggleFullscreen, setIsFullscreen]);

  if (!scenario || !isPanelOpen) return null;

  const isCompleted = playerState === 'completed';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`
          fixed z-40 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl flex flex-col
          ${isFullscreen
            ? 'inset-4 rounded-2xl border'
            : 'top-14 right-0 bottom-0 w-80 lg:w-96'
          }
        `}
      >
        {/* Header compact */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${scenario.metadata.color}20` }}
            >
              <Play
                className="w-4 h-4"
                style={{ color: scenario.metadata.color }}
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-medium text-slate-200 text-sm truncate">
                {scenario.metadata.title}
              </h2>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{scenario.metadata.estimatedDuration} min</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Réduire (F)' : 'Agrandir (F)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-slate-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Fermer (Echap)"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Progress compact */}
        <div className="px-3 py-2 border-b border-slate-700/50">
          <StepProgress
            current={currentStepIndex}
            total={scenario.steps.length}
          />
        </div>

        {/* Step Timeline - horizontal scroll */}
        <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-800/30 overflow-x-auto">
          <StepTimeline
            steps={scenario.steps}
            currentIndex={currentStepIndex}
            onGoToStep={handleGoToStep}
          />
        </div>

        {/* Content - flex-1 pour prendre l'espace restant */}
        <div className={`flex-1 overflow-y-auto p-3 ${isFullscreen ? '' : ''}`}>
          {isCompleted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-1">
                Scénario terminé !
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {scenario.steps.length} étapes parcourues
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recommencer
                </button>
                <button
                  onClick={handleClose}
                  className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                >
                  Terminer
                </button>
              </div>
            </div>
          ) : currentStep ? (
            <div className="space-y-3">
              {/* Step title */}
              <div>
                <h3 className="text-base font-semibold text-slate-200 mb-1">
                  {currentStep.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{currentStep.description}</p>
              </div>

              {/* Nodes count - badge orange */}
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md text-xs font-medium">
                <Circle className="w-3 h-3 fill-current" />
                <span>{currentNodeIds.size} nœud(s) en surbrillance</span>
              </div>

              {/* Insights */}
              {currentStep.insights && currentStep.insights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentStep.insights.map((insight, index) => (
                    <InsightBadge key={index} insight={insight} />
                  ))}
                </div>
              )}

              {/* Tips */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                  <TipsList tips={currentStep.tips} />
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Navigation - fixe en bas */}
        {!isCompleted && (
          <div className="flex items-center justify-between p-3 border-t border-slate-700 bg-slate-800/50">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="flex items-center gap-1 px-3 py-1.5 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Préc.</span>
            </button>

            <span className="text-xs text-slate-500">
              ← → naviguer
            </span>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
            >
              {canGoNext ? (
                <>
                  <span className="hidden sm:inline">Suiv.</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Fin</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default ScenarioPlayer;
