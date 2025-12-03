/**
 * KG-Oversight - RelationCreatorDialog
 * Dialog pour créer une nouvelle relation entre deux entités
 * Workflow en 3 étapes : Type de relation → Entité cible → Confirmation
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Search,
  AlertCircle,
  Link2,
  ChevronRight,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { allNodesAtom } from '@shared/stores/selectionAtoms';
import { getNodeColor, getNodeLabel } from '@shared/utils/nodeStyles';
import { cn } from '@/lib/utils';
import type { GraphNode, NodeType, EdgeType } from '@data/types';
import {
  getRelationLabel,
  getOutgoingRelationsForType,
  getValidTargetTypes,
  RELATION_SCHEMAS,
} from '../constants/relationSchemas';
import { useDataMutations } from '../hooks/useDataMutations';
import { ENTITY_SCHEMAS } from '../constants/entitySchemas';

// =============================================================================
// Types
// =============================================================================

interface RelationCreatorDialogProps {
  isOpen: boolean;
  sourceNode: GraphNode;
  onClose: () => void;
  onCreated?: (edgeId: string) => void;
}

type Step = 'select-type' | 'select-target' | 'confirm';

// =============================================================================
// Composant principal
// =============================================================================

export function RelationCreatorDialog({
  isOpen,
  sourceNode,
  onClose,
  onCreated,
}: RelationCreatorDialogProps) {
  const allNodes = useAtomValue(allNodesAtom);
  const { createEdge, state } = useDataMutations();

  // State du wizard
  const [step, setStep] = useState<Step>('select-type');
  const [selectedRelationType, setSelectedRelationType] = useState<EdgeType | null>(null);
  const [selectedTargetNode, setSelectedTargetNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset le state quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen) {
      setStep('select-type');
      setSelectedRelationType(null);
      setSelectedTargetNode(null);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen]);

  // Types de relations disponibles pour le nœud source
  const availableRelationTypes = useMemo(() => {
    const sourceType = sourceNode._type as NodeType;
    return getOutgoingRelationsForType(sourceType);
  }, [sourceNode._type]);

  // Types de cibles valides pour la relation sélectionnée
  const validTargetTypes = useMemo(() => {
    if (!selectedRelationType) return [];
    return getValidTargetTypes(sourceNode._type as NodeType, selectedRelationType);
  }, [sourceNode._type, selectedRelationType]);

  // Nœuds cibles filtrés
  const filteredTargetNodes = useMemo(() => {
    if (!selectedRelationType) return [];

    const nodes: GraphNode[] = [];
    const query = searchQuery.toLowerCase();

    for (const [id, node] of allNodes) {
      // Exclure le nœud source
      if (id === sourceNode.id) continue;

      // Vérifier le type
      if (!validTargetTypes.includes(node._type as NodeType)) continue;

      // Filtrer par recherche
      if (query) {
        const name = getNodeDisplayName(node).toLowerCase();
        const nodeId = id.toLowerCase();
        if (!name.includes(query) && !nodeId.includes(query)) continue;
      }

      nodes.push(node);
    }

    // Trier par nom
    return nodes.sort((a, b) =>
      getNodeDisplayName(a).localeCompare(getNodeDisplayName(b))
    );
  }, [allNodes, sourceNode.id, selectedRelationType, validTargetTypes, searchQuery]);

  // Gérer la sélection du type de relation
  const handleSelectRelationType = useCallback((type: EdgeType) => {
    setSelectedRelationType(type);
    setSelectedTargetNode(null);
    setSearchQuery('');
    setStep('select-target');
  }, []);

  // Gérer la sélection du nœud cible
  const handleSelectTargetNode = useCallback((node: GraphNode) => {
    setSelectedTargetNode(node);
    setStep('confirm');
  }, []);

  // Retour à l'étape précédente
  const handleBack = useCallback(() => {
    setError(null);
    if (step === 'select-target') {
      setStep('select-type');
      setSelectedRelationType(null);
    } else if (step === 'confirm') {
      setStep('select-target');
      setSelectedTargetNode(null);
    }
  }, [step]);

  // Créer la relation
  const handleCreate = useCallback(async () => {
    if (!selectedRelationType || !selectedTargetNode) return;

    setError(null);
    const result = await createEdge(
      sourceNode.id,
      selectedTargetNode.id,
      selectedRelationType
    );

    if (result.success && result.data) {
      onCreated?.(result.data.id);
      onClose();
    } else {
      setError(result.error?.message ?? 'Erreur lors de la création de la relation');
    }
  }, [selectedRelationType, selectedTargetNode, sourceNode.id, createEdge, onCreated, onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-white">
                  Créer une relation
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Depuis : {getNodeDisplayName(sourceNode)}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-slate-800/30">
            <StepIndicator
              number={1}
              label="Type"
              active={step === 'select-type'}
              completed={step !== 'select-type'}
            />
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <StepIndicator
              number={2}
              label="Cible"
              active={step === 'select-target'}
              completed={step === 'confirm'}
            />
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <StepIndicator
              number={3}
              label="Confirmer"
              active={step === 'confirm'}
              completed={false}
            />
          </div>

          {/* Contenu selon l'étape */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {step === 'select-type' && (
                <StepSelectType
                  key="select-type"
                  availableTypes={availableRelationTypes}
                  onSelect={handleSelectRelationType}
                />
              )}

              {step === 'select-target' && selectedRelationType && (
                <StepSelectTarget
                  key="select-target"
                  relationType={selectedRelationType}
                  validTargetTypes={validTargetTypes}
                  filteredNodes={filteredTargetNodes}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelect={handleSelectTargetNode}
                  onBack={handleBack}
                />
              )}

              {step === 'confirm' && selectedRelationType && selectedTargetNode && (
                <StepConfirm
                  key="confirm"
                  sourceNode={sourceNode}
                  targetNode={selectedTargetNode}
                  relationType={selectedRelationType}
                  error={error}
                  isLoading={state.isLoading}
                  onBack={handleBack}
                  onCreate={handleCreate}
                />
              )}
            </AnimatePresence>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// =============================================================================
