/**
 * KG-Oversight - Parser CSV pour l'import des données
 * Utilise PapaParse pour parser les fichiers CSV
 */

import Papa from 'papaparse';
import type {
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  SousTraitant,
  Contrat,
  Audit,
  Finding,
  EtudeClinique,
  Alerte,
} from '@data/types';

// =============================================================================
// Types pour le parsing
// =============================================================================

interface ParseResult<T> {
  data: T[];
  errors: ParseError[];
}

interface ParseError {
  row: number;
  message: string;
  field?: string;
}

type CSVRow = Record<string, string>;

// =============================================================================
// Parser générique CSV
// =============================================================================

export async function parseCSVFile(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve(results.data as CSVRow[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function parseCSVString(csvString: string): CSVRow[] {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });
  return results.data as CSVRow[];
}

// =============================================================================
// Parsers spécifiques par type de nœud
// =============================================================================

export function parseSousTraitants(rows: CSVRow[]): ParseResult<SousTraitant> {
  const data: SousTraitant[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    if (!row['id'] || !row['nom']) {
      errors.push({ row: index + 1, message: 'ID ou nom manquant' });
      return;
    }

    data.push({
      _type: 'SousTraitant',
      id: row['id'],
      nom: row['nom'],
      statut: (row['statut'] as SousTraitant['statut']) ?? 'En évaluation',
      criticite: row['criticite'] as SousTraitant['criticite'] ?? '',
      date_creation: row['date_creation'],
      type_service: row['type_service'],
      pays: row['pays'],
      niveau_actuel: parseInt(row['niveau_actuel'] ?? '1', 10) as 1 | 2,
      source_donnees: row['source_donnees'],
    });
  });

  return { data, errors };
}

export function parseContrats(rows: CSVRow[]): ParseResult<Contrat> {
  const data: Contrat[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    if (!row['id'] || !row['nom']) {
      errors.push({ row: index + 1, message: 'ID ou nom manquant' });
      return;
    }

    data.push({
      _type: 'Contrat',
      id: row['id'],
      nom: row['nom'],
      statut: row['statut'],
      criticite: row['criticite'] as Contrat['criticite'] ?? '',
      date_debut: row['date_debut'],
      date_fin: row['date_fin'],
      type_contrat: row['type_contrat'],
      montant_annuel: row['montant_annuel'],
      version: row['version'] ? parseInt(row['version'], 10) : undefined,
      source_donnees: row['source_donnees'],
    });
  });

  return { data, errors };
}

export function parseAudits(rows: CSVRow[]): ParseResult<Audit> {
  const data: Audit[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    if (!row['id'] || !row['nom']) {
      errors.push({ row: index + 1, message: 'ID ou nom manquant' });
      return;
    }

    data.push({
      _type: 'Audit',
      id: row['id'],
      nom: row['nom'],
      statut: row['statut'],
      criticite: row['criticite'] as Audit['criticite'] ?? '',
      date_debut: row['date_debut'],
      date_fin: row['date_fin'],
      type_audit: row['type_audit'] as Audit['type_audit'],
      resultat: row['resultat'] as Audit['resultat'],
      declencheur: row['declencheur'],
      source_donnees: row['source_donnees'],
    });
  });

  return { data, errors };
}

export function parseEtudes(rows: CSVRow[]): ParseResult<EtudeClinique> {
  const data: EtudeClinique[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    if (!row['id'] || !row['nom']) {
      errors.push({ row: index + 1, message: 'ID ou nom manquant' });
      return;
    }

    data.push({
      _type: 'EtudeClinique',
      id: row['id'],
      nom: row['nom'],
      statut: row['statut'],
      criticite: row['criticite'] as EtudeClinique['criticite'] ?? '',
      date_debut: row['date_debut'],
      date_fin: row['date_fin'],
      phase: row['phase'] as EtudeClinique['phase'],
      indication: row['indication'],
      nb_patients: row['nb_patients'] ? parseInt(row['nb_patients'], 10) : undefined,
      source_donnees: row['source_donnees'],
    });
  });

  return { data, errors };
}

