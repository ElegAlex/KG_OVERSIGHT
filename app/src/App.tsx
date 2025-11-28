/**
 * KG-Oversight - Application principale
 * Knowledge Graph pour la supervision qualité des sous-traitants
 */

import { Provider as JotaiProvider, useSetAtom, useAtomValue } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GraphCanvas, NodeDetailsPanel, FilterPanel } from '@features/graph';
import { KQIPanel } from '@features/kqi';
import { allNodesAtom, allEdgesAtom, filteredNodesAtom } from '@shared/stores/selectionAtoms';
import { loadAllData } from '@features/import/services/dataLoader';
import { useEffect, useState, useMemo } from 'react';
import type { GraphNode } from '@data/types';
import './styles/globals.css';

// Client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Composant Badge simple
function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'success';
  className?: string;
}) {
  const variants = {
    default: 'bg-primary/10 text-primary border-primary/20',
    destructive: 'bg-red-500/10 text-red-600 border-red-500/20',
    outline: 'bg-card text-muted-foreground border-border',
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
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
  const filteredNodes = useAtomValue(filteredNodesAtom);

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
        setTotalNodes(nodes.size);
        setTotalEdges(edges.size);
        setIsLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoadError(error instanceof Error ? error.message : 'Erreur inconnue');
      }
    }

    loadData();
  }, [setAllNodes, setAllEdges]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center p-8 bg-card rounded-lg border shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Erreur de chargement
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des données CSV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout-v2">
      {/* Header amélioré avec badges */}
      <header className="app-header flex items-center justify-between px-4 py-2.5 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">
                KG-Oversight
              </h1>
              <span className="text-xs text-muted-foreground">
                Supervision Qualité Sous-Traitants
              </span>
            </div>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {filteredNodes.size} / {totalNodes} nœuds
          </Badge>
          <Badge variant="outline">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {totalEdges} relations
          </Badge>
          <Badge variant="success">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {stats.stCount} sous-traitants
          </Badge>
          {stats.alertCount > 0 && (
            <Badge variant="destructive">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {stats.alertCount} alertes
            </Badge>
          )}
          {stats.criticalCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {stats.criticalCount} critiques
            </Badge>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <div className="app-content">
        {/* Sidebar gauche - Filtres */}
        <aside className="app-filters border-r bg-card overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-card z-10">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres
            </h2>
          </div>
          <div className="p-4">
            <FilterPanel />
          </div>
        </aside>

        {/* Zone centrale du graphe */}
        <main className="app-main">
          <GraphCanvas />
        </main>

        {/* Sidebar droite - Détails */}
        <aside className="app-details border-l bg-card overflow-y-auto">
          <NodeDetailsPanel />
        </aside>
      </div>

      {/* Timeline (placeholder) */}
      <div className="app-timeline flex items-center justify-center bg-card border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Timeline des événements (à implémenter)
        </div>
      </div>

      {/* Panneau KQI (overlay) */}
      <KQIPanel />
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