// Composants d'étapes
// =============================================================================

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
          active && 'bg-indigo-600 text-white',
          completed && 'bg-emerald-600 text-white',
          !active && !completed && 'bg-slate-700 text-slate-500'
        )}
      >
        {completed ? <Check className="w-3.5 h-3.5" /> : number}
      </div>
      <span
        className={cn(
          'text-xs font-medium',
          active ? 'text-white' : 'text-slate-500'
        )}
      >
        {label}
      </span>
    </div>
  );
}

function StepSelectType({
  availableTypes,
  onSelect,
}: {
  availableTypes: EdgeType[];
  onSelect: (type: EdgeType) => void;
}) {
  if (availableTypes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex-1 flex flex-col items-center justify-center p-6"
      >
        <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
        <p className="text-sm text-slate-300 text-center">
          Aucun type de relation disponible pour ce type d'entité.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto p-4"
    >
      <p className="text-xs text-slate-500 mb-3">
        Sélectionnez le type de relation à créer :
      </p>
      <div className="space-y-2">
        {availableTypes.map((type) => {
          const schema = RELATION_SCHEMAS[type];
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:bg-slate-700/50 hover:border-indigo-500/30 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                  {getRelationLabel(type)}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {schema?.description ?? type}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function StepSelectTarget({
  relationType,
  validTargetTypes,
  filteredNodes,
  searchQuery,
  onSearchChange,
  onSelect,
  onBack,
}: {
  relationType: EdgeType;
  validTargetTypes: NodeType[];
  filteredNodes: GraphNode[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (node: GraphNode) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-hidden flex flex-col"
    >
      {/* Info relation sélectionnée */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400">
            Relation : <span className="text-indigo-400">{getRelationLabel(relationType)}</span>
          </span>
        </div>

        {/* Types acceptés */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {validTargetTypes.map((type) => {
            const schema = ENTITY_SCHEMAS[type];
            return (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-slate-800 border border-white/5"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: schema?.color ?? '#64748B' }}
                />
                {schema?.label ?? type}
              </span>
            );
          })}
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher une entité..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Liste des nœuds */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredNodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">
              {searchQuery
                ? 'Aucune entité trouvée pour cette recherche.'
                : 'Aucune entité disponible pour cette relation.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredNodes.slice(0, 50).map((node) => (
              <button
                key={node.id}
                onClick={() => onSelect(node)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-700/30 hover:border-white/10 transition-all text-left group"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/10"
                  style={{ backgroundColor: getNodeColor(node._type) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                    {getNodeDisplayName(node)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {getNodeLabel(node._type)} • {node.id}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            {filteredNodes.length > 50 && (
              <p className="text-xs text-slate-500 text-center py-2">
                ... et {filteredNodes.length - 50} autres résultats
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StepConfirm({
  sourceNode,
  targetNode,
  relationType,
  error,
  isLoading,
  onBack,
  onCreate,
}: {
  sourceNode: GraphNode;
  targetNode: GraphNode;
  relationType: EdgeType;
  error: string | null;
  isLoading: boolean;
  onBack: () => void;
  onCreate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400">Confirmer la création</span>
      </div>

      {/* Visualisation de la relation */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center gap-4 mb-6">
          {/* Source */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 ring-2 ring-white/10"
              style={{ backgroundColor: getNodeColor(sourceNode._type) }}
            >
              <span className="text-white text-xs font-bold">
                {sourceNode._type.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 text-center max-w-[100px] truncate">
              {getNodeDisplayName(sourceNode)}
            </p>
          </div>

          {/* Flèche */}
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="w-8 h-8 text-indigo-500" />
            <span className="text-[10px] text-indigo-400 text-center max-w-[120px]">
              {getRelationLabel(relationType)}
            </span>
          </div>

          {/* Target */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 ring-2 ring-white/10"
              style={{ backgroundColor: getNodeColor(targetNode._type) }}
            >
              <span className="text-white text-xs font-bold">
                {targetNode._type.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 text-center max-w-[100px] truncate">
              {getNodeDisplayName(targetNode)}
            </p>
          </div>
        </div>

        {/* Résumé textuel */}
        <div className="text-center mb-6">
          <p className="text-sm text-slate-300">
            Créer la relation{' '}
            <span className="text-indigo-400 font-medium">
              {getRelationLabel(relationType)}
            </span>{' '}
            entre :
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {getNodeDisplayName(sourceNode)} → {getNodeDisplayName(targetNode)}
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          Retour
        </button>
        <button
          onClick={onCreate}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Création...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Créer la relation
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Utilitaires
// =============================================================================

function getNodeDisplayName(node: GraphNode): string {
  if ('nom' in node && node.nom) return node.nom;
  if ('description' in node && node.description) {
    const desc = node.description;
    return desc.length > 40 ? `${desc.substring(0, 40)}...` : desc;
  }
  if ('indicateur' in node && node.indicateur) return node.indicateur;
  return node.id;
}

export default RelationCreatorDialog;