export function parseFindings(rows: CSVRow[]): ParseResult<Finding> {
  const data: Finding[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    if (!row['id'] || !row['description']) {
      errors.push({ row: index + 1, message: 'ID ou description manquant' });
      return;
    }

    data.push({
      _type: 'Finding',
      id: row['id'],
      description: row['description'],
      statut: row['statut'],
      criticite: row['criticite'] as Finding['criticite'] ?? '',
      date_detection: row['date_detection'],
      date_cloture: row['date_cloture'],
      capa_id: row['capa_id'],
      concerne_st2: row['concerne_st2'],
      source_donnees: row['source_donnees'],
    });
  });

  return { data, errors };
}

export function parseAlertes(rows: CSVRow[]): ParseResult<Alerte> {
  const data: Alerte[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    if (!row['id'] || !row['description']) {
      errors.push({ row: index + 1, message: 'ID ou description manquant' });
      return;
    }

    data.push({
      _type: 'Alerte',
      id: row['id'],
      description: row['description'],
      statut: row['statut'],
      criticite: row['criticite'] as Alerte['criticite'] ?? '',
      date_creation: row['date_creation'],
      date_resolution: row['date_resolution'],
      niveau: row['niveau'] as Alerte['niveau'],
      regle_id: row['regle_id'],
      declencheur: row['declencheur'],
      st_concerne: row['st_concerne'],
      source_donnees: row['source_donnees'],
    });
  });

  return { data, errors };
}

// =============================================================================
// Parser de relations
// =============================================================================

export function parseRelations(rows: CSVRow[], edgeType: EdgeType): ParseResult<GraphEdge> {
  const data: GraphEdge[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    const source = row['from'];
    const target = row['to'];

    if (!source || !target) {
      errors.push({ row: index + 1, message: 'Source ou cible manquante' });
      return;
    }

    const edge: GraphEdge = {
      id: `${edgeType}-${source}-${target}`,
      source,
      target,
      _type: edgeType,
      date_lien: row['date_lien'],
      validite: row['validite'],
    };

    // Attributs spécifiques selon le type
    if (row['niveau']) edge.niveau = parseInt(row['niveau'], 10) as 1 | 2;
    if (row['role']) edge.role = row['role'];
    if (row['via']) edge.via = row['via'];
    if (row['impact']) edge.impact = row['impact'];
    if (row['score_evaluation']) edge.score_evaluation = parseInt(row['score_evaluation'], 10);
    if (row['en_reevaluation']) edge.en_reevaluation = row['en_reevaluation'] === 'true';

    data.push(edge);
  });

  return { data, errors };
}

// =============================================================================
// Fonction principale d'import
// =============================================================================

export interface ImportResult {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  errors: { file: string; errors: ParseError[] }[];
}

export async function importFromCSVFiles(files: {
  nodes: Map<NodeType, File>;
  relations: Map<EdgeType, File>;
}): Promise<ImportResult> {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const errors: { file: string; errors: ParseError[] }[] = [];

  // Mapping des types vers les parsers
  const nodeParsers: Record<string, (rows: CSVRow[]) => ParseResult<GraphNode>> = {
    SousTraitant: parseSousTraitants as (rows: CSVRow[]) => ParseResult<GraphNode>,
    Contrat: parseContrats as (rows: CSVRow[]) => ParseResult<GraphNode>,
    Audit: parseAudits as (rows: CSVRow[]) => ParseResult<GraphNode>,
    EtudeClinique: parseEtudes as (rows: CSVRow[]) => ParseResult<GraphNode>,
    Finding: parseFindings as (rows: CSVRow[]) => ParseResult<GraphNode>,
    Alerte: parseAlertes as (rows: CSVRow[]) => ParseResult<GraphNode>,
  };

  // Parser les fichiers de nœuds
  for (const [nodeType, file] of files.nodes) {
    const parser = nodeParsers[nodeType];
    if (!parser) continue;

    const rows = await parseCSVFile(file);
    const result = parser(rows);

    for (const node of result.data) {
      nodes.set(node.id, node);
    }

    if (result.errors.length > 0) {
      errors.push({ file: file.name, errors: result.errors });
    }
  }

  // Parser les fichiers de relations
  for (const [edgeType, file] of files.relations) {
    const rows = await parseCSVFile(file);
    const result = parseRelations(rows, edgeType);

    for (const edge of result.data) {
      edges.set(edge.id, edge);
    }

    if (result.errors.length > 0) {
      errors.push({ file: file.name, errors: result.errors });
    }
  }

  return { nodes, edges, errors };
}
