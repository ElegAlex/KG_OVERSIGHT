/**
 * KG-Oversight - Tooltip pour le survol des nœuds du graphe
 */

import { useAtomValue } from 'jotai';
import { hoveredNodeIdAtom, allNodesAtom } from '@shared/stores/selectionAtoms';
import { getNodeLabel } from '@shared/utils/nodeStyles';
import type { GraphNode } from '@data/types';

interface GraphTooltipProps {
  mousePosition: { x: number; y: number } | null;
}

function getNodeSummary(node: GraphNode): string {
  switch (node._type) {
    case 'SousTraitant':
      return `${node.type_service ?? 'Service'} - ${node.pays ?? ''}`;
    case 'EtudeClinique':
      return `Phase ${node.phase ?? '?'} - ${node.indication ?? ''}`;
    case 'Audit':
      return `${node.type_audit ?? 'Audit'} - ${node.resultat ?? ''}`;
    case 'Finding':
      return node.description ?? '';
    case 'Alerte':
      return `Niveau ${node.niveau ?? '?'} - ${node.description ?? ''}`;
    case 'Contrat':
      return `${node.type_contrat ?? 'Contrat'} - ${node.statut ?? ''}`;
    case 'EvenementQualite':
      return `Impact ${node.impact ?? '?'} - ${node.description ?? ''}`;
    case 'Decision':
      return `${node.nature ?? 'Décision'} - ${node.statut ?? ''}`;
    default:
      return node.description ?? node.nom ?? '';
  }
}

export function GraphTooltip({ mousePosition }: GraphTooltipProps) {
  const hoveredNodeId = useAtomValue(hoveredNodeIdAtom);
  const allNodes = useAtomValue(allNodesAtom);

  if (!hoveredNodeId || !mousePosition) return null;

  const node = allNodes.get(hoveredNodeId);
  if (!node) return null;

  // Positionner le tooltip près du curseur avec un décalage
  const tooltipStyle = {
    left: mousePosition.x + 15,
    top: mousePosition.y + 15,
  };

  return (
    <div
      className="graph-tooltip"
      style={tooltipStyle}
    >
      <div className="flex flex-col gap-1">
        {/* En-tête avec type et nom */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {getNodeLabel(node._type)}
          </span>
          {node.criticite && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                node.criticite === 'Critique'
                  ? 'bg-red-100 text-red-700'
                  : node.criticite === 'Majeur'
                    ? 'bg-orange-100 text-orange-700'
                    : node.criticite === 'Standard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
              }`}
            >
              {node.criticite}
            </span>
          )}
        </div>

        {/* Nom du nœud */}
        <div className="font-medium text-foreground">
          {node.nom ?? node.id}
        </div>

        {/* Résumé contextuel */}
        <div className="text-sm text-muted-foreground">
          {getNodeSummary(node)}
        </div>

        {/* Statut si présent */}
        {node.statut && (
          <div className="text-xs text-muted-foreground">
            Statut: {node.statut}
          </div>
        )}
      </div>
    </div>
  );
}

export default GraphTooltip;
