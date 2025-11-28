/**
 * KG-Oversight - Panneau de détails du nœud sélectionné
 * Affiche les propriétés et relations du nœud avec onglets
 */

import { useAtomValue, useSetAtom } from 'jotai';
import { useState, useMemo } from 'react';
import { selectedNodeAtom, selectedNodeIdsAtom, allEdgesAtom, allNodesAtom } from '@shared/stores/selectionAtoms';
import { getNodeColor, getNodeLabel, getCriticiteColor, getRisqueColor } from '@shared/utils/nodeStyles';
import type { GraphNode, GraphEdge, SousTraitant, Audit, Finding, EtudeClinique, Alerte, EvaluationRisque } from '@data/types';

interface NodeDetailsPanelProps {
  className?: string;
}

type TabId = 'info' | 'relations';

export function NodeDetailsPanel({ className = '' }: NodeDetailsPanelProps) {
  const selectedNode = useAtomValue(selectedNodeAtom);
  const setSelectedNodeIds = useSetAtom(selectedNodeIdsAtom);
  const allEdges = useAtomValue(allEdgesAtom);
  const allNodes = useAtomValue(allNodesAtom);
  const [activeTab, setActiveTab] = useState<TabId>('info');

  // Calculer les relations du nœud
  const { incomingEdges, outgoingEdges } = useMemo(() => {
    if (!selectedNode) return { incomingEdges: [], outgoingEdges: [] };

    const relatedEdges: GraphEdge[] = [];
    for (const [, edge] of allEdges) {
      if (edge.source === selectedNode.id || edge.target === selectedNode.id) {
        relatedEdges.push(edge);
      }
    }

    return {
      incomingEdges: relatedEdges.filter(e => e.target === selectedNode.id),
      outgoingEdges: relatedEdges.filter(e => e.source === selectedNode.id),
    };
  }, [selectedNode, allEdges]);

  const totalRelations = incomingEdges.length + outgoingEdges.length;

  // Fermer le panel
  const closePanel = () => {
    setSelectedNodeIds(new Set());
  };

  if (!selectedNode) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-6 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-foreground mb-2">
          Aucune sélection
        </h2>
        <p className="text-xs text-muted-foreground text-center">
          Cliquez sur un nœud du graphe pour voir ses détails et ses relations.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* En-tête avec type, nom et bouton fermer */}
      <div className="p-4 border-b bg-card sticky top-0 z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white shadow"
              style={{ backgroundColor: getNodeColor(selectedNode._type) }}
            />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {getNodeLabel(selectedNode._type)}
            </span>
          </div>
          <button
            onClick={closePanel}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Fermer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <h2 className="text-base font-semibold text-foreground mt-2 leading-tight">
          {getNodeDisplayName(selectedNode)}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          {selectedNode.id}
        </p>

        {/* Badges statut et criticité */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {selectedNode.statut && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-muted text-muted-foreground">
              {selectedNode.statut}
            </span>
          )}
          {selectedNode.criticite && (
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-md text-white"
              style={{ backgroundColor: getCriticiteColor(selectedNode.criticite) }}
            >
              {selectedNode.criticite}
            </span>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b bg-muted/30">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative ${
            activeTab === 'info'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Informations
          {activeTab === 'info' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('relations')}
          className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative ${
            activeTab === 'relations'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Relations
          {totalRelations > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-muted">
              {totalRelations}
            </span>
          )}
          {activeTab === 'relations' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' ? (
          <div className="space-y-4">
            <NodeSpecificDetails node={selectedNode} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Relations entrantes */}
            {incomingEdges.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  Entrantes ({incomingEdges.length})
                </h3>
                <div className="space-y-1.5">
                  {incomingEdges.slice(0, 15).map((edge) => {
                    const sourceNode = allNodes.get(edge.source);
                    return (
                      <RelationItem
                        key={edge.id}
                        edge={edge}
                        relatedNode={sourceNode}
                        direction="incoming"
                        onSelect={() => setSelectedNodeIds(new Set([edge.source]))}
                      />
                    );
                  })}
                  {incomingEdges.length > 15 && (
                    <p className="text-xs text-muted-foreground py-1">
                      ... et {incomingEdges.length - 15} autres
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Relations sortantes */}
            {outgoingEdges.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  Sortantes ({outgoingEdges.length})
                </h3>
                <div className="space-y-1.5">
                  {outgoingEdges.slice(0, 15).map((edge) => {
                    const targetNode = allNodes.get(edge.target);
                    return (
                      <RelationItem
                        key={edge.id}
                        edge={edge}
                        relatedNode={targetNode}
                        direction="outgoing"
                        onSelect={() => setSelectedNodeIds(new Set([edge.target]))}
                      />
                    );
                  })}
                  {outgoingEdges.length > 15 && (
                    <p className="text-xs text-muted-foreground py-1">
                      ... et {outgoingEdges.length - 15} autres
                    </p>
                  )}
                </div>
              </div>
            )}

            {totalRelations === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune relation pour ce nœud.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour afficher les détails spécifiques selon le type de nœud
function NodeSpecificDetails({ node }: { node: GraphNode }) {
  switch (node._type) {
    case 'SousTraitant':
      return <SousTraitantDetails node={node} />;
    case 'Audit':
      return <AuditDetails node={node} />;
    case 'Finding':
      return <FindingDetails node={node} />;
    case 'EtudeClinique':
      return <EtudeDetails node={node} />;
    case 'Alerte':
      return <AlerteDetails node={node} />;
    case 'EvaluationRisque':
      return <EvaluationDetails node={node} />;
    default:
      return <GenericDetails node={node} />;
  }
}

function SousTraitantDetails({ node }: { node: SousTraitant }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Type de service" value={node.type_service} />
      <DetailRow label="Pays" value={node.pays} />
      <DetailRow label="Niveau" value={node.niveau_actuel === 1 ? 'N1 (Direct)' : 'N2 (Indirect)'} />
      <DetailRow label="Date création" value={formatDate(node.date_creation)} />
    </div>
  );
}

function AuditDetails({ node }: { node: Audit }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Type" value={node.type_audit} />
      <DetailRow label="Résultat" value={node.resultat} />
      <DetailRow label="Date début" value={formatDate(node.date_debut)} />
      <DetailRow label="Date fin" value={formatDate(node.date_fin)} />
      {node.declencheur && (
        <DetailRow label="Déclencheur" value={node.declencheur} />
      )}
    </div>
  );
}

function FindingDetails({ node }: { node: Finding }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Description" value={node.description} multiline />
      <DetailRow label="Date détection" value={formatDate(node.date_detection)} />
      <DetailRow label="Date clôture" value={formatDate(node.date_cloture)} />
      {node.capa_id && (
        <DetailRow label="CAPA" value={node.capa_id} />
      )}
    </div>
  );
}

function EtudeDetails({ node }: { node: EtudeClinique }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Phase" value={node.phase ? `Phase ${node.phase}` : undefined} />
      <DetailRow label="Indication" value={node.indication} />
      <DetailRow label="Nb patients" value={node.nb_patients?.toString()} />
      <DetailRow label="Date début" value={formatDate(node.date_debut)} />
      <DetailRow label="Date fin" value={formatDate(node.date_fin)} />
    </div>
  );
}

