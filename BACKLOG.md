# KG-OVERSIGHT - Backlog

**Version** : 1.3
**Date** : 3 décembre 2025
**Statut** : Développement terminé (Phase 11 : Data Management - 100%)

---

## Vue d'ensemble

| Phase | Description | Avancement |
|-------|-------------|------------|
| Phase 1 | Fondations (MVP) | **100%** |
| Phase 2 | Visualisation graphe complète | **100%** |
| Phase 3 | Filtrage et recherche | **100%** |
| Phase 4 | Timeline | **100%** |
| Phase 5 | Dashboard KQI | **100%** |
| Phase 6 | Import avancé | **100%** |
| Phase 7 | Moteur d'inférence | **100%** |
| Phase 8 | Scénarios guidés | **100%** |
| Phase 9 | UX et finitions | **100%** |
| Phase 10 | Packaging et distribution | **100%** |
| **Phase 11** | **Data Management (CRUD)** | **100%** |

> 📋 **Phase 11 détaillée** : Voir [BACKLOG_DATA_MANAGEMENT.md](./BACKLOG_DATA_MANAGEMENT.md)

---

## Phase 1 : Fondations (MVP)

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F1.1 | Setup Tauri + React + Vite | P0 | **Fait** | Tauri 2.0 configuré |
| F1.2 | Intégration Sigma.js v3, rendu basique | P0 | **Fait** | GraphCanvas.tsx |
| F1.3 | Store Jotai (sélection, filtres) | P0 | **Fait** | selectionAtoms.ts |
| F1.4 | Types TypeScript (16 nœuds, 18 relations) | P0 | **Fait** | entities.ts |
| F1.5 | Import CSV simple | P0 | **Fait** | csvParser.ts |
| F1.6 | Intégration Kuzu WASM | P0 | **Fait** | kuzu.ts - Service complet avec requêtes Cypher |
| F1.7 | Persistance données locale | P0 | **Fait** | persistence.ts - IndexedDB avec cache automatique |

### Critères de validation MVP
- [x] Visualisation fluide de 1000 nœuds
- [x] Import CSV fonctionnel
- [x] Zoom/pan/sélection opérationnels
- [x] Données persistées entre sessions

---

## Phase 2 : Visualisation graphe complète

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F2.1 | Styling nœuds par type (16 couleurs/formes) | P0 | **Fait** | nodeStyles.ts |
| F2.2 | Zoom/Pan/Fit-to-view | P0 | **Fait** | Contrôles basiques |
| F2.3 | Sélection nœud + panneau détails | P0 | **Fait** | NodeDetailsPanel.tsx (494 lignes) |
| F2.4 | Drill-down (double-clic → voisins) | P0 | **Fait** | Mode focus + voisins directs |
| F2.5 | Distinction visuelle N1/N2 | P0 | **Fait** | Contexte étude avec coloration N1/N2 |
| F2.6 | Layout hiérarchique (dagre) | P1 | **Fait** | layoutService.ts + LayoutSelector |
| F2.7 | Layout radial | P1 | **Fait** | Layout BFS depuis nœud central |
| F2.8 | Layout force-directed (ForceAtlas2) | P1 | **Fait** | Intégré via graphology-layout-forceatlas2 |
| F2.9 | Export PNG/SVG | P1 | **Fait** | ExportDialog + exportService.ts |

### Exigences de performance
- 60 FPS avec 10 000 nœuds et 50 000 relations
- Temps de calcul layout < 5 secondes

---

## Phase 3 : Filtrage et recherche

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F3.1 | Filtre par type de nœud (multi-sélection) | P0 | **Fait** | FilterPanel.tsx - 16 types groupés |
| F3.2 | Filtre par criticité | P0 | **Fait** | Boutons Critique/Majeur/Standard/Mineur |
| F3.3 | Recherche textuelle | P0 | **Fait** | Barre de recherche avec clear |
| F3.4 | Filtre par statut | P1 | **Fait** | 5 catégories: Actif/En cours/Planifié/Clôturé/Archivé |
| F3.5 | Filtre par plage de dates | P1 | **Fait** | DateRangeAtom intégré |
| F3.6 | Recherche par identifiant | P1 | **Fait** | Inclus dans recherche textuelle |

