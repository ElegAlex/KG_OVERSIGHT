/**
 * KG-Oversight - Parser Excel multi-onglets
 * Utilise xlsx pour parser les fichiers Excel (.xlsx, .xls)
 */

import * as XLSX from 'xlsx';
import type { GraphNode, GraphEdge, NodeType, EdgeType } from '@data/types';

// =============================================================================
// Types
// =============================================================================

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export interface ExcelParseResult {
  sheets: ExcelSheet[];
  filename: string;
  fileSize: number;
}

export interface SheetMapping {
  sheetName: string;
  targetType: NodeType | EdgeType;
  isRelation: boolean;
  columnMappings: ColumnMapping[];
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
}

// =============================================================================
// Lecture du fichier Excel
// =============================================================================

/**
 * Parse un fichier Excel et retourne les données de chaque onglet
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sheets: ExcelSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convertir en JSON avec headers
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      header: 1,
      defval: '',
    }) as unknown[][];

    if (jsonData.length === 0) {
      sheets.push({
        name: sheetName,
        headers: [],
        rows: [],
        rowCount: 0,
      });
      continue;
    }

    // Première ligne = headers
    const headers = (jsonData[0] as unknown[]).map((h) => String(h ?? '').trim());

    // Lignes de données
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i] as unknown[];
      const row: Record<string, string> = {};

      headers.forEach((header, colIndex) => {
        if (header) {
          const value = rowData[colIndex];
          row[header] = formatCellValue(value);
        }
      });

      // Ignorer les lignes vides
      if (Object.values(row).some((v) => v !== '')) {
        rows.push(row);
      }
    }

    sheets.push({
      name: sheetName,
      headers: headers.filter((h) => h !== ''),
      rows,
      rowCount: rows.length,
    });
  }

  return {
    sheets,
    filename: file.name,
    fileSize: file.size,
  };
}

/**
 * Formate une valeur de cellule en string
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // Format YYYY-MM-DD
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value).trim();
}

// =============================================================================
// Détection automatique du type d'onglet
// =============================================================================

const NODE_TYPE_PATTERNS: Record<NodeType, RegExp[]> = {
  SousTraitant: [/sous.?traitant/i, /vendor/i, /supplier/i, /^st$/i],
  Contrat: [/contrat/i, /contract/i],
  AccordQualite: [/accord.?qualit/i, /quality.?agreement/i, /^qa$/i],
  Audit: [/audit/i],
  Inspection: [/inspection/i],
  Finding: [/finding/i, /observation/i, /non.?conformit/i],
  EvenementQualite: [/evenement.?qualit/i, /quality.?event/i, /^qe$/i],
  Decision: [/decision/i],
  EvaluationRisque: [/evaluation.?risque/i, /risk.?assessment/i],
  ReunionQualite: [/reunion.?qualit/i, /quality.?meeting/i],
  EtudeClinique: [/etude/i, /study/i, /clinical/i],
  DomaineService: [/domaine/i, /service/i, /domain/i],
  ContexteReglementaire: [/contexte/i, /reglementaire/i, /regulatory/i],
  Alerte: [/alerte/i, /alert/i],
  Evenement: [/evenement/i, /event/i],
  KQI: [/kqi/i, /indicator/i, /kpi/i],
};

const RELATION_TYPE_PATTERNS: Record<string, RegExp[]> = {
  A_ETE_AUDITE_PAR: [/audit.*par/i, /audited/i],
  EST_SOUS_TRAITANT_DE: [/sous.?traitant.?de/i, /subcontractor/i],
  IMPLIQUE_ST: [/implique/i, /involves/i],
  GENERE_FINDING: [/genere.?finding/i, /generates/i],
  EST_LIE_AU_CONTRAT: [/contrat/i, /contract/i],
};

/**
 * Détecte automatiquement le type d'un onglet basé sur son nom
 */
export function detectSheetType(sheetName: string): {
  type: NodeType | EdgeType | null;
  isRelation: boolean;
  confidence: number;
} {
  const normalizedName = sheetName.toLowerCase().trim();

  // Vérifier les relations d'abord
  for (const [relType, patterns] of Object.entries(RELATION_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedName)) {
        return { type: relType as EdgeType, isRelation: true, confidence: 0.8 };
      }
    }
  }

  // Vérifier les types de nœuds
  for (const [nodeType, patterns] of Object.entries(NODE_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedName)) {
        return { type: nodeType as NodeType, isRelation: false, confidence: 0.9 };
      }
    }
  }

  return { type: null, isRelation: false, confidence: 0 };
}

/**
 * Détecte le mapping de colonnes basé sur les headers
 */
export function detectColumnMappings(
  headers: string[],
  targetType: NodeType | EdgeType,
  isRelation: boolean
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];

  // Patterns pour les champs communs
  const fieldPatterns: Record<string, RegExp[]> = {
    id: [/^id$/i, /^identifiant$/i, /^code$/i],
    nom: [/^nom$/i, /^name$/i, /^libelle$/i, /^label$/i],
    description: [/^description$/i, /^desc$/i],
    statut: [/^statut$/i, /^status$/i, /^etat$/i],
    criticite: [/^criticite$/i, /^criticality$/i, /^severity$/i],
    date_debut: [/^date.?debut$/i, /^start.?date$/i, /^debut$/i],
    date_fin: [/^date.?fin$/i, /^end.?date$/i, /^fin$/i],
    date_creation: [/^date.?creation$/i, /^created$/i, /^creation$/i],
    // Relations
    from: [/^from$/i, /^source$/i, /^de$/i, /^from_id$/i],
    to: [/^to$/i, /^target$/i, /^vers$/i, /^to_id$/i],
    niveau: [/^niveau$/i, /^level$/i, /^tier$/i],
  };

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();

    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedHeader)) {
          mappings.push({
            sourceColumn: header,
            targetField: field,
            required: field === 'id' || (isRelation && (field === 'from' || field === 'to')),
          });
          break;
        }
      }
    }

    // Si pas de mapping trouvé, mapper directement si le nom correspond
    if (!mappings.some((m) => m.sourceColumn === header)) {
      // Convertir le header en snake_case
      const snakeCase = header
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '')
        .replace(/\s+/g, '_');

      mappings.push({
        sourceColumn: header,
        targetField: snakeCase,
        required: false,
      });
    }
  }

  return mappings;
}

