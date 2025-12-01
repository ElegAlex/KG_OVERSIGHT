/**
 * KG-Oversight - Application principale
 * Knowledge Graph pour la supervision qualité des sous-traitants
 * Design System moderne inspiré Linear/Vercel/Arc
 */

import { Provider as JotaiProvider, useSetAtom, useAtomValue, useAtom } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  GraphCanvas,
  NodeDetailsPanel,
  FilterPanel,
  GraphControls,
  GraphLegend,
  LayoutSelector,
  ExportDialog,
  exportGraph,
  generateFilename,
  type LayoutType,
  type GraphCanvasRef,
} from '@features/graph';
import { KQIPanel } from '@features/kqi';
import { TimelineContainer } from '@features/timeline';
import { KQIDashboard } from '@features/dashboard';
import { AlertsPanel, getRuleEngine, setAlertsAtom, alertsPanelOpenAtom, alertsCountByLevelAtom } from '@features/inference';
import { ImportWizard } from '@features/import';
import { ScenarioSelector, ScenarioPlayer, ScenarioEditor, ERDScenarioEditor } from '@features/scenarios';
import { Header } from '@/components/layout';
import { UpdateChecker } from '@shared/components/UpdateChecker';
import {
  allNodesAtom,
  allEdgesAtom,
  filteredNodesAtom,
  selectedStudyIdAtom,
} from '@shared/stores/selectionAtoms';
import { themeAtom } from '@shared/stores/themeAtom';
import { loadAllData } from '@features/import/services/dataLoader';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { GraphNode } from '@data/types';
import './styles/globals.css';

