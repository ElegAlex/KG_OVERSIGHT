/**
 * KG-Oversight - Panneau de détails du noeud sélectionné
 * Design moderne avec glassmorphism
 * Supporte le mode édition via EntityEditor
 */

import { useAtomValue, useSetAtom } from 'jotai';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, GitBranch, ChevronRight, ArrowLeftCircle, ArrowRightCircle, Pencil, Eye, Trash2 } from 'lucide-react';
import { selectedNodeAtom, selectedNodeIdsAtom, allEdgesAtom, allNodesAtom } from '@shared/stores/selectionAtoms';
import { getNodeColor, getNodeLabel, getCriticiteColor, getRisqueColor } from '@shared/utils/nodeStyles';
import { cn } from '@/lib/utils';
import { slideInRight } from '@/lib/animations';
import type { GraphNode, GraphEdge, SousTraitant, Audit, Finding, EtudeClinique, Alerte, EvaluationRisque } from '@data/types';
import { EntityEditor } from '@features/dataManagement/components/EntityEditor';
import { DeleteConfirmDialog } from '@features/dataManagement/components/DeleteConfirmDialog';

interface NodeDetailsPanelProps {
  className?: string;
  /** Mode compact pour affichage côte à côte avec le panneau KQI */
  compact?: boolean;
}

type TabId = 'info' | 'relations' | 'edit';

export function NodeDetailsPanel({ className = '', compact = false }: NodeDetailsPanelProps) {
  const selectedNode = useAtomValue(selectedNodeAtom);
  const setSelectedNodeIds = useSetAtom(selectedNodeIdsAtom);
  const allEdges = useAtomValue(allEdgesAtom);
  const allNodes = useAtomValue(allNodesAtom);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [isEditDirty, setIsEditDirty] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Calculer les relations du noeud
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
  const closePanel = useCallback(() => {
    if (isEditDirty) {
      const confirm = window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?');
      if (!confirm) return;
    }
    setActiveTab('info');
    setIsEditDirty(false);
    setSelectedNodeIds(new Set());
  }, [isEditDirty, setSelectedNodeIds]);

  // Gérer la fin d'édition
  const handleEditSave = useCallback(() => {
    setActiveTab('info');
    setIsEditDirty(false);
  }, []);

  const handleEditCancel = useCallback(() => {
    setActiveTab('info');
    setIsEditDirty(false);
  }, []);

  // Gérer la suppression réussie
  const handleDeleteSuccess = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedNodeIds(new Set());
  }, [setSelectedNodeIds]);

  // En mode compact, on n'affiche pas le message "aucune sélection"
  if (!selectedNode) {
    if (compact) return null;
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-6', className)}>
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
          <div className="relative w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/10 flex items-center justify-center mb-4">
            <Info className="w-7 h-7 text-slate-500" />
          </div>
        </div>
        <h2 className="text-sm font-medium text-slate-300 mb-2">
          Aucune sélection
        </h2>
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          Cliquez sur un noeud du graphe pour voir ses détails et ses relations.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* En-tête avec type, nom et bouton fermer */}
      <div className={`border-b border-white/5 sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`rounded-full shrink-0 ring-2 ring-white/20 shadow-lg ${compact ? 'w-3 h-3' : 'w-4 h-4'}`}
              style={{ backgroundColor: getNodeColor(selectedNode._type) }}
            />
            <span className={`font-medium text-slate-500 uppercase tracking-wider ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {getNodeLabel(selectedNode._type)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!compact && (
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="p-1 rounded-lg hover:bg-red-500/10 transition-colors text-slate-500 hover:text-red-400"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closePanel}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-300"
              title="Fermer"
            >
              <X className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </button>
          </div>
        </div>
        <h2 className={`font-semibold text-white mt-1.5 leading-tight ${compact ? 'text-sm' : 'text-base mt-2'}`}>
          {getNodeDisplayName(selectedNode)}
        </h2>
        {!compact && (
          <p className="text-xs text-slate-600 mt-1 font-mono truncate">
            {selectedNode.id}
          </p>
        )}

        {/* Badges statut et criticité */}
        <div className={`flex flex-wrap gap-1 ${compact ? 'mt-2' : 'mt-3 gap-1.5'}`}>
          {selectedNode.statut && (
            <span className={`font-medium rounded-md bg-slate-700/50 text-slate-400 border border-white/5 ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
              {selectedNode.statut}
            </span>
          )}
          {selectedNode.criticite && (
            <span
              className={`font-medium rounded-md text-white shadow-sm ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
              style={{ backgroundColor: getCriticiteColor(selectedNode.criticite) }}
            >
              {selectedNode.criticite}
            </span>
          )}
        </div>
      </div>

      {/* Onglets modernes - masqués en mode compact */}
      {!compact && (
        <div className="flex border-b border-white/5 bg-slate-800/30">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'flex-1 px-3 py-2.5 text-xs font-medium transition-all relative',
              activeTab === 'info'
                ? 'text-indigo-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Détails
            </span>
            {activeTab === 'info' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={cn(
              'flex-1 px-3 py-2.5 text-xs font-medium transition-all relative',
              activeTab === 'edit'
                ? 'text-amber-400'
                : 'text-slate-500 hover:text-slate-300',
              isEditDirty && activeTab !== 'edit' && 'text-amber-500'
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Éditer
              {isEditDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </span>
            {activeTab === 'edit' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('relations')}
            className={cn(
              'flex-1 px-3 py-2.5 text-xs font-medium transition-all relative',
              activeTab === 'relations'
                ? 'text-indigo-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              Relations
              {totalRelations > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-700 text-slate-400">
                  {totalRelations}
                </span>
              )}
            </span>
            {activeTab === 'relations' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
              />
            )}
          </button>
        </div>
      )}

      {/* Contenu selon l'onglet actif */}
      <div className={cn(
        'flex-1 overflow-hidden flex flex-col',
        activeTab !== 'edit' && (compact ? 'p-3' : 'p-4')
      )}>
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div
              key="info"
              variants={slideInRight}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 overflow-y-auto flex-1"
            >
              <NodeSpecificDetails node={selectedNode} />
            </motion.div>
          )}

          {activeTab === 'edit' && (
            <motion.div
              key="edit"
              variants={slideInRight}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 overflow-hidden flex flex-col"
            >
              <EntityEditor
                node={selectedNode}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
                onDirtyChange={setIsEditDirty}
              />
            </motion.div>
          )}

          {activeTab === 'relations' && (
            <motion.div
              key="relations"
              variants={slideInRight}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 overflow-y-auto flex-1"
            >
              {/* Relations entrantes */}
              {incomingEdges.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase mb-2">
                    <ArrowLeftCircle className="w-3.5 h-3.5 text-emerald-500" />
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
                          onSelect={() => setSelectedNodeIds(new Set([edge.source]))}
                        />
                      );
                    })}
                    {incomingEdges.length > 15 && (
                      <p className="text-xs text-slate-600 py-1">
                        ... et {incomingEdges.length - 15} autres
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Relations sortantes */}
              {outgoingEdges.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase mb-2">
                    <ArrowRightCircle className="w-3.5 h-3.5 text-amber-500" />
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
                          onSelect={() => setSelectedNodeIds(new Set([edge.target]))}
                        />
                      );
                    })}
                    {outgoingEdges.length > 15 && (
                      <p className="text-xs text-slate-600 py-1">
                        ... et {outgoingEdges.length - 15} autres
                      </p>
                    )}
                  </div>
                </div>
              )}

              {totalRelations === 0 && (
                <div className="text-center py-8">
                  <GitBranch className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Aucune relation pour ce noeud.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialog de confirmation de suppression */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        node={selectedNode}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDeleted={handleDeleteSuccess}
      />
    </div>
  );
}