// =============================================================================
// Transformation des données
// =============================================================================

/**
 * Transforme les lignes Excel en nœuds du graphe
 */
export function transformToNodes(
  rows: Record<string, string>[],
  nodeType: NodeType,
  columnMappings: ColumnMapping[]
): { nodes: GraphNode[]; errors: { row: number; message: string; field?: string }[] } {
  const nodes: GraphNode[] = [];
  const errors: { row: number; message: string; field?: string }[] = [];

  rows.forEach((row, index) => {
    const node: Record<string, unknown> = { _type: nodeType };
    let hasError = false;

    for (const mapping of columnMappings) {
      const value = row[mapping.sourceColumn] ?? '';

      if (mapping.required && !value) {
        errors.push({
          row: index + 2, // +2 pour header + index 0
          message: `Champ obligatoire manquant: ${mapping.targetField}`,
          field: mapping.sourceColumn,
        });
        hasError = true;
        continue;
      }

      // Transformation selon le type
      let transformedValue: unknown = value;
      if (mapping.transform === 'number' && value) {
        transformedValue = parseFloat(value) || 0;
      } else if (mapping.transform === 'boolean') {
        transformedValue = value.toLowerCase() === 'true' || value === '1';
      } else if (mapping.transform === 'date' && value) {
        transformedValue = value; // Garder en string pour compatibilité
      }

      if (value !== '' || mapping.required) {
        node[mapping.targetField] = transformedValue;
      }
    }

    if (!hasError && node.id) {
      nodes.push(node as unknown as GraphNode);
    }
  });

  return { nodes, errors };
}

/**
 * Transforme les lignes Excel en relations du graphe
 */
export function transformToEdges(
  rows: Record<string, string>[],
  edgeType: EdgeType,
  columnMappings: ColumnMapping[]
): { edges: GraphEdge[]; errors: { row: number; message: string; field?: string }[] } {
  const edges: GraphEdge[] = [];
  const errors: { row: number; message: string; field?: string }[] = [];

  rows.forEach((row, index) => {
    let source = '';
    let target = '';
    const attrs: Record<string, unknown> = {};

    for (const mapping of columnMappings) {
      const value = row[mapping.sourceColumn] ?? '';

      if (mapping.targetField === 'from') {
        source = value;
      } else if (mapping.targetField === 'to') {
        target = value;
      } else if (value) {
        attrs[mapping.targetField] = value;
      }
    }

    if (!source || !target) {
      errors.push({
        row: index + 2,
        message: 'Source ou cible manquante',
        field: !source ? 'from' : 'to',
      });
      return;
    }

    edges.push({
      id: `${edgeType}-${source}-${target}-${index}`,
      source,
      target,
      _type: edgeType,
      ...attrs,
    } as GraphEdge);
  });

  return { edges, errors };
}

// =============================================================================
// Import complet depuis Excel
// =============================================================================

export interface ExcelImportResult {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  errors: { sheet: string; row: number; message: string; field?: string }[];
  stats: {
    sheetsProcessed: number;
    nodesImported: number;
    edgesImported: number;
    errorsCount: number;
  };
}

/**
 * Importe un fichier Excel complet avec les mappings fournis
 */
export async function importFromExcel(
  file: File,
  mappings: SheetMapping[]
): Promise<ExcelImportResult> {
  const parseResult = await parseExcelFile(file);
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const errors: { sheet: string; row: number; message: string; field?: string }[] = [];

  for (const mapping of mappings) {
    const sheet = parseResult.sheets.find((s) => s.name === mapping.sheetName);
    if (!sheet) continue;

    if (mapping.isRelation) {
      const result = transformToEdges(
        sheet.rows,
        mapping.targetType as EdgeType,
        mapping.columnMappings
      );

      for (const edge of result.edges) {
        edges.set(edge.id, edge);
      }

      for (const error of result.errors) {
        errors.push({ sheet: mapping.sheetName, ...error });
      }
    } else {
      const result = transformToNodes(
        sheet.rows,
        mapping.targetType as NodeType,
        mapping.columnMappings
      );

      for (const node of result.nodes) {
        nodes.set(node.id, node);
      }

      for (const error of result.errors) {
        errors.push({ sheet: mapping.sheetName, ...error });
      }
    }
  }

  return {
    nodes,
    edges,
    errors,
    stats: {
      sheetsProcessed: mappings.length,
      nodesImported: nodes.size,
      edgesImported: edges.size,
      errorsCount: errors.length,
    },
  };
}

export default {
  parseExcelFile,
  detectSheetType,
  detectColumnMappings,
  transformToNodes,
  transformToEdges,
  importFromExcel,
};