### Exigences de performance
- Temps de réponse au filtrage < 500 ms

---

## Phase 4 : Timeline

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F4.1 | Intégration vis-timeline | P0 | **Fait** | TimelineContainer.tsx - 477 lignes |
| F4.2 | Affichage événements datés | P0 | **Fait** | 8 types d'événements avec dates |
| F4.3 | Synchronisation bidirectionnelle | P0 | **Fait** | Sélection timeline ↔ highlight graphe |
| F4.4 | Zoom temporel multi-échelles | P1 | **Fait** | Jour/Mois/Année + zoom libre |
| F4.5 | Groupement par type d'événement | P1 | **Fait** | 7 groupes (Audits, Inspections, etc.) |
| F4.6 | Codage couleur par criticité | P1 | **Fait** | Couleurs par type et criticité |

---

## Phase 5 : Dashboard KQI

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F5.1 | Intégration Apache ECharts | P1 | **Fait** | echarts-for-react |
| F5.2 | Graphiques évolution KQI | P1 | **Fait** | Bar charts par période |
| F5.3 | Visualisation seuils | P1 | **Fait** | Jauges avec seuils |
| F5.4 | Indicateur de tendance | P1 | **Fait** | Amélioration/Stable/Dégradation |
| F5.5 | Comparaison multi-sous-traitants | P2 | **Fait** | Classement Top 10 ST |
| F5.6 | Export CSV des KQI | P2 | **Fait** | Export données complètes + synthèse par ST |

### KQI à implémenter
- Taux conformité documentaire (Alpha Clinical)
- Délai livraison rapports
- Taux queries résolus J+5
- Taux conformité méthodes (Beta Bioanalytics)
- Taux livraison à temps (Delta Logistics)
- Nb excursions température

---

## Phase 6 : Import avancé

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F6.1 | Import CSV nœuds (tous types) | P0 | **Fait** | 16/16 types implémentés |
| F6.2 | Import CSV relations | P0 | **Fait** | 26 types de relations |
| F6.3 | Import KQI | P0 | **Fait** | Intégré dans F6.1 |
| F6.4 | Import Excel multi-onglets | P1 | **Fait** | excelParser.ts - xlsx library |
| F6.5 | Wizard de mapping colonnes | P1 | **Fait** | ImportWizard.tsx - Interface interactive |
| F6.6 | Validation avec rapport d'erreurs | P0 | **Fait** | validationService.ts - Validation complète |

### Fichiers de données disponibles
- `nodes/*.csv` : 16 fichiers (1 par type)
- `relations/*.csv` : 18+ fichiers
- `schema.kuzu` : Schéma Kuzu (DDL)
- `import.kuzu` : Script d'import Kuzu

---

## Phase 7 : Moteur d'inférence

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F7.1 | RuleEngine de base | P1 | **Fait** | ruleEngine.ts + ruleDefinitions.ts |
| F7.2 | RGL-001 : Audit For Cause | P1 | **Fait** | → Alerte HAUTE |
| F7.3 | RGL-002 : Audit non satisfaisant | P1 | **Fait** | → Alerte HAUTE |
| F7.4 | RGL-003 : Finding critique ouvert > 30j | P1 | **Fait** | → Alerte HAUTE |
| F7.5 | RGL-004 : Accumulation findings | P1 | **Fait** | → Alerte MOYENNE |
| F7.6 | RGL-005 : KQI dégradation | P1 | **Fait** | → Alerte MOYENNE/HAUTE |
| F7.7 | RGL-006 : KQI en alerte | P1 | **Fait** | → Alerte HAUTE |
| F7.8 | RGL-007 : QE critique | P1 | **Fait** | → Alerte HAUTE |
| F7.9 | Panneau alertes | P1 | **Fait** | AlertsPanel.tsx - Filtres, navigation contextuelle |

