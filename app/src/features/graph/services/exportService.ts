/**
 * KG-Oversight - Service d'export du graphe
 * Export en PNG et SVG avec options de personnalisation
 */

import type Sigma from 'sigma';
import type Graph from 'graphology';

export interface ExportOptions {
  /** Format d'export */
  format: 'png' | 'svg';
  /** Nom du fichier (sans extension) */
  filename?: string;
  /** Couleur de fond (transparent si non défini) */
  backgroundColor?: string;
  /** Facteur de mise à l'échelle pour PNG (1 = 100%) */
  scale?: number;
  /** Inclure les labels */
  includeLabels?: boolean;
  /** Marge en pixels */
  margin?: number;
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: 'png',
  filename: 'kg-oversight-export',
  backgroundColor: '#0f172a',
  scale: 2,
  includeLabels: true,
  margin: 50,
};

/**
 * Exporte le graphe en PNG via le canvas Sigma
 */
export async function exportToPNG(
  sigma: Sigma,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options, format: 'png' as const };

  // Obtenir le canvas WebGL de Sigma
  const container = sigma.getContainer();
  const canvases = container.querySelectorAll('canvas');

  if (canvases.length === 0) {
    throw new Error('No canvas found in Sigma container');
  }

  // Sigma utilise plusieurs canvas superposés
  // On doit les combiner en un seul
  const width = container.clientWidth * opts.scale!;
  const height = container.clientHeight * opts.scale!;

  // Créer un canvas de destination
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Fond
  if (opts.backgroundColor) {
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Dessiner chaque canvas Sigma
  canvases.forEach((canvas) => {
    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      width,
      height
    );
  });

  // Convertir en blob et télécharger
  const blob = await new Promise<Blob | null>((resolve) => {
    exportCanvas.toBlob(resolve, 'image/png', 1.0);
  });

  if (!blob) {
    throw new Error('Failed to create PNG blob');
  }

  downloadBlob(blob, `${opts.filename}.png`);
}

/**
 * Exporte le graphe en SVG
 */
export async function exportToSVG(
  sigma: Sigma,
  graph: Graph,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options, format: 'svg' as const };

  const container = sigma.getContainer();
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Obtenir les coordonnées de la vue
  const camera = sigma.getCamera();
  const viewState = camera.getState();

  // Créer le SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Fond
  if (opts.backgroundColor) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', opts.backgroundColor);
    svg.appendChild(rect);
  }

  // Groupe pour les arêtes
  const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  edgesGroup.setAttribute('class', 'edges');

  // Groupe pour les nœuds
  const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  nodesGroup.setAttribute('class', 'nodes');

  // Groupe pour les labels
  const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelsGroup.setAttribute('class', 'labels');

  // Fonction pour convertir les coordonnées graphe → viewport
  const graphToViewport = (x: number, y: number): { x: number; y: number } => {
    const { x: vx, y: vy } = sigma.graphToViewport({ x, y });
    return { x: vx, y: vy };
  };

  // Dessiner les arêtes
  graph.forEachEdge((edge, attrs, source, target) => {
    const sourcePos = graph.getNodeAttributes(source);
    const targetPos = graph.getNodeAttributes(target);

    if (attrs.hidden) return;

    const start = graphToViewport(sourcePos.x, sourcePos.y);
    const end = graphToViewport(targetPos.x, targetPos.y);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', start.x.toString());
    line.setAttribute('y1', start.y.toString());
    line.setAttribute('x2', end.x.toString());
    line.setAttribute('y2', end.y.toString());
    line.setAttribute('stroke', (attrs.color as string) || '#64748b');
    line.setAttribute('stroke-width', ((attrs.size as number) || 1).toString());
    line.setAttribute('stroke-opacity', '0.6');

    edgesGroup.appendChild(line);
  });

  // Dessiner les nœuds et labels
  graph.forEachNode((node, attrs) => {
    if (attrs.hidden) return;

    const pos = graphToViewport(attrs.x, attrs.y);
    const size = (attrs.size as number) || 5;
    const color = (attrs.color as string) || '#6B7280';
    const label = attrs.label as string;

    // Cercle du nœud
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x.toString());
    circle.setAttribute('cy', pos.y.toString());
    circle.setAttribute('r', size.toString());
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '1');

    nodesGroup.appendChild(circle);

    // Label
    if (opts.includeLabels && label) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (pos.x + size + 5).toString());
      text.setAttribute('y', (pos.y + 4).toString());
      text.setAttribute('fill', '#f1f5f9');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'Inter, system-ui, sans-serif');
      text.textContent = label;

      labelsGroup.appendChild(text);
    }
  });

  svg.appendChild(edgesGroup);
  svg.appendChild(nodesGroup);
  svg.appendChild(labelsGroup);

  // Convertir en string et télécharger
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

  downloadBlob(blob, `${opts.filename}.svg`);
}

/**
 * Export générique selon le format
 */
export async function exportGraph(
  sigma: Sigma,
  graph: Graph,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  const format = options.format || 'png';

  if (format === 'svg') {
    await exportToSVG(sigma, graph, options);
  } else {
    await exportToPNG(sigma, options);
  }
}

/**
 * Télécharge un blob en fichier
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Génère un nom de fichier avec timestamp
 */
export function generateFilename(prefix = 'kg-oversight'): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-');
  return `${prefix}-${timestamp}`;
}

export default {
  exportToPNG,
  exportToSVG,
  exportGraph,
  generateFilename,
};
