# KG-OVERSIGHT - Backlog

**Version** : 1.0
**Date** : 28 novembre 2025
**Statut** : En cours de développement

---

## Vue d'ensemble

| Phase | Description | Avancement |
|-------|-------------|------------|
| Phase 1 | Fondations (MVP) | 60% |
| Phase 2 | Visualisation graphe complète | 20% |
| Phase 3 | Filtrage et recherche | 0% |
| Phase 4 | Timeline | 0% |
| Phase 5 | Dashboard KQI | 0% |
| Phase 6 | Import avancé | 30% |
| Phase 7 | Moteur d'inférence | 0% |
| Phase 8 | Scénarios guidés | 0% |
| Phase 9 | UX et finitions | 0% |
| Phase 10 | Packaging et distribution | 0% |

---

## Phase 1 : Fondations (MVP)

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F1.1 | Setup Tauri + React + Vite | P0 | **Partiel** | Tauri en attente dépendances système |
| F1.2 | Intégration Sigma.js v3, rendu basique | P0 | **Fait** | GraphCanvas.tsx |
| F1.3 | Store Jotai (sélection, filtres) | P0 | **Fait** | selectionAtoms.ts |
| F1.4 | Types TypeScript (16 nœuds, 18 relations) | P0 | **Fait** | entities.ts |
| F1.5 | Import CSV simple | P0 | **Fait** | csvParser.ts |
| F1.6 | Intégration Kuzu WASM | P0 | À faire | Base de données graphe embarquée |
| F1.7 | Persistance données locale | P0 | À faire | IDBFS ou filesystem Tauri |

### Critères de validation MVP
- [ ] Visualisation fluide de 1000 nœuds
- [ ] Import CSV fonctionnel
- [ ] Zoom/pan/sélection opérationnels
- [ ] Données persistées entre sessions

---

## Phase 2 : Visualisation graphe complète

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F2.1 | Styling nœuds par type (16 couleurs/formes) | P0 | **Fait** | nodeStyles.ts |
| F2.2 | Zoom/Pan/Fit-to-view | P0 | **Fait** | Contrôles basiques |
| F2.3 | Sélection nœud + panneau détails | P0 | À faire | Sidebar avec propriétés |
| F2.4 | Drill-down (double-clic → voisins) | P0 | À faire | Révéler connexions directes |
| F2.5 | Distinction visuelle N1/N2 | P0 | À faire | Bordure ou forme différente |
| F2.6 | Layout hiérarchique (dagre) | P1 | À faire | Pour vue étude → ST |
| F2.7 | Layout radial | P1 | À faire | Pour vue centrée sur entité |
| F2.8 | Layout force-directed (ForceAtlas2) | P1 | À faire | WebWorker pour performance |
| F2.9 | Export PNG/SVG | P1 | À faire | @sigma/export-image, graphology-svg |

### Exigences de performance
- 60 FPS avec 10 000 nœuds et 50 000 relations
- Temps de calcul layout < 5 secondes

---

## Phase 3 : Filtrage et recherche

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F3.1 | Filtre par type de nœud (multi-sélection) | P0 | À faire | Checkboxes dans sidebar |
| F3.2 | Filtre par criticité | P0 | À faire | Critique/Majeur/Standard/Mineur |
| F3.3 | Recherche textuelle | P0 | À faire | Dans noms/descriptions |
| F3.4 | Filtre par statut | P1 | À faire | Actif/Archivé/En cours... |
| F3.5 | Filtre par plage de dates | P1 | À faire | DateRangePicker |
| F3.6 | Recherche par identifiant | P1 | À faire | ST-001, AUD-2024-001... |

### Exigences de performance
- Temps de réponse au filtrage < 500 ms

---

## Phase 4 : Timeline

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F4.1 | Intégration vis-timeline | P0 | À faire | Composant TimelineView |
| F4.2 | Affichage événements datés | P0 | À faire | Audits, inspections, QE, décisions |
| F4.3 | Synchronisation bidirectionnelle | P0 | À faire | Sélection timeline ↔ highlight graphe |
| F4.4 | Zoom temporel multi-échelles | P1 | À faire | Jour/semaine/mois/trimestre/année |
| F4.5 | Groupement par type d'événement | P1 | À faire | Lignes séparées par catégorie |
| F4.6 | Codage couleur par criticité | P1 | À faire | Rouge/Orange/Bleu/Gris |

---

## Phase 5 : Dashboard KQI

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F5.1 | Intégration Apache ECharts | P1 | À faire | echarts-for-react |
| F5.2 | Graphiques évolution KQI | P1 | À faire | Line charts par sous-traitant |
| F5.3 | Visualisation seuils | P1 | À faire | markLine pour alerte/objectif |
| F5.4 | Indicateur de tendance | P1 | À faire | Amélioration/Stable/Dégradation |
| F5.5 | Comparaison multi-sous-traitants | P2 | À faire | Bar charts comparatifs |
| F5.6 | Export CSV des KQI | P2 | À faire | Téléchargement données |

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
| F6.1 | Import CSV nœuds (tous types) | P0 | **Partiel** | 6/16 types implémentés |
| F6.2 | Import CSV relations | P0 | **Fait** | parseRelations() |
| F6.3 | Import KQI | P0 | À faire | 264 mesures dans dataset |
| F6.4 | Import Excel multi-onglets | P1 | À faire | Bibliothèque xlsx |
| F6.5 | Wizard de mapping colonnes | P1 | À faire | Interface drag & drop |
| F6.6 | Validation avec rapport d'erreurs | P0 | À faire | Erreurs détaillées par ligne |

