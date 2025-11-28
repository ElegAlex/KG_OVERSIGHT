# Architecture technique complète pour Knowledge Graph Oversight

**Recommandation architecturale optimale** : Tauri 2.0 + React 19 + Sigma.js v3 + Kuzu WASM constitue la stack idéale pour cette application desktop mono-développeur, offrant des bundles **10x plus légers** qu'Electron, une visualisation **10k+ nœuds à 60fps**, et un véritable langage de requêtes graphe via Cypher. Cette architecture privilégie la maintenabilité et la performance tout en restant accessible à un développeur JavaScript expérimenté.

---

## Stack technique recommandée avec justifications

### Framework desktop : Tauri 2.0

|Critère|Tauri 2.0 ✓|Electron|Wails|
|---|---|---|---|
|**Bundle**|3-10 MB|80-120 MB|4-10 MB|
|**RAM idle**|30-40 MB|200-300 MB|~100 MB|
|**Startup**|<500ms|1-2s|<1s|
|**Auto-update**|Natif|Natif|❌ Absent|
|**WebGL**|Excellent (Win/Mac)|Parfait|Variable|

Tauri 2.0 (v2.9.3, stable depuis octobre 2024) utilise les WebViews natives (WebView2 sur Windows, WKWebView sur macOS) au lieu d'embarquer Chromium. Pour une application de visualisation graphe destinée à des profils métier non-techniques, les bundles de **3-10 MB** contre 100+ MB facilitent drastiquement la distribution et les mises à jour. Le système de plugins couvre tous les besoins : `fs`, `dialog`, `shell`, `notification`, `store`, `updater`.

### Framework UI : React 19

| Framework      | Performance  | Écosystème viz | TypeScript | Solo-dev |
| -------------- | ------------ | -------------- | ---------- | -------- |
| **React 19** ✓ | Concurrent   | Excellent      | Natif      | Idéal    |
| Vue 3          | Fine-grained | Bon            | Bon        | Bon      |
| Svelte 5       | Compile-time | Limité         | Bon        | Risqué   |
| SolidJS        | Optimal      | Très limité    | Natif      | Risqué   |

React domine pour les applications de visualisation de données grâce à son écosystème inégalé : `@react-sigma/core`, `echarts-for-react`, `react-vis-timeline`. Les fonctionnalités concurrent rendering (`startTransition`, `useDeferredValue`) permettent de maintenir **60fps** pendant le filtrage de grands datasets. L'intégration TypeScript est native et la documentation abondante.

### Visualisation graphe : Sigma.js v3 + graphology

|Bibliothèque|Max nœuds 60fps|Layouts hiérarchiques|TypeScript|Licence|
|---|---|---|---|---|
|**Sigma.js v3** ✓|10-15k|Via dagre|Natif|MIT|
|G6 5.0|5-10k|Natifs multiples|Natif|MIT|
|Cytoscape.js|5-10k (WebGL)|dagre/klay|Definitions|MIT|
|Cosmos|100k+|❌ Force only|Natif|CC-BY-NC|

Sigma.js v3 (réécriture complète mars 2024) offre le meilleur équilibre performance/fonctionnalités pour **10k+ nœuds**. L'architecture séparant **graphology** (structure de données, algorithmes) de **Sigma** (rendu WebGL) est élégante et maintenable. Le rendu WebGL pur garantit des performances supérieures au Canvas.

**Packages requis** :

- `sigma` + `graphology` : Core
- `graphology-layout-forceatlas2` : Layout force-directed avec WebWorker
- `@sigma/node-image`, `@sigma/edge-curve` : Customisation visuelle
- `@sigma/export-image` : Export PNG/JPEG
- `graphology-svg` : Export SVG
- `@react-sigma/core` : Binding React

### Base de données embarquée : Kuzu WASM

|Solution|Langage requête|Modèle graphe|FTS|Bundle|
|---|---|---|---|---|
|**Kuzu WASM** ✓|Cypher|Natif|✓|~3-5 MB|
|SQLite (sql.js)|SQL + CTE|Tables|FTS5|~1.5 MB|
|DuckDB WASM|SQL + CTE|Tables|Extension|~6-18 MB|
|LevelGraph|Pattern match|Triples|❌|~200 KB|

