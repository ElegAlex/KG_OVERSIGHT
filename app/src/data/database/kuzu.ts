/**
 * KG-Oversight - Service Kuzu WASM
 * Base de données graphe embarquée avec requêtes Cypher
 */

import initKuzu, { Database, Connection } from '@kuzu/kuzu-wasm';
import type { GraphNode, GraphEdge, NodeType, EdgeType } from '@data/types';

// État singleton du service Kuzu
let db: Database | null = null;
let conn: Connection | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialise la base de données Kuzu WASM
 * Cette fonction est idempotente et peut être appelée plusieurs fois
 */
export async function initKuzuDB(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Initialiser le module WASM
      await initKuzu();

      // Créer la base de données en mémoire
      db = new Database(':memory:', 0, true, false, 4 * 1024 * 1024 * 1024); // 4GB buffer pool
      conn = new Connection(db, 4); // 4 threads max

      isInitialized = true;
      console.log('[Kuzu] Database initialized successfully');
    } catch (error) {
      console.error('[Kuzu] Failed to initialize database:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Obtenir la connexion active
 */
export function getConnection(): Connection {
  if (!conn) {
    throw new Error('[Kuzu] Database not initialized. Call initKuzuDB() first.');
  }
  return conn;
}

/**
 * Exécuter une requête Cypher et retourner les résultats
 */
export async function query<T = unknown>(cypher: string): Promise<T[]> {
  const connection = getConnection();

  try {
    const result = await connection.query(cypher);
    const rows: T[] = [];

    while (result.hasNext()) {
      rows.push(result.getNext() as T);
    }

    result.close();
    return rows;
  } catch (error) {
    console.error('[Kuzu] Query failed:', cypher, error);
    throw error;
  }
}

/**
 * Exécuter une requête Cypher sans retour de données
 */
export async function execute(cypher: string): Promise<void> {
  const connection = getConnection();

  try {
    const result = await connection.query(cypher);
    result.close();
  } catch (error) {
    console.error('[Kuzu] Execute failed:', cypher, error);
    throw error;
  }
}

/**
 * Créer le schéma de la base de données
 */
export async function createSchema(): Promise<void> {
  const connection = getConnection();

  // Tables de nœuds
  const nodeTableDDL = `
    CREATE NODE TABLE IF NOT EXISTS SousTraitant (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      criticite STRING,
      date_creation DATE,
      type_service STRING,
      pays STRING,
      niveau_actuel INT16,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS Contrat (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      date_debut DATE,
      date_fin DATE,
      type_contrat STRING,
      montant_annuel STRING,
      version INT16,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS AccordQualite (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      date_debut DATE,
      date_fin DATE,
      version INT16,
      revision_en_cours BOOLEAN,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS Audit (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      criticite STRING,
      date_debut DATE,
      date_fin DATE,
      type_audit STRING,
      resultat STRING,
      declencheur STRING,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS Inspection (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      criticite STRING,
      date_debut DATE,
      date_fin DATE,
      autorite STRING,
      type_inspection STRING,
      resultat STRING,
      nb_observations INT16,
      nb_critiques INT16,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS Finding (
      id STRING PRIMARY KEY,
      description STRING,
      statut STRING,
      criticite STRING,
      date_detection DATE,
      date_cloture DATE,
      capa_id STRING,
      concerne_st2 STRING,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS EvenementQualite (
      id STRING PRIMARY KEY,
      description STRING,
      statut STRING,
      criticite STRING,
      date_creation DATE,
      date_cloture DATE,
      impact STRING,
      nb_echantillons_impactes INT32,
      retard_jours INT16,
      nb_erreurs INT16,
      delai_detection_mois INT16,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS Decision (
      id STRING PRIMARY KEY,
      description STRING,
      statut STRING,
      criticite STRING,
      date_decision DATE,
      decideur STRING,
      nature STRING,
      duree_mois INT16,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS EvaluationRisque (
      id STRING PRIMARY KEY,
      description STRING,
      statut STRING,
      criticite STRING,
      date_evaluation DATE,
      score STRING,
      evolution STRING,
      findings_critiques INT16,
      qe_critiques INT16,
      kqi_alertes INT16,
      inspection_recente BOOLEAN,
      audit_for_cause BOOLEAN,
      prochaine_evaluation DATE,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS ReunionQualite (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      criticite STRING,
      date_reunion DATE,
      trimestre STRING,
      semestre STRING,
      periodicite STRING,
      motif STRING,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS EtudeClinique (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      criticite STRING,
      date_debut DATE,
      date_fin DATE,
      phase STRING,
      indication STRING,
      nb_patients INT32,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS DomaineService (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      criticite STRING,
      date_creation DATE,
      categorie STRING,
      complexite STRING,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS ContexteReglementaire (
      id STRING PRIMARY KEY,
      nom STRING,
      statut STRING,
      criticite STRING,
      date_application DATE,
      reference STRING,
      impact STRING,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS Alerte (
      id STRING PRIMARY KEY,
      description STRING,
      statut STRING,
      criticite STRING,
      date_creation DATE,
      date_resolution DATE,
      niveau STRING,
      regle_id STRING,
      declencheur STRING,
      st_concerne STRING,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS Evenement (
      id STRING PRIMARY KEY,
      description STRING,
      statut STRING,
      criticite STRING,
      date_creation DATE,
      date_cloture DATE,
      type_evenement STRING,
      source STRING,
      impact STRING,
      source_donnees STRING
    );

    CREATE NODE TABLE IF NOT EXISTS KQI (
      id STRING PRIMARY KEY,
      sous_traitant_id STRING,
      sous_traitant_nom STRING,
      indicateur STRING,
      periode STRING,
      valeur DOUBLE,
      seuil_alerte DOUBLE,
      seuil_objectif DOUBLE,
      statut STRING,
      tendance STRING,
      source_donnees STRING
    );
  `;

  // Exécuter chaque CREATE TABLE séparément
  const statements = nodeTableDDL.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await execute(stmt + ';');
      } catch (e) {
        // Ignorer les erreurs "table already exists"
        console.log('[Kuzu] Schema statement:', stmt.substring(0, 50) + '...');
      }
    }
  }

  console.log('[Kuzu] Schema created successfully');
}