### Critères de calcul du score de risque
- Nombre de findings critiques (audit/inspection)
- Nombre d'événements qualité critiques
- Nombre de domaines de service
- Complexité du domaine
- Nombre d'alertes KQI actives

---

## Phase 8 : Scénarios guidés

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F8.1 | Framework scénarios (JSON) | P1 | **Fait** | types/scenario.ts - Schema complet |
| F8.2 | ScenarioPlayer | P0 | **Fait** | Panneau latéral droit, slide-over |
| F8.3 | Highlight automatique | P0 | **Fait** | Nœuds orange + edges connectés |
| F8.4 | Centrage automatique | P1 | **Fait** | Camera centrée sur nœuds actifs |
| F8.5 | Mode présentation plein écran | P1 | **Fait** | Toggle plein écran (touche F) |
| F8.6 | Scénarios prédéfinis | P2 | **Fait** | 4 scénarios métier complets |

### Scénarios implémentés
1. **Préparation inspection par étude** : ETU → ST N1 → ST N2 → Audits → Findings → CAPA
2. **Analyse panoramique sous-traitant** : ST → Contrats/QA → Études → Timeline → Évaluation
3. **Évaluation risque annuelle** : Dashboard KQI → Évolution scores → Décisions
4. **Détection ST2 non déclaré** : Alertes → Navigation → Chaîne sous-traitance

### Notes techniques
- **StrictMode désactivé** (main.tsx) : Incompatible avec Sigma.js/WebGL (double-init)
- **Highlight séparé** : useEffect dédié pour ne pas reconstruire le graphe à chaque étape
- **Edges inclus** : Relations entre nœuds highlightés en orange, autres atténuées

---

## Phase 9 : UX et finitions

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F9.1 | Thème sombre/clair | P1 | **Fait** | Toggle + persistence localStorage |
| F9.2 | Undo/Redo | P2 | **Fait** | jotai-history - historyStore.ts |
| F9.3 | Tooltips contextuels | P1 | **Fait** | Radix UI Tooltip - Tooltip.tsx |
| F9.4 | Messages d'erreur français | P1 | **Fait** | i18n/messages.ts complet |
| F9.5 | Raccourcis clavier | P2 | **Fait** | useKeyboardShortcuts + aide (?) |
| F9.6 | Accessibilité WCAG AA | P1 | **Fait** | Contraste OK, labels explicites |

### Exigences utilisabilité
- Interface utilisable sans formation < 30 min
- 100% des actions avec labels explicites
- Tailles de police minimum 14px

---

## Phase 10 : Packaging et distribution

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F10.1 | Build Windows (NSIS) | P0 | **Fait** | tauri.conf.json configuré |
| F10.2 | Build macOS (DMG) | P0 | **Fait** | Intel + Apple Silicon |
| F10.3 | Build Linux (AppImage) | P0 | **Fait** | AppImage + .deb |
| F10.4 | CI/CD GitHub Actions | P1 | **Fait** | .github/workflows/build.yml |
| F10.5 | Scripts npm builds | P1 | **Fait** | npm run tauri:build:* |
| F10.6 | Auto-updater Tauri | P2 | **Fait** | tauri-plugin-updater + UpdateChecker.tsx |

### Contraintes
- Taille bundle < 50 MB
- Temps de démarrage < 2 secondes
- Aucune dépendance externe (standalone)
- Fonctionnement 100% offline

---

## Statut Final

**Phases 1-11 complétées à 100%.** Toutes les fonctionnalités prévues sont implémentées.