Kuzu (`@kuzu/kuzu-wasm` v0.7.0) est le seul à offrir un véritable langage de requêtes graphe **Cypher** dans un contexte WASM embarqué. Pour une application Knowledge Graph avec **16 types de nœuds et 18 types de relations**, la modélisation native en property graph est infiniment plus naturelle que les recursive CTEs SQL.

```cypher
-- Requête naturelle en Kuzu
MATCH (audit:Audit)-[:HAS_FINDING]->(f:Finding)-[:CONCERNS]->(nc:NonConformite)
WHERE audit.date > date('2024-01-01') AND nc.criticite = 'Majeure'
RETURN audit, f, nc
```

**Stratégie de persistance** : IDBFS (IndexedDB-backed filesystem via Emscripten) en mode browser, filesystem natif via commandes Tauri en production.

**Fallback SQLite** : Si Kuzu WASM présente des limitations en production, `better-sqlite3` côté Rust (via `rusqlite`) avec proxy vers le frontend reste une option solide.

### State management : Jotai + TanStack Query

|Solution|Modèle|Multi-vues sync|Undo/Redo|DevTools|
|---|---|---|---|---|
|**Jotai** ✓|Atomique|Excellent|jotai-history|✓|
|Zustand|Centralisé|Bon|Manual|✓|
|Redux Toolkit|Flux|Bon|redux-undo|✓|

Jotai excelle pour la synchronisation multi-vues avec son modèle atomique. Chaque vue (graphe, timeline, dashboard) souscrit aux mêmes atomes dérivés, garantissant une **synchronisation automatique** sans boilerplate.

```typescript
// Atomes partagés entre toutes les vues
const selectedNodeIdsAtom = atom<Set<string>>(new Set())
const timeRangeAtom = atom<[Date, Date]>([startDate, endDate])
const filterCriteriaAtom = atom<FilterState>({})

// Atome dérivé consommé par graphe, timeline, dashboard
const filteredNodesAtom = atom((get) => {
  const nodes = get(allNodesAtom)
  const filters = get(filterCriteriaAtom)
  const timeRange = get(timeRangeAtom)
  return applyFilters(nodes, filters, timeRange)
})
```

**TanStack Query** gère le caching et les requêtes vers Kuzu, avec invalidation automatique et DevTools intégrés.

### Timeline : vis-timeline

vis-timeline (3k+ stars, maintenance active) offre le zoom multi-échelles (millisecondes → années), les groupes pour catégoriser les événements, et un système d'événements riche (`select`, `rangechange`) permettant la **synchronisation bidirectionnelle** avec le graphe.

### Dashboard/Charting : Apache ECharts

Apache ECharts (59k stars) domine pour les dashboards KQI grâce à :

- **Performance** : Rendering progressif pour 100k+ points, sampling LTTB
- **Alertes** : `markLine` et `markArea` pour visualiser les seuils
- **Export** : PNG, SVG, données
- **Theming** : Dark/light mode natif

Bundle tree-shakeable de ~400KB pour les charts nécessaires.

### UI Components : shadcn/ui + Radix UI + Tremor

- **shadcn/ui** : Composants copiables et modifiables (pas de dépendance npm)
- **Radix UI** : Primitives accessibles (Dialog, Dropdown, Tooltip)
- **Tremor** : Composants dashboard pré-stylés (KPI cards, sparklines)
- **Tailwind CSS** : Styling utility-first avec design tokens cohérents

### Build tooling

- **Vite 5** : Build dev instantané, HMR optimisé
- **TypeScript 5.x** : Strict mode activé
- **Biome** : Linting + formatting (remplace ESLint + Prettier, plus rapide)
- **pnpm** : Gestionnaire de packages performant

---

## Architecture applicative détaillée

### Structure de dossiers recommandée (feature-based)