/**
 * Importer des nœuds depuis une Map
 */
export async function importNodes(nodes: Map<string, GraphNode>): Promise<number> {
  let count = 0;

  for (const [id, node] of nodes) {
    try {
      // Construire la requête CREATE pour chaque type de nœud
      const props = buildNodeProperties(node);
      const cypher = `CREATE (n:${node._type} ${props})`;
      await execute(cypher);
      count++;
    } catch (error) {
      console.warn(`[Kuzu] Failed to import node ${id}:`, error);
    }
  }

  console.log(`[Kuzu] Imported ${count} nodes`);
  return count;
}

/**
 * Importer des arêtes depuis une Map
 */
export async function importEdges(edges: Map<string, GraphEdge>, nodes: Map<string, GraphNode>): Promise<number> {
  let count = 0;

  for (const [id, edge] of edges) {
    try {
      const sourceNode = nodes.get(edge.source);
      const targetNode = nodes.get(edge.target);

      if (!sourceNode || !targetNode) continue;

      const props = buildEdgeProperties(edge);
      const cypher = `
        MATCH (a:${sourceNode._type} {id: '${edge.source}'})
        MATCH (b:${targetNode._type} {id: '${edge.target}'})
        CREATE (a)-[:${edge._type} ${props}]->(b)
      `;
      await execute(cypher);
      count++;
    } catch (error) {
      console.warn(`[Kuzu] Failed to import edge ${id}:`, error);
    }
  }

  console.log(`[Kuzu] Imported ${count} edges`);
  return count;
}

/**
 * Construire la chaîne de propriétés pour un nœud
 */
function buildNodeProperties(node: GraphNode): string {
  const props: string[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === '_type') continue;
    if (value === undefined || value === null) continue;

    if (typeof value === 'string') {
      props.push(`${key}: '${escapeString(value)}'`);
    } else if (typeof value === 'number') {
      props.push(`${key}: ${value}`);
    } else if (typeof value === 'boolean') {
      props.push(`${key}: ${value}`);
    }
  }

  return `{${props.join(', ')}}`;
}

/**
 * Construire la chaîne de propriétés pour une arête
 */
function buildEdgeProperties(edge: GraphEdge): string {
  const props: string[] = [];
  const skipKeys = new Set(['id', 'source', 'target', '_type']);

  for (const [key, value] of Object.entries(edge)) {
    if (skipKeys.has(key)) continue;
    if (value === undefined || value === null) continue;

    if (typeof value === 'string') {
      props.push(`${key}: '${escapeString(value)}'`);
    } else if (typeof value === 'number') {
      props.push(`${key}: ${value}`);
    } else if (typeof value === 'boolean') {
      props.push(`${key}: ${value}`);
    }
  }

  return props.length > 0 ? `{${props.join(', ')}}` : '';
}

/**
 * Échapper les caractères spéciaux dans les chaînes
 */