// Composant pour afficher les détails spécifiques selon le type de noeud
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
    <div className="space-y-3">
      <DetailRow label="Type de service" value={node.type_service} />
      <DetailRow label="Pays" value={node.pays} />
      <DetailRow label="Niveau" value={node.niveau_actuel === 1 ? 'N1 (Direct)' : 'N2 (Indirect)'} />
      <DetailRow label="Date création" value={formatDate(node.date_creation)} />
    </div>
  );
}

function AuditDetails({ node }: { node: Audit }) {
  return (
    <div className="space-y-3">
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
    <div className="space-y-3">
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
    <div className="space-y-3">
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
    <div className="space-y-3">
      <DetailRow label="Description" value={node.description} multiline />
      {node.niveau && (
        <div className="glass-card p-3">
          <span className="text-xs text-slate-500 block mb-1.5">Niveau</span>
          <span
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-white inline-block"
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
    <div className="space-y-3">
      {node.score && (
        <div className="glass-card p-3">
          <span className="text-xs text-slate-500 block mb-1.5">Score de risque</span>
          <span
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-white inline-block"
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
    <div className="space-y-3">
      {node.description && (
        <DetailRow label="Description" value={node.description} multiline />
      )}
      {node.source_donnees && (
        <DetailRow label="Source" value={node.source_donnees} />
      )}
    </div>
  );
}

// Composant pour une ligne de détail moderne
function DetailRow({ label, value, multiline = false }: { label: string; value?: string; multiline?: boolean }) {
  if (!value) return null;

  return (
    <div className="glass-card p-3">
      <span className="text-xs text-slate-500 block mb-1">{label}</span>
      <span className={cn(
        'text-sm text-slate-200',
        multiline && 'leading-relaxed'
      )}>
        {value}
      </span>
    </div>
  );
}

// Composant pour afficher une relation
function RelationItem({
  edge,
  relatedNode,
  onSelect,
}: {
  edge: GraphEdge;
  relatedNode?: GraphNode;
  onSelect?: () => void;
}) {
  const relationLabel = formatRelationType(edge._type);
  const nodeName = relatedNode ? getNodeDisplayName(relatedNode) : edge.source;
  const nodeType = relatedNode?._type;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-700/30 hover:border-white/10 transition-all text-left group"
    >
      {nodeType && (
        <div
          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/10"
          style={{ backgroundColor: getNodeColor(nodeType) }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">
          {relationLabel}
        </p>
        <p className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">
          {nodeName}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