```
src/
├── app/                          # Configuration globale
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx             # Jotai, TanStack Query providers
│
├── features/                     # Modules fonctionnels isolés
│   ├── graph/                    # Visualisation graphe
│   │   ├── components/
│   │   │   ├── GraphCanvas.tsx
│   │   │   ├── NodeTooltip.tsx
│   │   │   └── GraphControls.tsx
│   │   ├── hooks/
│   │   │   ├── useGraphData.ts
│   │   │   └── useGraphInteractions.ts
│   │   ├── layouts/              # Algorithmes de layout
│   │   │   ├── hierarchical.ts
│   │   │   ├── radial.ts
│   │   │   └── forceAtlas.worker.ts
│   │   ├── stores/
│   │   │   └── graphAtoms.ts
│   │   └── index.ts
│   │
│   ├── timeline/                 # Timeline temporelle
│   │   ├── components/
│   │   ├── hooks/
│   │   └── stores/
│   │
│   ├── dashboard/                # KQI Dashboard
│   │   ├── components/
│   │   │   ├── KQIChart.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   └── EntityComparison.tsx
│   │   └── hooks/
│   │
│   ├── scenarios/                # Parcours guidés
│   │   ├── components/
│   │   │   ├── ScenarioPlayer.tsx
│   │   │   └── StepHighlighter.tsx
│   │   ├── data/
│   │   │   └── scenarios.json
│   │   └── hooks/
│   │
│   ├── inference/                # Moteur de règles
│   │   ├── engine/
│   │   │   ├── RuleEngine.ts
│   │   │   └── rules/
│   │   │       ├── criticalNC.ts
│   │   │       ├── findingAge.ts
│   │   │       └── kqiDegradation.ts
│   │   ├── workers/
│   │   │   └── inference.worker.ts
│   │   └── hooks/
│   │
│   └── import/                   # Import CSV/Excel
│       ├── components/
│       │   ├── ImportWizard.tsx
│       │   └── MappingEditor.tsx
│       ├── parsers/
│       │   ├── csvParser.ts
│       │   └── excelParser.ts
│       └── validators/
│
├── shared/                       # Code partagé
│   ├── components/               # UI génériques
│   │   ├── Button.tsx
│   │   ├── Dialog.tsx
│   │   └── DataTable.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── stores/                   # Atomes globaux
│   │   ├── selectionAtoms.ts
│   │   ├── filterAtoms.ts
│   │   └── uiAtoms.ts
│   └── utils/
│       ├── dateUtils.ts
│       └── formatters.ts
│
├── data/                         # Couche données
│   ├── database/
│   │   ├── kuzu.ts              # Client Kuzu WASM
│   │   ├── schema.ts            # Définition schéma
│   │   └── migrations/
│   ├── repositories/            # Accès données typé
│   │   ├── nodeRepository.ts
│   │   ├── edgeRepository.ts
│   │   └── queryRepository.ts
│   └── types/                   # Types TypeScript
│       ├── entities.ts
│       └── graph.ts
│
├── workers/                     # Web Workers
│   ├── layout.worker.ts
│   ├── inference.worker.ts
│   └── export.worker.ts
│
└── styles/
    ├── globals.css
    └── themes/
        ├── light.css
        └── dark.css

src-tauri/                       # Backend Rust Tauri
├── src/
│   ├── main.rs
│   ├── commands/               # Commandes IPC
│   │   ├── file.rs
│   │   └── export.rs
│   └── lib.rs
├── Cargo.toml
└── tauri.conf.json
```

### Patterns architecturaux clés

**Feature-based organization** : Chaque domaine fonctionnel (graph, timeline, dashboard) est autonome avec ses composants, hooks, et stores. Cette isolation facilite la maintenance et les tests.

**Séparation des concerns** :

- **UI Layer** : Composants React, interactions utilisateur
- **State Layer** : Jotai atoms, derived state
- **Data Layer** : Repositories, Kuzu client, TanStack Query
- **Business Layer** : Moteur d'inférence, règles métier

### Web Workers pour calculs lourds

Trois workers dédiés évitent le blocage du thread principal :

```typescript
// layout.worker.ts - Calcul ForceAtlas2
import { ForceAtlas2Layout } from 'graphology-layout-forceatlas2'

self.onmessage = ({ data: { nodes, edges, settings } }) => {
  const graph = buildGraph(nodes, edges)
  const positions = ForceAtlas2Layout(graph, settings)
  self.postMessage({ type: 'LAYOUT_COMPLETE', positions })
}

// inference.worker.ts - Exécution règles métier
self.onmessage = async ({ data: { nodes, rules } }) => {
  const alerts = await executeRules(nodes, rules)
  self.postMessage({ type: 'INFERENCE_COMPLETE', alerts })
}
```