### Dernières fonctionnalités ajoutées (3 décembre 2025)
- [x] **F11.1.1-6** - Infrastructure Data Service complète (Phase 11.1)
  - DataService avec opérations CRUD
  - Validation Service (12 règles de validation)
  - ID Generator (format PREFIX-YYYYMMDD-SEQ)
  - Schema Service (16 types d'entités)
  - Extension persistence.ts (opérations unitaires)
  - Hook useDataMutations (intégration React/Jotai)
- [x] **F11.2.1-6** - Édition d'entités complète (Phase 11.2)
  - EntityEditor avec formulaires dynamiques
  - Composants de champs (Input, Select, Date, Number, Boolean)
  - Intégration dans NodeDetailsPanel (onglet "Éditer")
  - Validation en temps réel par champ
  - Notifications toast success/error
  - Confirmation modifications non sauvegardées
- [x] **F11.3.1-5** - Suppression d'entités (Phase 11.3)
  - DeleteConfirmDialog avec confirmation
  - Détection et affichage des relations impactées
  - Prévisualisation avant suppression
  - Bouton supprimer dans NodeDetailsPanel
  - Notifications toast de succès/erreur
- [x] **F11.4.1-6** - Création d'entités (Phase 11.4)
  - EntityCreatorDialog avec workflow en 2 étapes
  - TypeSelector avec 16 types groupés par catégorie
  - Formulaires dynamiques réutilisés de l'édition
  - Génération automatique d'ID (régénérable)
  - Bouton "Ajouter" dans le Header
- [x] **F11.5.1-4** - Gestion des relations (Phase 11.5)
  - RelationList avec suppression inline
  - RelationCreatorDialog avec wizard 3 étapes
  - Validation des types source/cible compatibles
  - Schémas complets des 26 types de relations
- [x] **F11.6.1-7** - Import intelligent/Merge (Phase 11.6)
  - MergeStrategySelector (Replace, Merge, Add Only)
  - MergeService avec détection de conflits
  - ConflictResolver UI avec résolution individuelle/en masse
  - MergeReportPanel avec statistiques détaillées
  - Intégration complète dans ImportWizard
- [x] **F11.7.1-5** - Copier/Coller (Phase 11.7)
  - ClipboardService avec copie/collage/duplication
  - Store Jotai avec historique presse-papiers
  - Hook useClipboard pour intégration React
  - Raccourcis clavier Ctrl+C/V/D
  - Support copie avec/sans relations
- [x] **F11.8.1-9** - Vue DataTable (Phase 11.8)
  - Composant DataTable natif (sans dépendance externe)
  - Tri multi-colonnes configurable
  - Filtrage avancé par propriété
  - Édition inline (double-clic, Enter/Escape)
  - Multi-sélection avec checkbox
  - Suppression groupée
  - Export CSV de la sélection
  - Pagination configurable

### Phase 11 : Data Management (CRUD) - Terminé (100%)
La Phase 11 introduit la gestion complète des données directement dans l'application :
- [x] **Infrastructure** Data Service et hooks React
- [x] **Création** d'entités sans passer par Excel
- [x] **Édition** des entités existantes
- [x] **Suppression** avec gestion des relations
- [x] **Relations** Création et suppression de relations entre entités
- [x] **Import intelligent** (modes Replace, Merge, Add only)
- [x] **Copier/Coller** Ctrl+C/V/D (ClipboardService, useClipboard hook)
- [x] **Menu contextuel** copier/coller (clic-droit sur le graphe)
- [x] **Vue DataTable** pour édition en masse (bouton "Données")

> 📋 Spécifications complètes : [BACKLOG_DATA_MANAGEMENT.md](./BACKLOG_DATA_MANAGEMENT.md)

### Évolutions futures possibles
- Création/modification de scénarios par l'utilisateur (EF-SCN-06)
- Tests de performance automatisés
- Documentation utilisateur enrichie

---

## Dépendances techniques

### Bloquantes
- **Tauri** : Nécessite `build-essential`, `libwebkit2gtk-4.1-dev`, `libssl-dev`

### Installées
- React 19, TypeScript 5.9
- Sigma.js 3.0, graphology 0.26
- Jotai 2.15, TanStack Query 5.90
- Tailwind CSS 4.1, Radix UI
- vis-timeline 8.4, ECharts 6.0
- PapaParse 5.5, xlsx 0.18

---

*Document généré et maintenu dans le cadre du projet KG-Oversight.*
*Dernière mise à jour : 3 décembre 2025*