function AlerteDetails({ node }: { node: Alerte }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Description" value={node.description} multiline />
      {node.niveau && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Niveau:</span>
          <span
            className="px-2 py-0.5 text-xs font-medium rounded text-white"
            style={{
              backgroundColor:
                node.niveau === 'HAUTE' ? '#DC2626' :
                node.niveau === 'MOYENNE' ? '#F59E0B' : '#3B82F6'
            }}
          >
            {node.niveau}
          </span>
        </div>
      )}
      <DetailRow label="Règle" value={node.regle_id} />
      <DetailRow label="Date création" value={formatDate(node.date_creation)} />
    </div>
  );
}

function EvaluationDetails({ node }: { node: EvaluationRisque }) {
  return (
    <div className="space-y-2">
      {node.score && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Score:</span>
          <span
            className="px-2 py-0.5 text-xs font-medium rounded text-white"
            style={{ backgroundColor: getRisqueColor(node.score) }}
          >
            {node.score}
          </span>
        </div>
      )}
      {node.evolution && (
        <DetailRow label="Évolution" value={node.evolution} />
      )}
      <DetailRow label="Date évaluation" value={formatDate(node.date_evaluation)} />
      <DetailRow label="Findings critiques" value={node.findings_critiques?.toString()} />
      <DetailRow label="QE critiques" value={node.qe_critiques?.toString()} />
      <DetailRow label="Alertes KQI" value={node.kqi_alertes?.toString()} />
    </div>
  );
}