**Intégration Jotai** : Les workers communiquent via `postMessage`, les résultats mettent à jour les atomes via `useSetAtom`.

---

## Modèle de données

### Schéma Kuzu (Cypher DDL)

```cypher
-- ==================== NODE TABLES ====================

CREATE NODE TABLE Organisation (
  id STRING PRIMARY KEY,
  nom STRING NOT NULL,
  type STRING,                    -- 'Client', 'Filiale', 'Partenaire'
  secteur STRING,
  metadata JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

CREATE NODE TABLE Site (
  id STRING PRIMARY KEY,
  nom STRING NOT NULL,
  adresse STRING,
  pays STRING,
  coordinates DOUBLE[2],          -- [latitude, longitude]
  metadata JSON
)

CREATE NODE TABLE Domaine (
  id STRING PRIMARY KEY,
  nom STRING NOT NULL,
  description STRING,
  parent_id STRING                -- Hiérarchie de domaines
)

CREATE NODE TABLE SousTraitant (
  id STRING PRIMARY KEY,
  nom STRING NOT NULL,
  niveau INT32,                   -- 1 = N1, 2 = N2
  statut STRING,                  -- 'Actif', 'Suspendu', 'Archivé'
  date_qualification DATE,
  metadata JSON
)

CREATE NODE TABLE Audit (
  id STRING PRIMARY KEY,
  reference STRING NOT NULL,
  type STRING,                    -- 'Initial', 'Surveillance', 'Renouvellement'
  date_debut DATE NOT NULL,
  date_fin DATE,
  statut STRING,                  -- 'Planifié', 'En cours', 'Terminé'
  score FLOAT,
  metadata JSON
)

CREATE NODE TABLE Finding (
  id STRING PRIMARY KEY,
  reference STRING,
  description STRING NOT NULL,
  type STRING,                    -- 'Observation', 'Écart mineur', 'Écart majeur'
  date_detection DATE NOT NULL,
  date_cloture DATE,
  metadata JSON
)

CREATE NODE TABLE NonConformite (
  id STRING PRIMARY KEY,
  reference STRING NOT NULL,
  description STRING,
  criticite STRING,               -- 'Mineure', 'Majeure', 'Critique'
  statut STRING,                  -- 'Ouverte', 'En traitement', 'Clôturée'
  date_ouverture DATE NOT NULL,
  date_cible DATE,
  date_cloture DATE,
  metadata JSON
)

CREATE NODE TABLE ActionCorrective (
  id STRING PRIMARY KEY,
  description STRING NOT NULL,
  responsable STRING,
  date_prevue DATE,
  date_realisation DATE,
  statut STRING,                  -- 'À faire', 'En cours', 'Réalisée', 'Vérifiée'
  efficacite STRING,
  metadata JSON
)

CREATE NODE TABLE QualificationEvent (
  id STRING PRIMARY KEY,
  type STRING,                    -- 'Qualification', 'Requalification', 'Suspension'
  date DATE NOT NULL,
  decision STRING,
  validite_fin DATE,
  metadata JSON
)

CREATE NODE TABLE Decision (
  id STRING PRIMARY KEY,
  type STRING,
  description STRING,
  date DATE NOT NULL,
  decideur STRING,
  metadata JSON
)

CREATE NODE TABLE Regle (
  id STRING PRIMARY KEY,
  nom STRING NOT NULL,
  description STRING,
  condition STRING,               -- Expression de règle
  action STRING,                  -- Action déclenchée
  severite STRING,
  active BOOLEAN DEFAULT true,
  metadata JSON
)

CREATE NODE TABLE Alerte (
  id STRING PRIMARY KEY,
  type STRING NOT NULL,
  message STRING,
  severite STRING,                -- 'Info', 'Warning', 'Critical'
  date_creation TIMESTAMP NOT NULL,
  date_traitement TIMESTAMP,
  statut STRING,                  -- 'Active', 'Acquittée', 'Résolue'
  metadata JSON
)

CREATE NODE TABLE KQI (
  id STRING PRIMARY KEY,
  nom STRING NOT NULL,
  description STRING,
  unite STRING,
  seuil_warning FLOAT,
  seuil_critical FLOAT,
  metadata JSON
)

CREATE NODE TABLE Document (
  id STRING PRIMARY KEY,
  titre STRING NOT NULL,
  type STRING,                    -- 'Rapport', 'Certificat', 'Procédure'
  chemin STRING,
  date_creation DATE,
  metadata JSON
)

CREATE NODE TABLE Personne (
  id STRING PRIMARY KEY,
  nom STRING NOT NULL,
  prenom STRING,
  email STRING,
  role STRING,                    -- 'Auditeur', 'Responsable qualité', 'Manager'
  organisation_id STRING,
  metadata JSON
)

-- ==================== RELATIONSHIP TABLES ====================

CREATE REL TABLE APPARTIENT_A (FROM Site TO Organisation)
CREATE REL TABLE COUVRE_DOMAINE (FROM Organisation TO Domaine)
CREATE REL TABLE SOUS_TRAITE_POUR (FROM SousTraitant TO Organisation, depuis DATE)
CREATE REL TABLE AUDITE (FROM Audit TO SousTraitant)
CREATE REL TABLE AUDITE_SITE (FROM Audit TO Site)
CREATE REL TABLE CONCERNE_DOMAINE (FROM Audit TO Domaine)
CREATE REL TABLE PRODUIT_FINDING (FROM Audit TO Finding)
CREATE REL TABLE GENERE_NC (FROM Finding TO NonConformite)
CREATE REL TABLE TRAITE_PAR (FROM NonConformite TO ActionCorrective)
CREATE REL TABLE QUALIFIE (FROM QualificationEvent TO SousTraitant)
CREATE REL TABLE DECIDE (FROM Decision TO QualificationEvent)
CREATE REL TABLE DECLENCHE_ALERTE (FROM Regle TO Alerte)
CREATE REL TABLE CONCERNE_ENTITE (FROM Alerte TO Organisation | Site | SousTraitant)
CREATE REL TABLE MESURE_KQI (FROM KQI TO Organisation | SousTraitant, valeur FLOAT, date DATE)
CREATE REL TABLE DOCUMENTE (FROM Document TO Audit | NonConformite | ActionCorrective)
CREATE REL TABLE REALISE (FROM Personne TO Audit | ActionCorrective)
CREATE REL TABLE RESPONSABLE_DE (FROM Personne TO Organisation | Site)
```