### Fichiers de données disponibles
- `nodes/*.csv` : 16 fichiers (1 par type)
- `relations/*.csv` : 18+ fichiers
- `schema.kuzu` : Schéma Kuzu (DDL)
- `import.kuzu` : Script d'import Kuzu

---

## Phase 7 : Moteur d'inférence

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F7.1 | RuleEngine de base | P1 | À faire | Architecture règles |
| F7.2 | RGL-001 : NC critique > 30j | P1 | À faire | → Alerte HAUTE |
| F7.3 | RGL-002 : Finding > 90j | P1 | À faire | → Alerte MOYENNE |
| F7.4 | RGL-003 : ST2 critique non évalué | P1 | À faire | → Alerte HAUTE |
| F7.5 | RGL-004 : KQI dégradation 3P | P1 | À faire | → Alerte MOYENNE |
| F7.6 | RGL-005 : Audit routine retard > 18 mois | P1 | À faire | → Alerte MOYENNE |
| F7.7 | RGL-006 : QA non signé > 60j | P1 | À faire | → Alerte BASSE |
| F7.8 | Calcul score risque | P1 | À faire | Low/Medium/High automatique |
| F7.9 | Panneau alertes | P1 | À faire | Liste + navigation contextuelle |

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
| F8.1 | Framework scénarios (JSON) | P1 | À faire | Schema de configuration |
| F8.2 | ScenarioPlayer | P0 | À faire | Navigation Précédent/Suivant |
| F8.3 | Highlight automatique | P0 | À faire | Nœuds concernés par étape |
| F8.4 | Centrage automatique | P1 | À faire | Camera sur nœuds actifs |
| F8.5 | Mode présentation plein écran | P1 | À faire | Pour inspections |
| F8.6 | Création/modification scénarios | P2 | À faire | Éditeur utilisateur |

### Scénarios à implémenter
1. **Préparation inspection par étude** : ETU → ST N1 → ST N2 → Audits → Findings → CAPA
2. **Analyse panoramique sous-traitant** : ST → Contrats/QA → Études → Timeline → Évaluation
3. **Évaluation risque annuelle** : Dashboard KQI → Évolution scores → Décisions
4. **Détection ST2 non déclaré** : Alertes → Navigation → Chaîne sous-traitance

---

## Phase 9 : UX et finitions

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F9.1 | Thème sombre/clair | P1 | À faire | Toggle + persistence |
| F9.2 | Undo/Redo | P2 | À faire | jotai-history |
| F9.3 | Accessibilité WCAG AA | P1 | À faire | Contraste ≥ 4.5:1 |
| F9.4 | Messages d'erreur français | P1 | À faire | Langage métier |
| F9.5 | Tooltips contextuels | P1 | À faire | Radix UI Tooltip |
| F9.6 | Raccourcis clavier | P2 | À faire | Navigation rapide |

### Exigences utilisabilité
- Interface utilisable sans formation < 30 min
- 100% des actions avec labels explicites
- Tailles de police minimum 14px

---

## Phase 10 : Packaging et distribution

| ID | Fonctionnalité | Priorité | Statut | Notes |
|----|----------------|----------|--------|-------|
| F10.1 | Build Windows (NSIS) | P0 | À faire | Installateur .exe |
| F10.2 | Build macOS (DMG) | P0 | À faire | Bundle .dmg |
| F10.3 | Build Linux (AppImage) | P0 | À faire | .AppImage portable |
| F10.4 | Auto-updater Tauri | P1 | À faire | Plugin updater |
| F10.5 | CI/CD GitHub Actions | P1 | À faire | Build automatisé |
| F10.6 | Documentation utilisateur | P1 | À faire | Guide de démarrage |

### Contraintes
- Taille bundle < 50 MB
- Temps de démarrage < 2 secondes
- Aucune dépendance externe (standalone)
- Fonctionnement 100% offline

---

## Prochaines priorités

### Sprint 1 (immédiat)
1. [ ] Installer dépendances système Tauri (`sudo apt install...`)
2. [ ] Initialiser Tauri dans le projet
3. [ ] Panneau détails du nœud sélectionné (F2.3)
4. [ ] Filtres par type et criticité (F3.1, F3.2)

### Sprint 2
5. [ ] Intégration Kuzu WASM (F1.6)
6. [ ] Timeline avec vis-timeline (F4.1, F4.2, F4.3)
7. [ ] Drill-down sur double-clic (F2.4)

### Sprint 3
8. [ ] Dashboard KQI basique (F5.1, F5.2)
9. [ ] Import complet des données CSV (F6.1, F6.3)
10. [ ] Moteur de règles (F7.1, F7.2)

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

*Document généré le 28 novembre 2025*