function escapeString(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

// =============================================================================
// Requêtes métier
// =============================================================================

/**
 * Trouver tous les sous-traitants d'une étude avec leur niveau
 */
export async function getStudySubcontractors(studyId: string): Promise<{
  st: GraphNode;
  niveau: number;
  role: string;
  via?: string;
}[]> {
  const cypher = `
    MATCH (e:EtudeClinique {id: '${studyId}'})-[r:IMPLIQUE_ST]->(st:SousTraitant)
    RETURN st, r.niveau AS niveau, r.role AS role, r.via AS via
    ORDER BY r.niveau, st.nom
  `;

  return query(cypher);
}

/**
 * Trouver la chaîne de sous-traitance pour un ST donné
 */
export async function getSubcontractorChain(stId: string): Promise<{
  path: GraphNode[];
}[]> {
  const cypher = `
    MATCH path = (st:SousTraitant {id: '${stId}'})-[:EST_SOUS_TRAITANT_DE*0..3]->(parent:SousTraitant)
    RETURN nodes(path) AS path
  `;

  return query(cypher);
}

/**
 * Trouver tous les findings critiques non clôturés
 */
export async function getCriticalOpenFindings(): Promise<GraphNode[]> {
  const cypher = `
    MATCH (f:Finding)
    WHERE f.criticite = 'Critique' AND f.statut <> 'Clôturé'
    RETURN f
    ORDER BY f.date_detection DESC
  `;

  const results = await query<{ f: GraphNode }>(cypher);
  return results.map(r => r.f);
}

/**
 * Calculer le score de risque d'un sous-traitant
 */
export async function calculateRiskScore(stId: string): Promise<{
  findingsCritiques: number;
  qeCritiques: number;
  alertesActives: number;
  inspectionRecente: boolean;
  score: 'Low' | 'Medium' | 'High';
}> {
  // Compter les findings critiques
  const findingsQuery = `
    MATCH (st:SousTraitant {id: '${stId}'})<-[:A_ETE_AUDITE_PAR]-(a:Audit)-[:GENERE_FINDING]->(f:Finding)
    WHERE f.criticite = 'Critique' AND f.statut <> 'Clôturé'
    RETURN count(f) AS count
  `;

  // Compter les QE critiques
  const qeQuery = `
    MATCH (qe:EvenementQualite)-[:QE_CONCERNE_ST]->(st:SousTraitant {id: '${stId}'})
    WHERE qe.criticite = 'Critique' AND qe.statut <> 'Clôturé'
    RETURN count(qe) AS count
  `;

  // Compter les alertes actives
  const alertesQuery = `
    MATCH (a:Alerte)
    WHERE a.st_concerne = '${stId}' AND a.statut = 'Active'
    RETURN count(a) AS count
  `;

  // Inspection récente (< 12 mois)
  const inspectionQuery = `
    MATCH (st:SousTraitant {id: '${stId}'})<-[:A_ETE_INSPECTE_PAR]-(i:Inspection)
    WHERE i.date_debut > date() - duration({months: 12})
    RETURN count(i) AS count
  `;

  const [findings, qe, alertes, inspection] = await Promise.all([
    query<{ count: number }>(findingsQuery),
    query<{ count: number }>(qeQuery),
    query<{ count: number }>(alertesQuery),
    query<{ count: number }>(inspectionQuery),
  ]);

  const findingsCritiques = findings[0]?.count ?? 0;
  const qeCritiques = qe[0]?.count ?? 0;
  const alertesActives = alertes[0]?.count ?? 0;
  const inspectionRecente = (inspection[0]?.count ?? 0) > 0;

  // Calcul du score
  let score: 'Low' | 'Medium' | 'High' = 'Low';

  if (findingsCritiques > 0 || qeCritiques > 0 || inspectionRecente) {
    score = 'High';
  } else if (alertesActives > 2 || findingsCritiques + qeCritiques > 0) {
    score = 'Medium';
  }

  return {
    findingsCritiques,
    qeCritiques,
    alertesActives,
    inspectionRecente,
    score,
  };
}

/**
 * Obtenir la timeline d'un sous-traitant
 */
export async function getSubcontractorTimeline(stId: string): Promise<{
  type: string;
  node: GraphNode;
  date: string;
}[]> {
  const cypher = `
    MATCH (st:SousTraitant {id: '${stId}'})
    OPTIONAL MATCH (st)<-[:A_ETE_AUDITE_PAR]-(a:Audit)
    OPTIONAL MATCH (st)<-[:A_ETE_INSPECTE_PAR]-(i:Inspection)
    OPTIONAL MATCH (qe:EvenementQualite)-[:QE_CONCERNE_ST]->(st)
    OPTIONAL MATCH (st)<-[:A_FAIT_OBJET_EVALUATION]-(e:EvaluationRisque)
    RETURN
      collect(DISTINCT {type: 'Audit', node: a, date: a.date_debut}) +
      collect(DISTINCT {type: 'Inspection', node: i, date: i.date_debut}) +
      collect(DISTINCT {type: 'EvenementQualite', node: qe, date: qe.date_creation}) +
      collect(DISTINCT {type: 'EvaluationRisque', node: e, date: e.date_evaluation})
      AS events
  `;

  const results = await query<{ events: { type: string; node: GraphNode; date: string }[] }>(cypher);

  // Aplatir et trier par date
  const events = results[0]?.events ?? [];
  return events
    .filter(e => e.node && e.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Fermer la base de données
 */
export function closeDB(): void {
  if (conn) {
    conn.close();
    conn = null;
  }
  if (db) {
    db.close();
    db = null;
  }
  isInitialized = false;
  initPromise = null;
  console.log('[Kuzu] Database closed');
}

export default {
  initKuzuDB,
  getConnection,
  query,
  execute,
  createSchema,
  importNodes,
  importEdges,
  getStudySubcontractors,
  getSubcontractorChain,
  getCriticalOpenFindings,
  calculateRiskScore,
  getSubcontractorTimeline,
  closeDB,
};