### Types TypeScript

```typescript
// data/types/entities.ts

// Types de base
type NodeType = 
  | 'Organisation' | 'Site' | 'Domaine' | 'SousTraitant'
  | 'Audit' | 'Finding' | 'NonConformite' | 'ActionCorrective'
  | 'QualificationEvent' | 'Decision' | 'Regle' | 'Alerte'
  | 'KQI' | 'Document' | 'Personne'

type EdgeType = 
  | 'APPARTIENT_A' | 'COUVRE_DOMAINE' | 'SOUS_TRAITE_POUR'
  | 'AUDITE' | 'AUDITE_SITE' | 'CONCERNE_DOMAINE' | 'PRODUIT_FINDING'
  | 'GENERE_NC' | 'TRAITE_PAR' | 'QUALIFIE' | 'DECIDE'
  | 'DECLENCHE_ALERTE' | 'CONCERNE_ENTITE' | 'MESURE_KQI'
  | 'DOCUMENTE' | 'REALISE' | 'RESPONSABLE_DE'

// Interface de base pour tous les nœuds
interface BaseNode {
  id: string
  _type: NodeType
  metadata?: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

// Entités typées
interface Organisation extends BaseNode {
  _type: 'Organisation'
  nom: string
  type?: 'Client' | 'Filiale' | 'Partenaire'
  secteur?: string
}

interface Audit extends BaseNode {
  _type: 'Audit'
  reference: string
  type: 'Initial' | 'Surveillance' | 'Renouvellement'
  dateDebut: Date
  dateFin?: Date
  statut: 'Planifié' | 'En cours' | 'Terminé'
  score?: number
}

interface NonConformite extends BaseNode {
  _type: 'NonConformite'
  reference: string
  description?: string
  criticite: 'Mineure' | 'Majeure' | 'Critique'
  statut: 'Ouverte' | 'En traitement' | 'Clôturée'
  dateOuverture: Date
  dateCible?: Date
  dateCloture?: Date
}

// ... autres entités

// Type union pour tous les nœuds
type GraphNode = Organisation | Site | Domaine | SousTraitant | Audit 
  | Finding | NonConformite | ActionCorrective | QualificationEvent
  | Decision | Regle | Alerte | KQI | Document | Personne

// Interface pour les arêtes
interface GraphEdge {
  id: string
  source: string
  target: string
  _type: EdgeType
  properties?: Record<string, unknown>
}

// Structure graphe complète
interface KnowledgeGraph {
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge>
}
```