// Client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Loader moderne avec animation
function ModernLoader({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
          </div>
        </div>
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Erreur moderne
function ModernError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center p-8 glass-card max-w-md">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
          <div className="relative text-red-400 text-5xl">⚠</div>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Erreur de chargement
        </h2>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="btn-primary px-6 py-2"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const setAllNodes = useSetAtom(allNodesAtom);
  const setAllEdges = useSetAtom(allEdgesAtom);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalNodes, setTotalNodes] = useState(0);
  const [totalEdges, setTotalEdges] = useState(0);
  const [allNodesData, setAllNodesData] = useState<Map<string, GraphNode>>(new Map());
  const [allEdgesData, setAllEdgesData] = useState<Map<string, any>>(new Map());
  const filteredNodes = useAtomValue(filteredNodesAtom);
  const selectedStudyId = useAtomValue(selectedStudyIdAtom);
  const [theme] = useAtom(themeAtom);

  // Ref pour les contrôles du graphe
  const graphCanvasRef = useRef<GraphCanvasRef>(null);

  // État du dashboard KQI
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // État du dialogue d'export
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // État du wizard d'import
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

  // État du sélecteur de scénarios
  const [isScenarioSelectorOpen, setIsScenarioSelectorOpen] = useState(false);

  // Layout actuel
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('forceAtlas2');

  // Alertes
  const setAlerts = useSetAtom(setAlertsAtom);
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useAtom(alertsPanelOpenAtom);
  const alertsCounts = useAtomValue(alertsCountByLevelAtom);

  // Appliquer le thème au chargement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Calculer les stats
  const stats = useMemo(() => {
    let alertCount = 0;
    let criticalCount = 0;
    let stCount = 0;

    for (const [, node] of allNodesData) {
      if (node._type === 'Alerte') alertCount++;
      if (node.criticite === 'Critique') criticalCount++;
      if (node._type === 'SousTraitant') stCount++;
    }

    return { alertCount, criticalCount, stCount };
  }, [allNodesData]);

  // Charger les données depuis les fichiers CSV
  useEffect(() => {
    async function loadData() {
      try {
        const { nodes, edges } = await loadAllData();
        setAllNodes(nodes);
        setAllEdges(edges);
        setAllNodesData(nodes);
        setAllEdgesData(edges);
        setTotalNodes(nodes.size);
        setTotalEdges(edges.size);
        setIsLoaded(true);

        // Exécuter le moteur de règles pour générer les alertes
        const ruleEngine = getRuleEngine();
        const result = ruleEngine.evaluateAll(nodes, edges);
        setAlerts(result.alerts);
        console.log(`[App] Rule engine: ${result.alerts.length} alerts generated in ${result.executionTimeMs}ms`);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoadError(error instanceof Error ? error.message : 'Erreur inconnue');
      }
    }

    loadData();
  }, [setAllNodes, setAllEdges, setAlerts]);

  // Callbacks pour les contrôles du graphe
  const handleZoomIn = useCallback(() => {
    graphCanvasRef.current?.getSigma()?.getCamera().animatedZoom({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    graphCanvasRef.current?.getSigma()?.getCamera().animatedUnzoom({ duration: 300 });
  }, []);

  const handleFitToView = useCallback(() => {
    graphCanvasRef.current?.getSigma()?.getCamera().animate(
      { x: 0.5, y: 0.5, ratio: 1 },
      { duration: 500 }
    );
  }, []);

  const handleResetLayout = useCallback(() => {
    graphCanvasRef.current?.applyLayout(currentLayout);
  }, [currentLayout]);

  // Changement de layout
  const handleLayoutChange = useCallback((layout: LayoutType) => {
    setCurrentLayout(layout);
    graphCanvasRef.current?.applyLayout(layout);
  }, []);

  // Export du graphe
  const handleExport = useCallback(async (options: Parameters<typeof exportGraph>[2]) => {
    const sigma = graphCanvasRef.current?.getSigma();
    const graph = graphCanvasRef.current?.getGraph();
    if (!sigma || !graph) return;

    await exportGraph(sigma, graph, {
      ...options,
      filename: generateFilename('kg-oversight'),
    });
  }, []);

  if (loadError) {
    return <ModernError message={loadError} onRetry={() => window.location.reload()} />;
  }

  if (!isLoaded) {
    return <ModernLoader message="Chargement des données CSV..." />;
  }

  return (
    <div className="app-layout-v2">
      {/* Header moderne */}
      <Header
        totalNodes={totalNodes}
        filteredNodes={filteredNodes.size}
        totalEdges={totalEdges}
        stCount={stats.stCount}
        alertCount={alertsCounts.total}
        criticalCount={alertsCounts.haute}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenAlerts={() => setIsAlertsPanelOpen(true)}
        onOpenImport={() => setIsImportWizardOpen(true)}
        onOpenScenarios={() => setIsScenarioSelectorOpen(true)}
      />

      {/* Contenu principal */}
      <div className="app-content">
        {/* Sidebar gauche - Filtres */}
        <aside className="app-filters">
          <FilterPanel />
        </aside>

        {/* Zone centrale du graphe */}
        <main className="app-main graph-pattern-bg">
          <GraphCanvas
            ref={graphCanvasRef}
            key={theme}
            currentLayout={currentLayout}
            onLayoutChange={handleLayoutChange}
          />

          {/* Sélecteur de layout flottant */}
          <LayoutSelector
            currentLayout={currentLayout}
            onLayoutChange={handleLayoutChange}
            isLayoutRunning={graphCanvasRef.current?.isLayoutRunning}
            className="absolute top-16 left-4 z-20"
          />

          {/* Légende flottante */}
          <GraphLegend
            className="absolute top-16 right-4 z-20"
            showStudyContext={!!selectedStudyId}
          />

          {/* Contrôles flottants */}
          <GraphControls
            className="absolute bottom-4 right-4 z-20"
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToView={handleFitToView}
            onResetLayout={handleResetLayout}
            onExportPNG={() => setIsExportDialogOpen(true)}
          />
        </main>

        {/* Sidebar droite - Détails */}
        <aside className="app-details">
          <NodeDetailsPanel />
        </aside>
      </div>

      {/* Timeline */}
      <TimelineContainer />

      {/* Panneau KQI (overlay) */}
      <KQIPanel />

      {/* Dashboard KQI (modal) */}
      <KQIDashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />

      {/* Panneau des alertes (slide-over) */}
      <AlertsPanel />

      {/* Dialogue d'export */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExport}
      />

      {/* Wizard d'import */}
      <ImportWizard
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
      />

      {/* Sélecteur de scénarios */}
      <ScenarioSelector
        isOpen={isScenarioSelectorOpen}
        onClose={() => setIsScenarioSelectorOpen(false)}
      />

      {/* Player de scénario */}
      <ScenarioPlayer />

      {/* Éditeur de scénarios */}
      <ScenarioEditor />

      {/* Éditeur de scénarios ERD */}
      <ERDScenarioEditor />

      {/* Auto-updater Tauri */}
      <UpdateChecker autoCheck={true} checkInterval={60} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <AppContent />
      </JotaiProvider>
    </QueryClientProvider>
  );
}

export default App;