function GenericDetails({ node }: { node: GraphNode }) {
  return (
    <div className="space-y-2">
      {node.description && (
        <DetailRow label="Description" value={node.description} multiline />
      )}
      {node.source_donnees && (
        <DetailRow label="Source" value={node.source_donnees} />
      )}
    </div>
  );
}

// Composant pour une ligne de détail
function DetailRow({ label, value, multiline = false }: { label: string; value?: string; multiline?: boolean }) {
  if (!value) return null;

  return (
    <div className={multiline ? '' : 'flex items-start gap-2'}>
      <span className="text-xs text-muted-foreground shrink-0">{label}:</span>
      <span className={`text-sm text-foreground ${multiline ? 'block mt-1' : ''}`}>
        {value}
      </span>
    </div>
  );
}

// Composant pour afficher une relation
function RelationItem({
  edge,
  relatedNode,
  direction,
  onSelect,
}: {
  edge: GraphEdge;
  relatedNode?: GraphNode;
  direction: 'incoming' | 'outgoing';
  onSelect?: () => void;
}) {
  const relationLabel = formatRelationType(edge._type);
  const nodeName = relatedNode ? getNodeDisplayName(relatedNode) : (direction === 'incoming' ? edge.source : edge.target);
  const nodeType = relatedNode?._type;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted transition-colors text-left group"
    >
      {nodeType && (
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
          style={{ backgroundColor: getNodeColor(nodeType) }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wide">
          {relationLabel}
        </p>
        <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {nodeName}
        </p>
      </div>
      <svg className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// Utilitaires
function getNodeDisplayName(node: GraphNode): string {
  if ('nom' in node && node.nom) return node.nom;
  if ('description' in node && node.description) return node.description;
  return node.id;
}

function formatDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatRelationType(type: string): string {
  const labels: Record<string, string> = {
    EST_LIE_AU_CONTRAT: 'Lié au contrat',
    EST_COUVERT_PAR_QA: 'Couvert par QA',
    EST_SOUS_TRAITANT_DE: 'Sous-traitant de',
    A_ETE_AUDITE_PAR: 'Audité par',
    A_ETE_INSPECTE_PAR: 'Inspecté par',
    GENERE_FINDING: 'Génère finding',
    INSPECTION_GENERE_FINDING: 'Génère finding',
    QE_CONCERNE_ST: 'Concerne ST',
    SURVENU_DANS_ETUDE: 'Survenu dans étude',
    IMPLIQUE_ST: 'Implique ST',
    A_FAIT_OBJET_EVALUATION: 'Évalué par',
    DECISION_JUSTIFIEE_PAR_AUDIT: 'Justifié par audit',
    DECISION_JUSTIFIEE_PAR_QE: 'Justifié par QE',
    QE_DECLENCHE_ALERTE: 'Déclenche alerte',
    AUDIT_DECLENCHE_ALERTE: 'Déclenche alerte',
  };
  return labels[type] ?? type.replace(/_/g, ' ').toLowerCase();
}

export default NodeDetailsPanel;