### Gestion des métadonnées dynamiques

Le champ `metadata JSON` permet d'étendre les entités sans migration de schéma :

```typescript
interface NodeMetadata {
  customFields?: Record<string, string | number | boolean>
  tags?: string[]
  attachments?: { name: string; url: string }[]
  history?: { action: string; date: Date; user: string }[]
}
```

---

## UX/UI Guidelines

### Design patterns pour visualisation de données complexes

**Progressive disclosure** : L'interface révèle la complexité par couches. Le graphe affiche d'abord les nœuds principaux, l'expansion des connexions est manuelle. Les filtres avancés sont masqués par défaut.

**Overview + Detail** : Vue globale du graphe toujours visible, panneau latéral pour les détails du nœud sélectionné. La timeline en bas offre une dimension temporelle sans encombrer.

**Linked views** : Sélectionner un audit dans la timeline highlight automatiquement le nœud correspondant dans le graphe et filtre le dashboard sur cette entité.

**Direct manipulation** : Drag-and-drop pour réorganiser le graphe, double-clic pour drill-down, molette pour zoom. Interactions naturelles pour profils non-techniques.

### Layout principal recommandé

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Knowledge Graph Oversight    [Scénarios ▼] [⚙️] [?]  │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────┬───────────────────────────────┐   │
│ │                           │ 📊 Dashboard KQI              │   │
│ │      GRAPH CANVAS         │ ┌─────────────────────────┐   │   │
│ │                           │ │ [Sparkline charts]      │   │   │
│ │   [Sigma.js WebGL]        │ │ Score: 87% ▲            │   │   │
│ │                           │ │ Alertes: 3 ⚠️           │   │   │
│ │                           │ └─────────────────────────┘   │   │
│ │                           ├───────────────────────────────┤   │
│ │                           │ 📋 Détails sélection          │   │
│ │                           │ ┌─────────────────────────┐   │   │
│ │                           │ │ Audit: AUD-2024-042     │   │   │
│ │                           │ │ Date: 15/03/2024        │   │   │
│ │                           │ │ Statut: En cours        │   │   │
│ │                           │ │ [Voir findings →]       │   │   │
│ │                           │ └─────────────────────────┘   │   │
│ ├───────────────────────────┴───────────────────────────────┤   │
│ │ ⏱️ Timeline                               [Jour|Sem|Mois|An] │   │
│ │ ──●────●─────●●●────●──────●─────────────────●────────────  │   │
│ │ Jan     Fév      Mar     Avr     Mai     Jun     Jul       │   │
│ └───────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Filtres: [Type ▼] [Organisation ▼] [Criticité ▼] [Dates]    │
└─────────────────────────────────────────────────────────────────┘
```

### Système de couleurs par type de nœud

```css
:root {
  /* Entités organisationnelles */
  --node-organisation: #3B82F6;  /* Blue 500 */
  --node-site: #6366F1;          /* Indigo 500 */
  --node-soustraitant: #8B5CF6;  /* Violet 500 */
  
  /* Processus qualité */
  --node-audit: #10B981;         /* Emerald 500 */
  --node-finding: #F59E0B;       /* Amber 500 */
  --node-nonconformite: #EF4444; /* Red 500 */
  --node-action: #06B6D4;        /* Cyan 500 */
  
  /* Événements */
  --node-qualification: #EC4899; /* Pink 500 */
  --node-decision: #F97316;      /* Orange 500 */
  --node-alerte: #DC2626;        /* Red 600 */
  
  /* Support */
  --node-document: #6B7280;      /* Gray 500 */
  --node-personne: #14B8A6;      /* Teal 500 */
  --node-kqi: #84CC16;           /* Lime 500 */
  --node-regle: #A855F7;         /* Purple 500 */
}
```

### Composants UI essentiels

|Composant|Source|Usage|
|---|---|---|
|Button, Dialog, Dropdown|shadcn/ui|Actions, modales|
|Tooltip, Popover|Radix UI|Infobulles graphe|
|Card, KPICard|Tremor|Dashboard|
|DataTable|TanStack Table + shadcn|Listes, exports|
|DateRangePicker|shadcn/ui|Filtres temporels|
|CommandPalette|cmdk|Recherche rapide|

### Accessibilité pour profils métier

- **Labels explicites** : Chaque icône accompagnée de texte
- **Contraste WCAG AA** : Ratio minimum 4.5:1 pour texte
- **Focus visible** : Outline clair pour navigation clavier
- **Tooltips contextuels** : Explication des métriques et indicateurs
- **Messages d'erreur clairs** : Langage métier, pas technique
- **Tailles de police** : Minimum 14px, 16px recommandé

### Thèmes light/dark

```typescript
// Tailwind config avec CSS variables
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        // ... tokens shadcn/ui standard
      }
    }
  }
}
```

Toggle via `<html class="dark">` avec persistence localStorage.

---

## Roadmap de développement

### Phase 1 : Fondations

**Objectif** : Infrastructure technique opérationnelle, visualisation graphe basique

|Semaine|Livrables|
|---|---|
|S1|Setup Tauri 2.0 + React 18 + Vite, structure dossiers, TypeScript strict|
|S1|Intégration Kuzu WASM, schéma de base (3 types nœuds)|
|S2|Sigma.js v3 intégré, rendu 1000 nœuds test|
|S2|Layout force-directed via WebWorker|
|S3|Jotai state setup, sélection de nœuds|
|S3|Panneau détails nœud basique|
|S4|Import CSV simple (1 type), persistance Kuzu|
|S4|**MVP Checkpoint** : Graphe navigable avec données importées|

**Critères de validation MVP** :

- Visualisation fluide de 1000 nœuds
- Import CSV fonctionnel
- Zoom/pan/sélection opérationnels
- Données persistées entre sessions

### Phase 2 : Enrichissement visualisation

**Objectif** : 16 types de nœuds, layouts multiples, filtrage

|Semaine|Livrables|
|---|---|
|S5|Schéma Kuzu complet (16 types, 18 relations)|
|S5|Styling nœuds par type (couleurs, formes)|
|S6|Layout hiérarchique (intégration dagre)|
|S6|Layout radial pour expansion voisins|
|S7|Filtrage multi-critères (type, organisation, date)|
|S7|Highlight voisins au survol|
|S8|Export PNG/SVG du graphe|
|S8|Drill-down (double-clic → sous-graphe)|
|S9|**Checkpoint** : Visualisation complète, filtrage avancé|

### Phase 3 : Timeline et synchronisation

**Objectif** : Vue temporelle synchronisée avec le graphe

|Semaine|Livrables|
|---|---|
|S10|Intégration vis-timeline|
|S10|Affichage événements datés (audits, NC, décisions)|
|S11|Synchronisation bidirectionnelle timeline ↔ graphe|
|S11|Navigation temporelle (zoom jour/semaine/mois/trimestre/année)|
|S12|Filtrage par plage de dates|
|S12|**Checkpoint** : Timeline opérationnelle et synchronisée|

### Phase 4 : Dashboard KQI

**Objectif** : Indicateurs qualité et alertes

|Semaine|Livrables|
|---|---|
|S13|Intégration Apache ECharts|
|S13|Graphiques évolution KQI par entité|
|S14|Comparatifs inter-entités (bar charts)|
|S14|Seuils configurables avec markLine|
|S15|Alertes visuelles sur dépassements|
|S15|Export données dashboard (CSV, PNG)|
|S15|**Checkpoint** : Dashboard KQI complet|

### Phase 5 : Import avancé et moteur d'inférence

**Objectif** : Import robuste et règles métier automatiques

|Semaine|Livrables|
|---|---|
|S16|Import Excel multi-onglets (xlsx)|
|S16|Wizard de mapping colonnes → types|
|S17|Validation avec feedback détaillé erreurs|
|S17|Gestion des relations lors de l'import|
|S18|Moteur de règles basique (RuleEngine.ts)|
|S18|3 règles initiales : NC critiques, findings >90j, dégradation KQI|
|S19|Génération automatique d'alertes|
|S19|Calcul scores de risque|
|S19|**Checkpoint** : Import robuste, alertes automatiques|

### Phase 6 : Scénarios guidés et polish

**Objectif** : Parcours pédagogiques et finitions

|Semaine|Livrables|
|---|---|
|S20|Framework scénarios (JSON schema, player)|
|S20|3 premiers scénarios implémentés|
|S21|Mode présentation plein écran|
|S21|5 scénarios supplémentaires|
|S22|Undo/redo global (jotai-history)|
|S22|Dark mode complet|
|S22|**Checkpoint** : Application feature-complete|

### Phase 7 : Packaging et distribution

**Objectif** : Builds multi-plateformes et documentation

|Semaine|Livrables|
|---|---|
|S23|Configuration CI/CD GitHub Actions|
|S23|Builds Windows (NSIS), macOS (DMG), Linux (AppImage)|
|S24|Auto-updater configuré|
|S24|Documentation utilisateur|
|S24|**Release 1.0**|

---

## Outillage développeur

### Configuration projet optimale

**package.json** (extrait) :

```json
{
  "name": "knowledge-graph-oversight",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "biome check --write .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@kuzu/kuzu-wasm": "^0.7.0",
    "@react-sigma/core": "^4.0.0",
    "@tauri-apps/api": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.0",
    "graphology": "^0.25.0",
    "graphology-layout-forceatlas2": "^0.10.0",
    "jotai": "^2.6.0",
    "jotai-tanstack-query": "^0.8.0",
    "react": "^18.3.0",
    "sigma": "^3.0.0",
    "vis-timeline": "^7.7.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@playwright/test": "^1.45.0",
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

**tsconfig.json** :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["./src/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"],
      "@data/*": ["./src/data/*"]
    }
  }
}
```

**biome.json** :

```json
{
  "formatter": { "indentStyle": "space", "indentWidth": 2 },
  "linter": {
    "rules": {
      "complexity": { "noExcessiveCognitiveComplexity": "warn" },
      "suspicious": { "noExplicitAny": "error" }
    }
  }
}
```

### Tests

**Tests unitaires (Vitest)** :

```typescript
// features/graph/hooks/__tests__/useGraphData.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGraphData } from '../useGraphData'

describe('useGraphData', () => {
  it('filters nodes by type correctly', async () => {
    const { result } = renderHook(() => useGraphData())
    // ...
  })
})
```

**Tests E2E (Playwright)** :

```typescript
// e2e/graph-navigation.spec.ts
import { test, expect } from '@playwright/test'

test('user can zoom and pan the graph', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('[data-testid="graph-canvas"]')
  
  // Zoom avec molette
  await canvas.hover()
  await page.mouse.wheel(0, -100)
  
  // Vérifier que le zoom a changé
  await expect(page.locator('[data-testid="zoom-level"]'))
    .toContainText('120%')
})

test('selecting a node shows details panel', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-node-id="audit-001"]')
  
  await expect(page.locator('[data-testid="details-panel"]'))
    .toContainText('AUD-2024-001')
})
```

### CI/CD GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build & Release

on:
  push:
    tags: ['v*']

jobs:
  build-tauri:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: ubuntu-22.04
            target: x86_64-unknown-linux-gnu

    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'Knowledge Graph Oversight v__VERSION__'
          releaseBody: 'See CHANGELOG.md for details'
          releaseDraft: true
```

### Documentation

**Structure documentation** :

```
docs/
├── README.md                 # Guide démarrage rapide
├── architecture/
│   ├── overview.md          # Vue d'ensemble architecture
│   ├── data-model.md        # Modèle de données détaillé
│   └── decisions/           # ADR (Architecture Decision Records)
│       ├── 001-tauri-over-electron.md
│       ├── 002-kuzu-over-sqlite.md
│       └── 003-sigma-over-cytoscape.md
├── user-guide/
│   ├── getting-started.md
│   ├── import-data.md
│   ├── graph-navigation.md
│   └── scenarios.md
└── development/
    ├── setup.md
    ├── testing.md
    └── contributing.md
```

**Outil recommandé** : VitePress pour documentation statique (cohérent avec l'écosystème Vite).