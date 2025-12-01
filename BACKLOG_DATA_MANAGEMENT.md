# KG-OVERSIGHT - Backlog Phase 11 : Data Management

**Version** : 1.2.0
**Date** : 1er décembre 2025
**Auteur** : Architecture technique
**Statut** : En cours d'implémentation - Phases 11.1 et 11.2 terminées

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Analyse du besoin](#2-analyse-du-besoin)
3. [Architecture technique](#3-architecture-technique)
4. [Sous-phases et fonctionnalités](#4-sous-phases-et-fonctionnalités)
5. [User Stories détaillées](#5-user-stories-détaillées)
6. [Spécifications techniques](#6-spécifications-techniques)
7. [Exigences non-fonctionnelles](#7-exigences-non-fonctionnelles)
8. [Plan de tests](#8-plan-de-tests)
9. [Dépendances et risques](#9-dépendances-et-risques)
10. [Glossaire](#10-glossaire)

---

## 1. Résumé exécutif

### 1.1 Contexte

L'application KG-Oversight dispose actuellement d'un flux de données **unidirectionnel** : les données sont importées via CSV/Excel, puis visualisées et analysées. Aucune capacité de modification, création ou suppression d'entités n'existe dans l'application.

### 1.2 Problème identifié

| Limitation actuelle | Impact métier |
|---------------------|---------------|
| Pas de création d'entité in-app | L'utilisateur doit systématiquement passer par Excel pour ajouter une donnée |
| Pas de modification d'entité | Correction d'erreur = ré-import complet du dataset |
| Pas de suppression unitaire | Impossible de retirer une entité obsolète sans ré-import |
| Import = remplacement total | Perte de toute modification manuelle à chaque import |
| Pas de gestion des relations | Impossible d'ajouter/modifier une relation entre entités |

### 1.3 Solution proposée

Implémenter un **Data Management Layer** complet permettant les opérations CRUD (Create, Read, Update, Delete) sur l'ensemble des 16 types de nœuds et 26 types de relations du Knowledge Graph.

### 1.4 Bénéfices attendus

- **Autonomie utilisateur** : Gestion complète des données sans outils externes
- **Productivité** : Réduction du temps de correction d'erreurs de 90%
- **Intégrité** : Validation métier à chaque modification
- **Traçabilité** : Historique des modifications via undo/redo existant
- **Flexibilité** : Import incrémental sans perte de données

### 1.5 Vue d'ensemble des sous-phases

| Sous-phase | Description | Priorité | Complexité |
|------------|-------------|----------|------------|
| 11.1 | Infrastructure Data Service | P0 | Haute |
| 11.2 | Édition d'entités (Update) | P0 | Moyenne |
| 11.3 | Suppression d'entités (Delete) | P0 | Moyenne |
| 11.4 | Création d'entités (Create) | P0 | Haute |
| 11.5 | Gestion des relations | P1 | Haute |
| 11.6 | Import intelligent (Merge) | P1 | Haute |
| 11.7 | Copier/Coller et duplication | P2 | Faible |
| 11.8 | Vue Data Table | P2 | Haute |

---

## 2. Analyse du besoin

### 2.1 Personas et cas d'usage

#### Persona 1 : Responsable Qualité Fournisseurs (Marie)

**Contexte** : Marie supervise 45 sous-traitants et doit maintenir à jour leurs informations.

**Frustrations actuelles** :
- Doit ouvrir Excel pour corriger une simple faute de frappe
- Perd ses annotations manuelles à chaque ré-import
- Ne peut pas ajouter rapidement un nouveau finding détecté en réunion

**Besoins** :
- Modifier directement le statut d'un sous-traitant dans l'application
- Ajouter un nouveau finding sans quitter l'interface
- Créer une relation entre un audit et un finding existant

#### Persona 2 : Auditeur Interne (Thomas)

**Contexte** : Thomas réalise des audits et doit enregistrer ses observations en temps réel.

**Frustrations actuelles** :
- Doit noter ses findings sur papier puis les saisir dans Excel
- Impossible de corriger une erreur de criticité après import

**Besoins** :
- Créer des findings directement pendant l'audit
- Modifier la criticité d'un finding après analyse
- Supprimer un finding enregistré par erreur

#### Persona 3 : Data Manager (Sophie)

**Contexte** : Sophie gère les imports de données et la qualité du référentiel.

**Frustrations actuelles** :
- Chaque import écrase les corrections manuelles précédentes
- Pas de possibilité de merger deux sources de données
- Gestion des doublons entièrement manuelle

**Besoins** :
- Import en mode "merge" préservant les données existantes
- Détection et résolution des conflits
- Export partiel des modifications

### 2.2 Matrice des fonctionnalités par persona

| Fonctionnalité | Marie | Thomas | Sophie |
|----------------|-------|--------|--------|
| Édition inline | ★★★ | ★★★ | ★★☆ |
| Création d'entité | ★★★ | ★★★ | ★★☆ |
| Suppression | ★★☆ | ★★★ | ★★☆ |
| Gestion relations | ★★★ | ★★☆ | ★☆☆ |
| Import merge | ★★☆ | ★☆☆ | ★★★ |
| Copier/coller | ★☆☆ | ★★☆ | ★★★ |
| Data Table | ★★☆ | ★☆☆ | ★★★ |

*Légende : ★★★ = Critique, ★★☆ = Important, ★☆☆ = Nice-to-have*

### 2.3 Flux utilisateur cibles

#### Flux 1 : Édition rapide depuis le graphe

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Clic sur   │────▶│  Panneau    │────▶│   Bouton    │────▶│  Formulaire │
│   nœud      │     │  détails    │     │  "Éditer"   │     │  édition    │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                    ┌─────────────┐     ┌─────────────┐            │
                    │  Graphe     │◀────│ Sauvegarde  │◀───────────┘
                    │  mis à jour │     │ + validation│
                    └─────────────┘     └─────────────┘
```

#### Flux 2 : Création d'entité avec relations

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Bouton     │────▶│  Sélection  │────▶│  Formulaire │────▶│  Sélection  │
│  "Ajouter"  │     │   du type   │     │  propriétés │     │  relations  │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                    ┌─────────────┐     ┌─────────────┐            │
                    │  Entité     │◀────│ Validation  │◀───────────┘
                    │  créée      │     │ + création  │
                    └─────────────┘     └─────────────┘
```

#### Flux 3 : Import avec merge

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Import     │────▶│  Sélection  │────▶│  Détection  │────▶│  Résolution │
│  Wizard     │     │ mode Merge  │     │  conflits   │     │  conflits   │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                    ┌─────────────┐     ┌─────────────┐            │
                    │  Rapport    │◀────│   Import    │◀───────────┘
                    │  final      │     │  exécuté    │
                    └─────────────┘     └─────────────┘
```

---

## 3. Architecture technique

### 3.1 Architecture cible

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Entity     │  │   Entity    │  │   Entity    │  │   Data      │        │
│  │  Editor     │  │   Creator   │  │   Deleter   │  │   Table     │        │
│  │  Panel      │  │   Dialog    │  │   Dialog    │  │   View      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                    │                                        │
├────────────────────────────────────┼────────────────────────────────────────┤
│                              HOOKS LAYER                                    │
├────────────────────────────────────┼────────────────────────────────────────┤
│                                    │                                        │
│  ┌─────────────────────────────────┴─────────────────────────────────┐     │
│  │                     useDataMutations()                             │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │     │
│  │  │ useCreate│  │ useUpdate│  │ useDelete│  │ useImportMerge   │   │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │     │
│  └─────────────────────────────────┬─────────────────────────────────┘     │
│                                    │                                        │
├────────────────────────────────────┼────────────────────────────────────────┤
│                              SERVICE LAYER                                  │
├────────────────────────────────────┼────────────────────────────────────────┤
│                                    │                                        │
│  ┌─────────────────────────────────┴─────────────────────────────────┐     │
│  │                         DataService                                │     │
│  │  ┌────────────────────────────────────────────────────────────┐   │     │
│  │  │  addNode() │ updateNode() │ deleteNode() │ importMerge()   │   │     │
│  │  │  addEdge() │ updateEdge() │ deleteEdge() │ exportPartial() │   │     │
│  │  └────────────────────────────────────────────────────────────┘   │     │
│  └─────────────────────────────────┬─────────────────────────────────┘     │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         ▼                          ▼                          ▼            │
│  ┌─────────────┐          ┌─────────────────┐        ┌─────────────────┐   │
│  │ Validation  │          │   ID Generator  │        │   Clipboard     │   │
│  │  Service    │          │    Service      │        │    Service      │   │
│  └─────────────┘          └─────────────────┘        └─────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              STATE LAYER (Jotai)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ allNodes    │  │ allEdges    │  │ editingNode │  │ clipboardAtom   │   │
│  │ Atom        │  │ Atom        │  │ Atom        │  │                 │   │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘  └─────────────────┘   │
│         │                │                                                  │
├─────────┴────────────────┴──────────────────────────────────────────────────┤
│                              PERSISTENCE LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         IndexedDB (persistence.ts)                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │   │
│  │  │ saveNode │  │ saveEdge │  │ deleteX  │  │ transactional ops  │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Structure de fichiers

```
app/src/features/dataManagement/
│
├── components/
│   ├── EntityEditor/
│   │   ├── EntityEditor.tsx           # Panneau d'édition principal
│   │   ├── EntityEditorHeader.tsx     # En-tête avec type et actions
│   │   ├── EntityEditorForm.tsx       # Formulaire dynamique
│   │   └── EntityEditorActions.tsx    # Boutons sauvegarder/annuler
│   │
│   ├── EntityCreator/
│   │   ├── EntityCreator.tsx          # Dialog de création
│   │   ├── TypeSelector.tsx           # Sélection du type d'entité
│   │   ├── EntityForm.tsx             # Formulaire selon le type
│   │   └── RelationSelector.tsx       # Sélection des relations initiales
│   │
│   ├── EntityDeleter/
│   │   ├── DeleteConfirmDialog.tsx    # Dialog de confirmation
│   │   ├── CascadePreview.tsx         # Prévisualisation des suppressions cascade
│   │   └── DeleteProgress.tsx         # Indicateur de progression
│   │
│   ├── RelationManager/
│   │   ├── RelationEditor.tsx         # Éditeur de relation
│   │   ├── RelationCreator.tsx        # Créateur de relation
│   │   └── RelationList.tsx           # Liste des relations d'un nœud
│   │
│   ├── DataTable/
│   │   ├── DataTable.tsx              # Composant table principal
│   │   ├── DataTableToolbar.tsx       # Barre d'outils (filtres, actions)
│   │   ├── DataTableRow.tsx           # Ligne avec édition inline
│   │   ├── DataTableCell.tsx          # Cellule éditable
│   │   └── DataTablePagination.tsx    # Pagination
│   │
│   ├── ImportMerge/
│   │   ├── MergeStrategySelector.tsx  # Sélection de la stratégie
│   │   ├── ConflictResolver.tsx       # Résolution des conflits
│   │   ├── ConflictItem.tsx           # Un conflit individuel
│   │   └── MergeReport.tsx            # Rapport post-merge
│   │
│   ├── fields/                        # Éditeurs de champs spécialisés
│   │   ├── TextField.tsx              # Champ texte simple
│   │   ├── TextArea.tsx               # Zone de texte multi-lignes
│   │   ├── SelectField.tsx            # Sélection parmi options
│   │   ├── DateField.tsx              # Sélecteur de date
│   │   ├── NumberField.tsx            # Champ numérique
│   │   ├── BooleanField.tsx           # Checkbox/toggle
│   │   ├── CriticiteField.tsx         # Sélecteur criticité avec couleurs
│   │   ├── StatutField.tsx            # Sélecteur de statut
│   │   └── EntityRefField.tsx         # Référence à une autre entité
│   │
│   └── shared/
│       ├── FormSection.tsx            # Section de formulaire
│       ├── ValidationError.tsx        # Affichage erreur de validation
│       └── UnsavedChangesWarning.tsx  # Alerte modifications non sauvegardées
│
├── services/
│   ├── dataService.ts                 # Service CRUD principal
│   ├── validationService.ts           # Validation métier des entités
│   ├── idGenerator.ts                 # Génération d'identifiants
│   ├── clipboardService.ts            # Gestion du presse-papiers
│   ├── mergeService.ts                # Logique de fusion des données
│   ├── conflictDetector.ts            # Détection des conflits
│   └── schemaService.ts               # Métadonnées des types d'entités
│
├── stores/
│   ├── editingAtoms.ts                # État d'édition en cours
│   ├── clipboardAtom.ts               # Contenu du presse-papiers
│   ├── dataTableAtoms.ts              # État de la DataTable
│   └── mergeAtoms.ts                  # État du processus de merge
│
├── hooks/
│   ├── useDataMutations.ts            # Hook principal pour mutations
│   ├── useEntityEditor.ts             # Hook pour l'éditeur
│   ├── useEntityCreator.ts            # Hook pour la création
│   ├── useClipboard.ts                # Hook copier/coller
│   ├── useValidation.ts               # Hook de validation
│   ├── useUnsavedChanges.ts           # Détection modifications non sauvegardées
│   └── useDataTable.ts                # Hook pour la DataTable
│
├── types/
│   ├── dataManagement.ts              # Types principaux
│   ├── validation.ts                  # Types de validation
│   ├── merge.ts                       # Types pour le merge
│   └── schema.ts                      # Schéma des entités
│
├── utils/
│   ├── fieldUtils.ts                  # Utilitaires pour les champs
│   ├── entityUtils.ts                 # Utilitaires pour les entités
│   └── diffUtils.ts                   # Calcul de différences
│
├── constants/
│   ├── fieldDefinitions.ts            # Définitions des champs par type
│   ├── validationRules.ts             # Règles de validation
│   └── defaultValues.ts               # Valeurs par défaut
│
└── index.ts                           # Exports publics
```

### 3.3 Schéma des entités (métadonnées)

Le système doit connaître la structure de chaque type d'entité pour générer les formulaires dynamiquement.

```typescript
// constants/fieldDefinitions.ts

export interface FieldDefinition {
  name: string;                          // Nom du champ
  label: string;                         // Label affiché
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean' | 'entityRef';
  required: boolean;                     // Champ obligatoire
  editable: boolean;                     // Modifiable après création
  options?: { value: string; label: string }[];  // Pour les selects
  entityRefType?: NodeType;              // Pour les références
  validation?: ValidationRule[];         // Règles de validation
  placeholder?: string;                  // Texte indicatif
  helpText?: string;                     // Aide contextuelle
  defaultValue?: unknown;                // Valeur par défaut
  group?: string;                        // Groupe d'affichage
}

export interface EntitySchema {
  type: NodeType;
  label: string;                         // "Sous-traitant", "Audit", etc.
  labelPlural: string;                   // "Sous-traitants", "Audits", etc.
  icon: string;                          // Nom de l'icône Lucide
  color: string;                         // Couleur principale
  fields: FieldDefinition[];             // Définitions des champs
  idPrefix: string;                      // Préfixe pour génération ID
  allowedRelations: {                    // Relations autorisées
    outgoing: EdgeType[];
    incoming: EdgeType[];
  };
}
```

---

## 4. Sous-phases et fonctionnalités

### Vue d'ensemble

| Phase | ID | Fonctionnalité | Priorité | Statut | Dépendances |
|-------|-----|----------------|----------|--------|-------------|
| **11.1** | | **Infrastructure Data Service** | **P0** | **Fait** | - |
| | F11.1.1 | DataService - Structure de base | P0 | **Fait** | - |
| | F11.1.2 | Validation Service | P0 | **Fait** | F11.1.1 |
| | F11.1.3 | ID Generator Service | P0 | **Fait** | - |
| | F11.1.4 | Schema Service (métadonnées entités) | P0 | **Fait** | - |
| | F11.1.5 | Extension persistence.ts (ops unitaires) | P0 | **Fait** | F11.1.1 |
| | F11.1.6 | Hooks useDataMutations | P0 | **Fait** | F11.1.1-5 |
| **11.2** | | **Édition d'entités (Update)** | **P0** | **Fait** | 11.1 |
| | F11.2.1 | EntityEditor - Composant principal | P0 | **Fait** | F11.1.6 |
| | F11.2.2 | Champs éditables par type (16 types) | P0 | **Fait** | F11.1.4 |
| | F11.2.3 | Intégration dans NodeDetailsPanel | P0 | **Fait** | F11.2.1 |
| | F11.2.4 | Validation en temps réel | P0 | **Fait** | F11.1.2 |
| | F11.2.5 | Sauvegarde avec feedback | P0 | **Fait** | F11.1.5 |
| | F11.2.6 | Gestion modifications non sauvegardées | P1 | **Fait** | F11.2.1 |
| **11.3** | | **Suppression d'entités (Delete)** | **P0** | **Fait** | 11.1 |
| | F11.3.1 | DeleteConfirmDialog | P0 | **Fait** | F11.1.6 |
| | F11.3.2 | Détection des relations impactées | P0 | **Fait** | F11.1.1 |
| | F11.3.3 | Mode suppression cascade | P1 | À faire | F11.3.2 |
| | F11.3.4 | Prévisualisation avant suppression | P0 | **Fait** | F11.3.2 |
| | F11.3.5 | Bouton supprimer dans NodeDetailsPanel | P0 | **Fait** | F11.3.1 |
| | F11.3.6 | Raccourci clavier Suppr | P2 | À faire | F11.3.1 |
| **11.4** | | **Création d'entités (Create)** | **P0** | **Fait** | 11.1, 11.2 |
| | F11.4.1 | EntityCreator Dialog | P0 | **Fait** | F11.1.6 |
| | F11.4.2 | TypeSelector (16 types) | P0 | **Fait** | F11.1.4 |
| | F11.4.3 | Formulaires dynamiques par type | P0 | **Fait** | F11.2.2 |
| | F11.4.4 | Génération automatique d'ID | P0 | **Fait** | F11.1.3 |
| | F11.4.5 | RelationSelector (relations initiales) | P1 | À faire | F11.4.1 |
| | F11.4.6 | Bouton "Ajouter" dans Header | P0 | **Fait** | F11.4.1 |
| | F11.4.7 | Menu contextuel clic droit sur canvas | P2 | À faire | F11.4.1 |
| | F11.4.8 | Raccourci clavier Ctrl+N | P2 | À faire | F11.4.1 |
| **11.5** | | **Gestion des relations** | **P1** | À faire | 11.1, 11.4 |
| | F11.5.1 | RelationEditor composant | P1 | À faire | F11.1.6 |
| | F11.5.2 | RelationCreator dialog | P1 | À faire | F11.5.1 |
| | F11.5.3 | Suppression de relation | P1 | À faire | F11.1.6 |
| | F11.5.4 | Validation des relations (types compatibles) | P1 | À faire | F11.1.2 |
| | F11.5.5 | Interface création relation depuis graphe | P2 | À faire | F11.5.2 |
| | F11.5.6 | Glisser-déposer pour créer relation | P2 | À faire | F11.5.2 |
| **11.6** | | **Import intelligent (Merge)** | **P1** | À faire | 11.1 |
| | F11.6.1 | MergeStrategySelector dans ImportWizard | P1 | À faire | F11.1.1 |
| | F11.6.2 | ConflictDetector service | P1 | À faire | F11.1.1 |
| | F11.6.3 | ConflictResolver interface | P1 | À faire | F11.6.2 |
| | F11.6.4 | Mode "Replace" (actuel) | P0 | Fait | - |
| | F11.6.5 | Mode "Merge" (mise à jour si existe) | P1 | À faire | F11.6.2 |
| | F11.6.6 | Mode "Add only" (ignore doublons) | P1 | À faire | F11.6.2 |
| | F11.6.7 | MergeReport post-import | P1 | À faire | F11.6.5 |
| | F11.6.8 | Prévisualisation des changements | P2 | À faire | F11.6.5 |
| **11.7** | | **Copier/Coller et duplication** | **P2** | À faire | 11.4 |
| | F11.7.1 | ClipboardService | P2 | À faire | F11.1.1 |
| | F11.7.2 | Copier entité(s) Ctrl+C | P2 | À faire | F11.7.1 |
| | F11.7.3 | Coller entité(s) Ctrl+V | P2 | À faire | F11.7.1 |
| | F11.7.4 | Dupliquer entité Ctrl+D | P2 | À faire | F11.7.1 |
| | F11.7.5 | Copier avec relations | P2 | À faire | F11.7.2 |
| | F11.7.6 | Menu contextuel copier/coller | P2 | À faire | F11.7.2 |
| **11.8** | | **Vue Data Table** | **P2** | À faire | 11.2, 11.3, 11.4 |
| | F11.8.1 | DataTable composant principal | P2 | À faire | F11.1.6 |
| | F11.8.2 | Colonnes configurables par type | P2 | À faire | F11.1.4 |
| | F11.8.3 | Tri multi-colonnes | P2 | À faire | F11.8.1 |
| | F11.8.4 | Filtrage avancé | P2 | À faire | F11.8.1 |
| | F11.8.5 | Édition inline (double-clic) | P2 | À faire | F11.2.1 |
| | F11.8.6 | Multi-sélection | P2 | À faire | F11.8.1 |
| | F11.8.7 | Suppression groupée | P2 | À faire | F11.3.1 |
| | F11.8.8 | Export CSV de la sélection | P2 | À faire | F11.8.6 |
| | F11.8.9 | Pagination | P2 | À faire | F11.8.1 |
| | F11.8.10 | Accès via nouvel onglet interface | P2 | À faire | F11.8.1 |

---

## 5. User Stories détaillées

### Phase 11.1 : Infrastructure Data Service

---

#### US-11.1.1 : DataService - Structure de base

**En tant que** développeur,
**Je veux** un service centralisé pour toutes les opérations de mutation de données,
**Afin de** garantir la cohérence et la maintenabilité du code.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Le service expose les méthodes `addNode`, `updateNode`, `deleteNode` | Test unitaire |
| 2 | Le service expose les méthodes `addEdge`, `updateEdge`, `deleteEdge` | Test unitaire |
| 3 | Chaque méthode met à jour l'atom Jotai correspondant | Test d'intégration |
| 4 | Chaque méthode persiste les changements dans IndexedDB | Test d'intégration |
| 5 | Les erreurs sont propagées avec des messages explicites en français | Test unitaire |
| 6 | Le service est accessible via un hook `useDataMutations()` | Test unitaire |

**Définition technique :**

```typescript
// services/dataService.ts

export interface DataServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export interface DataService {
  // Nodes
  addNode<T extends GraphNode>(
    type: NodeType,
    data: Omit<T, 'id' | '_type'>
  ): Promise<DataServiceResult<T>>;

  updateNode<T extends GraphNode>(
    id: string,
    changes: Partial<Omit<T, 'id' | '_type'>>
  ): Promise<DataServiceResult<T>>;

  deleteNode(
    id: string,
    options?: { cascade?: boolean }
  ): Promise<DataServiceResult<{ deletedNodes: string[]; deletedEdges: string[] }>>;

  // Edges
  addEdge(
    type: EdgeType,
    source: string,
    target: string,
    properties?: Record<string, unknown>
  ): Promise<DataServiceResult<GraphEdge>>;

  updateEdge(
    id: string,
    changes: Partial<Omit<GraphEdge, 'id' | '_type' | 'source' | 'target'>>
  ): Promise<DataServiceResult<GraphEdge>>;

  deleteEdge(id: string): Promise<DataServiceResult<void>>;

  // Batch operations
  importMerge(
    nodes: Map<string, GraphNode>,
    edges: Map<string, GraphEdge>,
    strategy: 'replace' | 'merge' | 'add_only'
  ): Promise<DataServiceResult<ImportMergeReport>>;
}
```

**Notes d'implémentation :**
- Utiliser le pattern singleton pour garantir une instance unique
- Intégrer avec `jotai-history` pour le undo/redo automatique
- Log des opérations dans la console en mode développement

---

#### US-11.1.2 : Validation Service

**En tant que** utilisateur,
**Je veux** que mes saisies soient validées avant sauvegarde,
**Afin de** garantir l'intégrité des données du Knowledge Graph.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Les champs obligatoires sont vérifiés | Test unitaire |
| 2 | Les formats de date sont validés (ISO 8601) | Test unitaire |
| 3 | Les valeurs numériques respectent les bornes | Test unitaire |
| 4 | Les références à d'autres entités existent | Test unitaire |
| 5 | Les criticités sont parmi les valeurs autorisées | Test unitaire |
| 6 | Les erreurs sont retournées avec le champ concerné | Test unitaire |
| 7 | Les messages d'erreur sont en français | Test unitaire |

**Règles de validation par type :**

```typescript
// constants/validationRules.ts

export const VALIDATION_RULES: Record<NodeType, ValidationRule[]> = {
  SousTraitant: [
    { field: 'nom', rule: 'required', message: 'Le nom est obligatoire' },
    { field: 'nom', rule: 'minLength', value: 2, message: 'Le nom doit contenir au moins 2 caractères' },
    { field: 'niveau_actuel', rule: 'oneOf', values: [1, 2], message: 'Le niveau doit être 1 ou 2' },
    { field: 'statut', rule: 'oneOf', values: ['Approuvé', 'Déclaré', 'Sous surveillance', 'En évaluation'] },
  ],
  Audit: [
    { field: 'nom', rule: 'required', message: 'Le nom est obligatoire' },
    { field: 'date_debut', rule: 'required', message: 'La date de début est obligatoire' },
    { field: 'date_debut', rule: 'date', message: 'Format de date invalide' },
    { field: 'date_fin', rule: 'dateAfter', ref: 'date_debut', message: 'La date de fin doit être après la date de début' },
    { field: 'type_audit', rule: 'oneOf', values: ['Qualification', 'Routine', 'For Cause', 'Remote'] },
  ],
  Finding: [
    { field: 'description', rule: 'required', message: 'La description est obligatoire' },
    { field: 'date_detection', rule: 'required', message: 'La date de détection est obligatoire' },
    { field: 'criticite', rule: 'oneOf', values: ['Critique', 'Majeur', 'Standard', 'Mineur', 'Observation'] },
  ],
  // ... autres types
};
```

---

#### US-11.1.3 : ID Generator Service

**En tant que** système,
**Je veux** générer des identifiants uniques et lisibles,
**Afin de** permettre l'identification claire des entités créées.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | L'ID suit le format `{PREFIX}-{YYYYMMDD}-{SEQ}` | Test unitaire |
| 2 | Le préfixe est spécifique au type (ST, AUD, FND, etc.) | Test unitaire |
| 3 | La séquence est incrémentale par jour et type | Test unitaire |
| 4 | L'unicité est garantie même en cas de création rapide | Test unitaire |
| 5 | L'ID peut être personnalisé par l'utilisateur | Test unitaire |

**Format des identifiants :**

| Type | Préfixe | Exemple |
|------|---------|---------|
| SousTraitant | ST | ST-20251201-001 |
| Contrat | CTR | CTR-20251201-001 |
| AccordQualite | QA | QA-20251201-001 |
| Audit | AUD | AUD-20251201-001 |
| Inspection | INS | INS-20251201-001 |
| Finding | FND | FND-20251201-001 |
| EvenementQualite | QE | QE-20251201-001 |
| Decision | DEC | DEC-20251201-001 |
| EvaluationRisque | EVR | EVR-20251201-001 |
| ReunionQualite | RQ | RQ-20251201-001 |
| EtudeClinique | ETU | ETU-20251201-001 |
| DomaineService | DOM | DOM-20251201-001 |
| ContexteReglementaire | REG | REG-20251201-001 |
| Alerte | ALR | ALR-20251201-001 |
| Evenement | EVT | EVT-20251201-001 |
| KQI | KQI | KQI-20251201-001 |

---

#### US-11.1.4 : Schema Service

**En tant que** développeur,
**Je veux** un service fournissant les métadonnées de chaque type d'entité,
**Afin de** générer dynamiquement les formulaires et validations.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Le service retourne le schéma complet pour chaque NodeType | Test unitaire |
| 2 | Chaque champ a un label, type, et règles de validation | Test unitaire |
| 3 | Les champs sont groupés logiquement | Test unitaire |
| 4 | Les relations autorisées sont définies par type | Test unitaire |
| 5 | Le service est statique (pas de chargement async) | Performance |

---

#### US-11.1.5 : Extension persistence.ts

**En tant que** système,
**Je veux** des opérations de persistance unitaires,
**Afin de** sauvegarder les modifications sans réécrire tout le dataset.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Méthode `saveNode(node)` ajoute ou met à jour un nœud | Test d'intégration |
| 2 | Méthode `deleteNode(id)` supprime un nœud | Test d'intégration |
| 3 | Méthode `saveEdge(edge)` ajoute ou met à jour une arête | Test d'intégration |
| 4 | Méthode `deleteEdge(id)` supprime une arête | Test d'intégration |
| 5 | Les opérations sont transactionnelles | Test d'intégration |
| 6 | La métadonnée `lastModified` est mise à jour | Test d'intégration |

**Nouvelles méthodes :**

```typescript
// Ajouts à persistence.ts

export async function saveNode(node: GraphNode): Promise<void>;
export async function deleteNodeById(id: string): Promise<void>;
export async function saveEdge(edge: GraphEdge): Promise<void>;
export async function deleteEdgeById(id: string): Promise<void>;
export async function deleteEdgesByNodeId(nodeId: string): Promise<number>;
export async function transaction<T>(
  operations: () => Promise<T>
): Promise<T>;
```

---

#### US-11.1.6 : Hook useDataMutations

**En tant que** développeur,
**Je veux** un hook React encapsulant les opérations de mutation,
**Afin de** simplifier l'utilisation dans les composants.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Le hook expose `createNode`, `updateNode`, `deleteNode` | Test unitaire |
| 2 | Le hook expose `createEdge`, `updateEdge`, `deleteEdge` | Test unitaire |
| 3 | Chaque méthode retourne un état de chargement | Test unitaire |
| 4 | Les erreurs sont capturées et exposées | Test unitaire |
| 5 | Le hook s'intègre avec le système de toast existant | Test d'intégration |

**Interface du hook :**

```typescript
interface UseDataMutationsReturn {
  // Nodes
  createNode: <T extends GraphNode>(
    type: NodeType,
    data: Omit<T, 'id' | '_type'>
  ) => Promise<T | null>;
  updateNode: <T extends GraphNode>(
    id: string,
    changes: Partial<Omit<T, 'id' | '_type'>>
  ) => Promise<T | null>;
  deleteNode: (id: string, cascade?: boolean) => Promise<boolean>;

  // Edges
  createEdge: (type: EdgeType, source: string, target: string) => Promise<GraphEdge | null>;
  updateEdge: (id: string, changes: Partial<GraphEdge>) => Promise<GraphEdge | null>;
  deleteEdge: (id: string) => Promise<boolean>;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}
```

---

### Phase 11.2 : Édition d'entités (Update)

---

#### US-11.2.1 : EntityEditor - Composant principal

**En tant que** utilisateur,
**Je veux** un panneau d'édition pour modifier les entités,
**Afin de** corriger ou mettre à jour les informations sans ré-import.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Le panneau s'affiche à la place du panneau de détails en mode édition | Test UI |
| 2 | Tous les champs éditables du type sont affichés | Test UI |
| 3 | Les champs non-éditables (id, _type) sont affichés en lecture seule | Test UI |
| 4 | Un bouton "Annuler" revient au mode lecture | Test UI |
| 5 | Un bouton "Sauvegarder" enregistre les modifications | Test UI |
| 6 | Le bouton "Sauvegarder" est désactivé si aucune modification | Test UI |
| 7 | Une animation de chargement s'affiche pendant la sauvegarde | Test UI |
| 8 | Un message de confirmation apparaît après sauvegarde | Test UI |

**Maquette wireframe :**

```
┌─────────────────────────────────────────┐
│ ● SousTraitant                    [✕]  │
│ ST-20241015-003                         │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Informations générales ────────────┐ │
│ │                                     │ │
│ │ Nom *                               │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Alpha Clinical Services         │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │                                     │ │
│ │ Type de service                     │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Laboratoire central       ▼    │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │                                     │ │
│ │ Pays                                │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ France                          │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Qualification ─────────────────────┐ │
│ │                                     │ │
│ │ Statut                              │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ ◉ Approuvé                      │ │ │
│ │ │ ○ Déclaré                       │ │ │
│ │ │ ○ Sous surveillance             │ │ │
│ │ │ ○ En évaluation                 │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │                                     │ │
│ │ Niveau actuel                       │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ ◉ N1 (Direct)   ○ N2 (Indirect)│ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   [Annuler]              [Sauvegarder]  │
│                                         │
└─────────────────────────────────────────┘
```

---

#### US-11.2.2 : Champs éditables par type

**En tant que** utilisateur,
**Je veux** que les champs affichés correspondent au type d'entité,
**Afin de** ne voir que les informations pertinentes.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Chaque type d'entité a son propre ensemble de champs | Test UI |
| 2 | Les champs obligatoires sont marqués d'un astérisque | Test UI |
| 3 | Les champs avec options ont un sélecteur | Test UI |
| 4 | Les champs date ont un date picker | Test UI |
| 5 | Les champs numériques ont une validation de type | Test UI |
| 6 | Les champs booléens sont des toggles | Test UI |

**Définition des champs par type (extrait) :**

| Type | Champs éditables |
|------|------------------|
| **SousTraitant** | nom*, type_service, pays, statut*, niveau_actuel*, date_creation, criticite |
| **Audit** | nom*, type_audit, date_debut*, date_fin, resultat, statut, criticite, declencheur |
| **Finding** | description*, criticite*, statut*, date_detection*, date_cloture, capa_id |
| **Inspection** | nom*, autorite, type_inspection, date_debut*, date_fin, resultat, nb_observations, nb_critiques, statut, criticite |
| **EvenementQualite** | description*, impact, criticite*, statut*, date_creation*, date_cloture |
| **Decision** | description*, nature, decideur, date_decision*, duree_mois, statut, criticite |
| **KQI** | indicateur*, periode*, valeur*, seuil_alerte, seuil_objectif, statut, tendance |

*\* = champ obligatoire*

---

#### US-11.2.3 : Intégration dans NodeDetailsPanel

**En tant que** utilisateur,
**Je veux** accéder à l'édition depuis le panneau de détails existant,
**Afin de** ne pas changer mes habitudes de navigation.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un bouton "Modifier" apparaît dans l'en-tête du panneau | Test UI |
| 2 | Le clic bascule vers le mode édition | Test UI |
| 3 | Le mode édition remplace le contenu du panneau | Test UI |
| 4 | L'annulation revient au mode lecture sans perte | Test UI |
| 5 | La sauvegarde revient au mode lecture avec données à jour | Test UI |
| 6 | Le raccourci "E" active le mode édition | Test UI |

**Modifications de NodeDetailsPanel.tsx :**

```typescript
// Ajout dans l'en-tête
<div className="flex gap-2">
  <button onClick={() => setIsEditing(true)} title="Modifier (E)">
    <Pencil className="w-4 h-4" />
  </button>
  <button onClick={handleDelete} title="Supprimer (Suppr)">
    <Trash2 className="w-4 h-4" />
  </button>
</div>

// Contenu conditionnel
{isEditing ? (
  <EntityEditor
    node={selectedNode}
    onSave={handleSave}
    onCancel={() => setIsEditing(false)}
  />
) : (
  <NodeSpecificDetails node={selectedNode} />
)}
```

---

#### US-11.2.4 : Validation en temps réel

**En tant que** utilisateur,
**Je veux** voir les erreurs de validation en temps réel,
**Afin de** corriger mes saisies avant de sauvegarder.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Les champs invalides sont entourés de rouge | Test UI |
| 2 | Un message d'erreur apparaît sous le champ | Test UI |
| 3 | La validation se déclenche à la perte de focus (blur) | Test UI |
| 4 | La validation se déclenche aussi à la tentative de sauvegarde | Test UI |
| 5 | Le bouton "Sauvegarder" est désactivé si erreurs | Test UI |
| 6 | Un compteur d'erreurs est affiché si > 0 | Test UI |

---

#### US-11.2.5 : Sauvegarde avec feedback

**En tant que** utilisateur,
**Je veux** un retour visuel lors de la sauvegarde,
**Afin de** savoir si mon action a réussi.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un spinner apparaît sur le bouton pendant la sauvegarde | Test UI |
| 2 | En cas de succès, un toast "Modifications enregistrées" s'affiche | Test UI |
| 3 | En cas d'erreur, un toast rouge avec le message d'erreur s'affiche | Test UI |
| 4 | Le graphe est mis à jour immédiatement après sauvegarde | Test UI |
| 5 | La timeline est mise à jour si date modifiée | Test UI |
| 6 | L'opération est ajoutée à l'historique undo/redo | Test d'intégration |

---

#### US-11.2.6 : Gestion modifications non sauvegardées

**En tant que** utilisateur,
**Je veux** être averti si je quitte l'édition sans sauvegarder,
**Afin de** ne pas perdre mes modifications accidentellement.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un indicateur visuel montre les modifications non sauvegardées | Test UI |
| 2 | Un dialog de confirmation apparaît si tentative de quitter | Test UI |
| 3 | Le dialog propose "Sauvegarder", "Ne pas sauvegarder", "Annuler" | Test UI |
| 4 | La fermeture de l'application est interceptée si modifications | Test d'intégration |
| 5 | Le changement de nœud sélectionné déclenche l'avertissement | Test UI |

---

### Phase 11.3 : Suppression d'entités (Delete)

---

#### US-11.3.1 : DeleteConfirmDialog

**En tant que** utilisateur,
**Je veux** confirmer avant toute suppression,
**Afin d'** éviter les suppressions accidentelles.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un dialog modal s'affiche demandant confirmation | Test UI |
| 2 | Le nom et type de l'entité sont affichés clairement | Test UI |
| 3 | Un bouton "Annuler" ferme le dialog sans action | Test UI |
| 4 | Un bouton "Supprimer" rouge exécute la suppression | Test UI |
| 5 | Un spinner s'affiche pendant la suppression | Test UI |
| 6 | Un toast de confirmation s'affiche après suppression | Test UI |

**Maquette wireframe :**

```
┌───────────────────────────────────────────────────┐
│                                                   │
│   ⚠️  Confirmer la suppression                    │
│                                                   │
│   Vous êtes sur le point de supprimer :           │
│                                                   │
│   ┌───────────────────────────────────────────┐   │
│   │ ● Finding                                 │   │
│   │ FND-20241120-003                          │   │
│   │ "Écart documentation batch records"       │   │
│   └───────────────────────────────────────────┘   │
│                                                   │
│   Cette action supprimera également :             │
│   • 2 relations entrantes                         │
│   • 1 relation sortante                           │
│                                                   │
│   ⚠️  Cette action est irréversible.              │
│                                                   │
│            [Annuler]    [Supprimer]               │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

#### US-11.3.2 : Détection des relations impactées

**En tant que** utilisateur,
**Je veux** voir les relations qui seront supprimées,
**Afin de** comprendre l'impact de ma suppression.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Le nombre de relations entrantes est affiché | Test UI |
| 2 | Le nombre de relations sortantes est affiché | Test UI |
| 3 | Un lien permet de voir le détail des relations | Test UI |
| 4 | Les relations sont listées avec leur type et entité liée | Test UI |

---

#### US-11.3.3 : Mode suppression cascade

**En tant que** utilisateur avancé,
**Je veux** pouvoir supprimer une entité et ses dépendants,
**Afin de** nettoyer un ensemble de données obsolètes.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Une option "Supprimer les entités liées" est disponible | Test UI |
| 2 | La prévisualisation montre toutes les entités impactées | Test UI |
| 3 | La suppression cascade supprime dans l'ordre correct | Test d'intégration |
| 4 | Un rapport de suppression est affiché (X nœuds, Y relations) | Test UI |

**Règles de cascade :**

| Type source | Cascade vers |
|-------------|--------------|
| Audit | Findings générés (optionnel) |
| Inspection | Findings générés (optionnel) |
| SousTraitant | Contrats, QA, KQI (optionnel) |
| EtudeClinique | Relations IMPLIQUE_ST (toujours) |

---

#### US-11.3.4 : Prévisualisation avant suppression

**En tant que** utilisateur,
**Je veux** voir exactement ce qui sera supprimé,
**Afin de** prendre une décision éclairée.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Liste des nœuds qui seront supprimés | Test UI |
| 2 | Liste des relations qui seront supprimées | Test UI |
| 3 | Compteurs totaux (X nœuds, Y relations) | Test UI |
| 4 | Avertissement visuel si suppression importante (>5 entités) | Test UI |

---

#### US-11.3.5 : Bouton supprimer dans NodeDetailsPanel

**En tant que** utilisateur,
**Je veux** un bouton de suppression accessible,
**Afin de** pouvoir supprimer rapidement une entité.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un bouton "Supprimer" (icône poubelle) est visible | Test UI |
| 2 | Le bouton est de couleur rouge ou s'affiche au survol | Test UI |
| 3 | Le clic ouvre le dialog de confirmation | Test UI |
| 4 | Le bouton a un tooltip "Supprimer (Suppr)" | Test UI |

---

#### US-11.3.6 : Raccourci clavier Suppr

**En tant que** utilisateur avancé,
**Je veux** supprimer avec la touche Suppr,
**Afin d'** être plus productif.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | La touche Suppr déclenche la suppression du nœud sélectionné | Test UI |
| 2 | Le dialog de confirmation s'affiche | Test UI |
| 3 | Le raccourci est documenté dans l'aide (?) | Documentation |
| 4 | Le raccourci ne fonctionne que si un nœud est sélectionné | Test UI |

---

### Phase 11.4 : Création d'entités (Create)

---

#### US-11.4.1 : EntityCreator Dialog

**En tant que** utilisateur,
**Je veux** une interface de création d'entité,
**Afin d'** ajouter de nouvelles données sans passer par Excel.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un dialog modal permet la création | Test UI |
| 2 | Le workflow est : Sélection type → Formulaire → Validation → Création | Test UI |
| 3 | L'ID est pré-généré mais modifiable | Test UI |
| 4 | Les champs obligatoires sont marqués | Test UI |
| 5 | Un bouton "Créer" valide et crée l'entité | Test UI |
| 6 | L'entité créée est sélectionnée dans le graphe | Test UI |
| 7 | Un toast de confirmation s'affiche | Test UI |

**Maquette wireframe :**

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   ➕ Créer une nouvelle entité                       [✕]   │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   Étape 1 : Type d'entité                                  │
│                                                            │
│   ┌─ Organisation ────────────────────────────────────┐    │
│   │ [● ST]  [  Contrat]  [  QA]  [  Domaine]         │    │
│   └───────────────────────────────────────────────────┘    │
│                                                            │
│   ┌─ Événements qualité ─────────────────────────────┐    │
│   │ [  Audit]  [  Inspection]  [  Finding]           │    │
│   │ [  QE]  [  Decision]  [  Évaluation]             │    │
│   └───────────────────────────────────────────────────┘    │
│                                                            │
│   ┌─ Autres ─────────────────────────────────────────┐    │
│   │ [  Étude]  [  Réunion]  [  Alerte]  [  KQI]     │    │
│   └───────────────────────────────────────────────────┘    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   Étape 2 : Informations                                   │
│                                                            │
│   Identifiant                                              │
│   ┌────────────────────────────────────────────────────┐   │
│   │ ST-20251201-004                               🔄  │   │
│   └────────────────────────────────────────────────────┘   │
│                                                            │
│   Nom *                                                    │
│   ┌────────────────────────────────────────────────────┐   │
│   │                                                    │   │
│   └────────────────────────────────────────────────────┘   │
│                                                            │
│   [Voir tous les champs ▼]                                 │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│               [Annuler]              [Créer]               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

#### US-11.4.2 : TypeSelector

**En tant que** utilisateur,
**Je veux** sélectionner facilement le type d'entité à créer,
**Afin de** ne pas me tromper de catégorie.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Les 16 types sont affichés groupés par catégorie | Test UI |
| 2 | Chaque type a une icône et une couleur distinctive | Test UI |
| 3 | Un survol affiche une description du type | Test UI |
| 4 | La sélection met en surbrillance le type choisi | Test UI |
| 5 | Un clic passe automatiquement à l'étape suivante | Test UI |

**Groupement des types :**

| Catégorie | Types |
|-----------|-------|
| Organisation | SousTraitant, Contrat, AccordQualite, DomaineService |
| Événements qualité | Audit, Inspection, Finding, EvenementQualite, Decision, EvaluationRisque |
| Études et réunions | EtudeClinique, ReunionQualite |
| Suivi | Alerte, Evenement, KQI, ContexteReglementaire |

---

#### US-11.4.3 : Formulaires dynamiques par type

**En tant que** utilisateur,
**Je veux** un formulaire adapté au type d'entité,
**Afin de** saisir les informations pertinentes.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Les champs affichés correspondent au type sélectionné | Test UI |
| 2 | Les champs obligatoires sont en premier | Test UI |
| 3 | Un mode "simplifié" ne montre que les champs essentiels | Test UI |
| 4 | Un mode "complet" montre tous les champs | Test UI |
| 5 | Les valeurs par défaut sont pré-remplies | Test UI |

---

#### US-11.4.4 : Génération automatique d'ID

**En tant que** utilisateur,
**Je veux** que l'ID soit généré automatiquement,
**Afin de** gagner du temps et éviter les doublons.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | L'ID est pré-rempli au format standard | Test UI |
| 2 | Un bouton permet de régénérer l'ID | Test UI |
| 3 | L'utilisateur peut modifier l'ID manuellement | Test UI |
| 4 | La validation vérifie l'unicité de l'ID | Test d'intégration |
| 5 | Un message d'erreur s'affiche si ID déjà existant | Test UI |

---

#### US-11.4.5 : RelationSelector

**En tant que** utilisateur,
**Je veux** pouvoir créer des relations lors de la création,
**Afin de** lier immédiatement ma nouvelle entité.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Une section "Relations" permet d'ajouter des liens | Test UI |
| 2 | Seules les relations compatibles avec le type sont proposées | Test UI |
| 3 | Un sélecteur permet de choisir l'entité cible | Test UI |
| 4 | Plusieurs relations peuvent être ajoutées | Test UI |
| 5 | Les relations sont créées en même temps que l'entité | Test d'intégration |

---

#### US-11.4.6 : Bouton "Ajouter" dans Header

**En tant que** utilisateur,
**Je veux** un accès rapide à la création,
**Afin de** pouvoir ajouter une entité à tout moment.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un bouton "+" est visible dans le header | Test UI |
| 2 | Le bouton a un tooltip "Nouvelle entité (Ctrl+N)" | Test UI |
| 3 | Le clic ouvre le dialog de création | Test UI |
| 4 | Le bouton est toujours accessible | Test UI |

---

#### US-11.4.7 : Menu contextuel clic droit

**En tant que** utilisateur avancé,
**Je veux** créer via clic droit sur le canvas,
**Afin d'** avoir une interaction naturelle avec le graphe.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un clic droit sur le canvas affiche un menu | Test UI |
| 2 | Une option "Nouvelle entité" est disponible | Test UI |
| 3 | Des raccourcis par type sont proposés (Nouveau ST, Nouvel Audit...) | Test UI |
| 4 | Le menu se ferme au clic ailleurs | Test UI |

---

#### US-11.4.8 : Raccourci clavier Ctrl+N

**En tant que** utilisateur avancé,
**Je veux** créer avec Ctrl+N,
**Afin d'** être plus productif.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Ctrl+N ouvre le dialog de création | Test UI |
| 2 | Le raccourci est documenté dans l'aide | Documentation |
| 3 | Le raccourci fonctionne depuis n'importe quelle vue | Test UI |

---

### Phase 11.5 : Gestion des relations

---

#### US-11.5.1 : RelationEditor composant

**En tant que** utilisateur,
**Je veux** voir et modifier les propriétés d'une relation,
**Afin de** maintenir des liens précis entre entités.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Les propriétés de la relation sont affichées (date_lien, niveau, etc.) | Test UI |
| 2 | Les propriétés éditables sont modifiables | Test UI |
| 3 | La validation des propriétés est effectuée | Test UI |
| 4 | La sauvegarde met à jour la relation | Test d'intégration |

---

#### US-11.5.2 : RelationCreator dialog

**En tant que** utilisateur,
**Je veux** créer des relations entre entités existantes,
**Afin de** compléter le graphe de connaissances.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un dialog permet de sélectionner source et cible | Test UI |
| 2 | Le type de relation est sélectionnable parmi les types compatibles | Test UI |
| 3 | Les propriétés optionnelles sont saisissables | Test UI |
| 4 | La validation vérifie la cohérence (types compatibles) | Test d'intégration |
| 5 | La relation est créée et visible immédiatement | Test UI |

---

#### US-11.5.3 : Suppression de relation

**En tant que** utilisateur,
**Je veux** supprimer une relation entre deux entités,
**Afin de** corriger les liens erronés.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un bouton de suppression est disponible sur chaque relation | Test UI |
| 2 | Une confirmation est demandée | Test UI |
| 3 | La relation est supprimée sans affecter les nœuds | Test d'intégration |
| 4 | Le graphe est mis à jour immédiatement | Test UI |

---

#### US-11.5.4 : Validation des relations

**En tant que** système,
**Je veux** valider la cohérence des relations,
**Afin de** garantir l'intégrité du graphe.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Seuls les types source/cible compatibles sont autorisés | Test unitaire |
| 2 | Un message d'erreur explicite est affiché si incompatible | Test UI |
| 3 | Les relations existantes incompatibles sont signalées | Test d'intégration |

**Matrice de compatibilité des relations (extrait) :**

| Relation | Source | Cible |
|----------|--------|-------|
| EST_SOUS_TRAITANT_DE | SousTraitant | SousTraitant |
| A_ETE_AUDITE_PAR | SousTraitant | Audit |
| A_ETE_INSPECTE_PAR | SousTraitant | Inspection |
| GENERE_FINDING | Audit | Finding |
| INSPECTION_GENERE_FINDING | Inspection | Finding |
| IMPLIQUE_ST | EtudeClinique | SousTraitant |
| KQI_MESURE_ST | KQI | SousTraitant |
| QE_CONCERNE_ST | EvenementQualite | SousTraitant |

---

### Phase 11.6 : Import intelligent (Merge)

---

#### US-11.6.1 : MergeStrategySelector

**En tant que** utilisateur,
**Je veux** choisir ma stratégie d'import,
**Afin de** contrôler comment les nouvelles données s'intègrent.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Trois options sont disponibles : Remplacer, Fusionner, Ajouter uniquement | Test UI |
| 2 | Chaque option a une description claire | Test UI |
| 3 | L'option par défaut est "Remplacer" (comportement actuel) | Test UI |
| 4 | Le choix est mémorisé pour les imports suivants | Test d'intégration |

**Descriptions des modes :**

| Mode | Description |
|------|-------------|
| **Remplacer** | Supprime toutes les données existantes et importe les nouvelles (comportement actuel) |
| **Fusionner** | Met à jour les entités existantes (même ID), ajoute les nouvelles, préserve les non-importées |
| **Ajouter uniquement** | Ajoute uniquement les entités avec un ID inexistant, ignore les doublons |

---

#### US-11.6.2 : ConflictDetector service

**En tant que** système,
**Je veux** détecter les conflits avant import,
**Afin de** permettre leur résolution manuelle.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Les entités avec même ID sont détectées comme conflits | Test unitaire |
| 2 | Les différences de valeurs sont listées champ par champ | Test unitaire |
| 3 | Un score de similarité est calculé (0-100%) | Test unitaire |
| 4 | Les conflits sont catégorisés (mineur, majeur) | Test unitaire |

**Définition d'un conflit :**

```typescript
interface ImportConflict {
  id: string;
  type: NodeType;
  existing: GraphNode;
  incoming: GraphNode;
  differences: {
    field: string;
    existingValue: unknown;
    incomingValue: unknown;
  }[];
  severity: 'minor' | 'major';
  suggestedResolution: 'keep_existing' | 'use_incoming' | 'merge';
}
```

---

#### US-11.6.3 : ConflictResolver interface

**En tant que** utilisateur,
**Je veux** résoudre les conflits manuellement,
**Afin de** choisir les bonnes valeurs pour chaque entité.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Chaque conflit est affiché avec comparaison côte à côte | Test UI |
| 2 | L'utilisateur peut choisir : Garder existant, Utiliser import, Fusionner | Test UI |
| 3 | Le mode "Fusionner" permet de choisir champ par champ | Test UI |
| 4 | Un bouton "Appliquer à tous similaires" accélère la résolution | Test UI |
| 5 | Un compteur indique les conflits restants | Test UI |

**Maquette wireframe :**

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ⚠️  3 conflits détectés                                      [✕]   │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Conflit 1/3 - SousTraitant ST-001                                   │
│                                                                      │
│  ┌─────────────────────────┬─────────────────────────┐               │
│  │      EXISTANT           │        IMPORT           │               │
│  ├─────────────────────────┼─────────────────────────┤               │
│  │ nom: Alpha Clinical     │ nom: Alpha Clinical Svc │ ◀── Différent │
│  │ statut: Approuvé        │ statut: Sous surveill.  │ ◀── Différent │
│  │ pays: France            │ pays: France            │               │
│  │ niveau: 1               │ niveau: 1               │               │
│  └─────────────────────────┴─────────────────────────┘               │
│                                                                      │
│  Résolution :                                                        │
│  ○ Garder les valeurs existantes                                     │
│  ○ Utiliser les valeurs de l'import                                  │
│  ● Fusionner (choisir par champ)                                     │
│                                                                      │
│    nom:    [● Existant]  [○ Import]                                  │
│    statut: [○ Existant]  [● Import]                                  │
│                                                                      │
│  [□ Appliquer à tous les ST similaires]                              │
│                                                                      │
│             [◀ Précédent]   [Suivant ▶]   [Terminer]                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

#### US-11.6.5 : Mode Merge

**En tant que** utilisateur,
**Je veux** fusionner intelligemment les données,
**Afin de** ne pas perdre mes modifications existantes.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Les entités avec même ID sont mises à jour | Test d'intégration |
| 2 | Les nouvelles entités sont ajoutées | Test d'intégration |
| 3 | Les entités non présentes dans l'import sont préservées | Test d'intégration |
| 4 | Les conflits sont présentés pour résolution | Test UI |
| 5 | Un rapport détaille les actions effectuées | Test UI |

---

#### US-11.6.6 : Mode Add only

**En tant que** utilisateur,
**Je veux** ajouter uniquement les nouvelles entités,
**Afin de** compléter mon dataset sans risque d'écrasement.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Seules les entités avec ID inexistant sont importées | Test d'intégration |
| 2 | Les doublons sont ignorés (pas d'erreur) | Test d'intégration |
| 3 | Un rapport indique le nombre d'entités ignorées | Test UI |

---

#### US-11.6.7 : MergeReport

**En tant que** utilisateur,
**Je veux** un rapport détaillé après l'import,
**Afin de** vérifier que l'import s'est bien passé.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Nombre d'entités créées | Test UI |
| 2 | Nombre d'entités mises à jour | Test UI |
| 3 | Nombre d'entités ignorées | Test UI |
| 4 | Nombre de relations créées/mises à jour | Test UI |
| 5 | Liste des erreurs éventuelles | Test UI |
| 6 | Possibilité de télécharger le rapport | Test UI |

---

### Phase 11.7 : Copier/Coller et duplication

---

#### US-11.7.1 : ClipboardService

**En tant que** système,
**Je veux** gérer un presse-papiers interne,
**Afin de** permettre les opérations de copier/coller.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Le service stocke les entités copiées | Test unitaire |
| 2 | Le service gère la copie simple et avec relations | Test unitaire |
| 3 | Le collage génère de nouveaux IDs | Test unitaire |
| 4 | Le contenu du presse-papiers est conservé jusqu'au prochain copier | Test d'intégration |

---

#### US-11.7.2 : Copier entité(s) Ctrl+C

**En tant que** utilisateur,
**Je veux** copier une ou plusieurs entités,
**Afin de** les dupliquer facilement.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Ctrl+C copie les entités sélectionnées | Test UI |
| 2 | Un toast confirme la copie ("2 entités copiées") | Test UI |
| 3 | La multi-sélection est supportée | Test UI |
| 4 | Le raccourci fonctionne depuis le graphe | Test UI |

---

#### US-11.7.3 : Coller entité(s) Ctrl+V

**En tant que** utilisateur,
**Je veux** coller les entités copiées,
**Afin de** créer des copies avec de nouveaux IDs.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Ctrl+V crée de nouvelles entités à partir du presse-papiers | Test UI |
| 2 | Les nouveaux IDs sont générés automatiquement | Test d'intégration |
| 3 | Les entités collées sont sélectionnées | Test UI |
| 4 | Un toast confirme le collage ("2 entités créées") | Test UI |
| 5 | Le collage est désactivé si presse-papiers vide | Test UI |

---

#### US-11.7.4 : Dupliquer entité Ctrl+D

**En tant que** utilisateur,
**Je veux** dupliquer rapidement une entité,
**Afin de** créer une copie en un clic.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Ctrl+D duplique l'entité sélectionnée | Test UI |
| 2 | La copie a un nouvel ID | Test d'intégration |
| 3 | La copie est sélectionnée | Test UI |
| 4 | Un toast confirme ("Entité dupliquée") | Test UI |

---

### Phase 11.8 : Vue Data Table

---

#### US-11.8.1 : DataTable composant principal

**En tant que** utilisateur,
**Je veux** une vue tabulaire de mes données,
**Afin de** avoir une vision d'ensemble type Excel.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un tableau affiche les entités d'un type sélectionné | Test UI |
| 2 | Les colonnes correspondent aux propriétés du type | Test UI |
| 3 | Le tableau supporte le scroll horizontal si nécessaire | Test UI |
| 4 | Les lignes alternent de couleur pour la lisibilité | Test UI |
| 5 | La performance est maintenue avec 1000+ lignes | Performance |

---

#### US-11.8.5 : Édition inline

**En tant que** utilisateur,
**Je veux** modifier les valeurs directement dans le tableau,
**Afin d'** éditer rapidement plusieurs entités.

**Critères d'acceptation :**

| # | Critère | Validation |
|---|---------|------------|
| 1 | Un double-clic sur une cellule active l'édition | Test UI |
| 2 | La touche Entrée valide la modification | Test UI |
| 3 | La touche Échap annule la modification | Test UI |
| 4 | Tab passe à la cellule suivante | Test UI |
| 5 | Les modifications sont sauvegardées immédiatement | Test d'intégration |
| 6 | Les erreurs de validation sont affichées inline | Test UI |

---

## 6. Spécifications techniques

### 6.1 Interfaces TypeScript

```typescript
// types/dataManagement.ts

// =============== CRUD Operations ===============

export interface CreateNodeOptions<T extends GraphNode> {
  type: NodeType;
  data: Omit<T, 'id' | '_type'>;
  customId?: string;
  relations?: {
    type: EdgeType;
    targetId: string;
    properties?: Record<string, unknown>;
  }[];
}

export interface UpdateNodeOptions {
  id: string;
  changes: Record<string, unknown>;
  skipValidation?: boolean;
}

export interface DeleteNodeOptions {
  id: string;
  cascade?: boolean;
  dryRun?: boolean;  // Retourne ce qui serait supprimé sans supprimer
}

export interface DeleteResult {
  deletedNodes: string[];
  deletedEdges: string[];
  preservedNodes: string[];  // Nœuds non supprimés (pas de cascade)
}

// =============== Import/Merge ===============

export type ImportStrategy = 'replace' | 'merge' | 'add_only';

export interface ImportOptions {
  strategy: ImportStrategy;
  onConflict?: (conflict: ImportConflict) => ConflictResolution;
  dryRun?: boolean;
}

export interface ImportConflict {
  id: string;
  type: NodeType;
  existing: GraphNode;
  incoming: GraphNode;
  differences: FieldDifference[];
  severity: 'minor' | 'major';
}

export interface FieldDifference {
  field: string;
  existingValue: unknown;
  incomingValue: unknown;
  isSignificant: boolean;
}

export type ConflictResolution =
  | { action: 'keep_existing' }
  | { action: 'use_incoming' }
  | { action: 'merge'; fieldChoices: Record<string, 'existing' | 'incoming'> }
  | { action: 'skip' };

export interface ImportReport {
  strategy: ImportStrategy;
  timestamp: string;
  duration: number;
  nodes: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  edges: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  conflicts: {
    total: number;
    resolved: number;
    skipped: number;
  };
  errors: ImportError[];
}

export interface ImportError {
  entityId: string;
  entityType: NodeType | EdgeType;
  errorCode: string;
  message: string;
  field?: string;
}

// =============== Clipboard ===============

export interface ClipboardContent {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceTimestamp: string;
  includesRelations: boolean;
}

// =============== Validation ===============

export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'oneOf'
  | 'date'
  | 'dateAfter'
  | 'dateBefore'
  | 'number'
  | 'min'
  | 'max'
  | 'entityRef'
  | 'unique';

export interface ValidationRule {
  field: string;
  rule: ValidationRuleType;
  value?: unknown;
  ref?: string;  // Référence à un autre champ
  message: string;
}

export interface ValidationError {
  field: string;
  rule: ValidationRuleType;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =============== UI State ===============

export interface EditingState {
  isEditing: boolean;
  entityId: string | null;
  entityType: NodeType | null;
  originalValues: Record<string, unknown>;
  currentValues: Record<string, unknown>;
  isDirty: boolean;
  validationErrors: ValidationError[];
}

export interface DataTableState {
  selectedType: NodeType;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, unknown>;
  selectedRows: Set<string>;
  page: number;
  pageSize: number;
  editingCell: { rowId: string; column: string } | null;
}
```

### 6.2 Schéma de données des champs

```typescript
// constants/fieldDefinitions.ts

export const ENTITY_SCHEMAS: Record<NodeType, EntitySchema> = {
  SousTraitant: {
    type: 'SousTraitant',
    label: 'Sous-traitant',
    labelPlural: 'Sous-traitants',
    icon: 'Building2',
    color: '#8B5CF6',
    idPrefix: 'ST',
    fields: [
      {
        name: 'nom',
        label: 'Nom',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: "Nom du sous-traitant",
        validation: [
          { rule: 'required', message: 'Le nom est obligatoire' },
          { rule: 'minLength', value: 2, message: 'Minimum 2 caractères' }
        ]
      },
      {
        name: 'type_service',
        label: 'Type de service',
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Laboratoire central', label: 'Laboratoire central' },
          { value: 'CRO', label: 'CRO' },
          { value: 'Logistique', label: 'Logistique' },
          { value: 'IT/Data', label: 'IT/Data' },
          { value: 'Manufacturing', label: 'Manufacturing' }
        ]
      },
      {
        name: 'pays',
        label: 'Pays',
        type: 'text',
        required: false,
        editable: true,
        group: 'general'
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: true,
        editable: true,
        group: 'qualification',
        options: [
          { value: 'Approuvé', label: 'Approuvé' },
          { value: 'Déclaré', label: 'Déclaré' },
          { value: 'Sous surveillance', label: 'Sous surveillance' },
          { value: 'En évaluation', label: 'En évaluation' }
        ],
        defaultValue: 'En évaluation'
      },
      {
        name: 'niveau_actuel',
        label: 'Niveau',
        type: 'select',
        required: true,
        editable: true,
        group: 'qualification',
        options: [
          { value: 1, label: 'N1 (Direct)' },
          { value: 2, label: 'N2 (Indirect)' }
        ],
        defaultValue: 1
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'qualification',
        options: [
          { value: 'Critique', label: 'Critique' },
          { value: 'Majeur', label: 'Majeur' },
          { value: 'Standard', label: 'Standard' },
          { value: 'Mineur', label: 'Mineur' }
        ]
      },
      {
        name: 'date_creation',
        label: 'Date de création',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates'
      }
    ],
    allowedRelations: {
      outgoing: ['EST_SOUS_TRAITANT_DE', 'EST_LIE_AU_CONTRAT', 'EST_COUVERT_PAR_QA', 'POSSEDE_SERVICE'],
      incoming: ['A_ETE_AUDITE_PAR', 'A_ETE_INSPECTE_PAR', 'IMPLIQUE_ST', 'KQI_MESURE_ST', 'QE_CONCERNE_ST']
    }
  },

  Audit: {
    type: 'Audit',
    label: 'Audit',
    labelPlural: 'Audits',
    icon: 'ClipboardCheck',
    color: '#10B981',
    idPrefix: 'AUD',
    fields: [
      {
        name: 'nom',
        label: 'Nom',
        type: 'text',
        required: true,
        editable: true,
        group: 'general',
        placeholder: "Nom ou référence de l'audit"
      },
      {
        name: 'type_audit',
        label: "Type d'audit",
        type: 'select',
        required: false,
        editable: true,
        group: 'general',
        options: [
          { value: 'Qualification', label: 'Qualification' },
          { value: 'Routine', label: 'Routine' },
          { value: 'For Cause', label: 'For Cause' },
          { value: 'Remote', label: 'Remote' }
        ]
      },
      {
        name: 'date_debut',
        label: 'Date de début',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates'
      },
      {
        name: 'date_fin',
        label: 'Date de fin',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
        validation: [
          { rule: 'dateAfter', ref: 'date_debut', message: 'Doit être après la date de début' }
        ]
      },
      {
        name: 'resultat',
        label: 'Résultat',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Satisfaisant', label: 'Satisfaisant' },
          { value: 'Satisfaisant avec observations', label: 'Satisfaisant avec observations' },
          { value: 'Non satisfaisant', label: 'Non satisfaisant' }
        ]
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Planifié', label: 'Planifié' },
          { value: 'En cours', label: 'En cours' },
          { value: 'Clôturé', label: 'Clôturé' }
        ],
        defaultValue: 'Planifié'
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: false,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Critique', label: 'Critique' },
          { value: 'Majeur', label: 'Majeur' },
          { value: 'Standard', label: 'Standard' },
          { value: 'Mineur', label: 'Mineur' }
        ]
      },
      {
        name: 'declencheur',
        label: 'Déclencheur',
        type: 'textarea',
        required: false,
        editable: true,
        group: 'details',
        placeholder: "Motif de déclenchement de l'audit"
      }
    ],
    allowedRelations: {
      outgoing: ['GENERE_FINDING', 'AUDIT_DECLENCHE_ALERTE'],
      incoming: ['A_ETE_AUDITE_PAR', 'DECISION_JUSTIFIEE_PAR_AUDIT']
    }
  },

  Finding: {
    type: 'Finding',
    label: 'Finding',
    labelPlural: 'Findings',
    icon: 'AlertTriangle',
    color: '#F59E0B',
    idPrefix: 'FND',
    fields: [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        editable: true,
        group: 'general',
        placeholder: "Description détaillée du finding"
      },
      {
        name: 'criticite',
        label: 'Criticité',
        type: 'select',
        required: true,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'Critique', label: 'Critique' },
          { value: 'Majeur', label: 'Majeur' },
          { value: 'Standard', label: 'Standard' },
          { value: 'Mineur', label: 'Mineur' },
          { value: 'Observation', label: 'Observation' }
        ]
      },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        required: true,
        editable: true,
        group: 'evaluation',
        options: [
          { value: 'En cours', label: 'En cours' },
          { value: 'Clôturé', label: 'Clôturé' }
        ],
        defaultValue: 'En cours'
      },
      {
        name: 'date_detection',
        label: 'Date de détection',
        type: 'date',
        required: true,
        editable: true,
        group: 'dates'
      },
      {
        name: 'date_cloture',
        label: 'Date de clôture',
        type: 'date',
        required: false,
        editable: true,
        group: 'dates',
        validation: [
          { rule: 'dateAfter', ref: 'date_detection', message: 'Doit être après la date de détection' }
        ]
      },
      {
        name: 'capa_id',
        label: 'CAPA associée',
        type: 'text',
        required: false,
        editable: true,
        group: 'details',
        placeholder: "Identifiant de la CAPA"
      },
      {
        name: 'concerne_st2',
        label: 'Concerne ST2',
        type: 'text',
        required: false,
        editable: true,
        group: 'details',
        helpText: "ID du sous-traitant de niveau 2 concerné"
      }
    ],
    allowedRelations: {
      outgoing: [],
      incoming: ['GENERE_FINDING', 'INSPECTION_GENERE_FINDING', 'DECISION_JUSTIFIEE_PAR_FINDING']
    }
  },

  // ... Définitions pour les 13 autres types
};
```

---

## 7. Exigences non-fonctionnelles

### 7.1 Performance

| Exigence | Cible | Mesure |
|----------|-------|--------|
| Temps de sauvegarde d'une entité | < 200 ms | Du clic à la confirmation |
| Temps de suppression avec cascade (10 entités) | < 500 ms | Du clic à la confirmation |
| Temps d'ouverture du dialog de création | < 100 ms | Du clic à l'affichage |
| Temps de détection des conflits (1000 entités) | < 2 s | Import mode merge |
| Rendu DataTable (1000 lignes) | 60 FPS | Scroll fluide |
| Édition inline DataTable | < 50 ms | Latence perçue |

### 7.2 Accessibilité

| Exigence | Standard | Validation |
|----------|----------|------------|
| Contraste des textes | WCAG 2.1 AA (4.5:1) | Audit automatisé |
| Navigation clavier | Complète | Test manuel |
| Labels des champs | Tous les champs ont un label | Audit automatisé |
| Messages d'erreur | Associés aux champs via aria-describedby | Audit automatisé |
| Focus visible | Outline visible sur tous les éléments interactifs | Test manuel |

### 7.3 Internationalisation

| Exigence | Implémentation |
|----------|----------------|
| Langue de l'interface | Français uniquement (v1) |
| Format des dates | DD/MM/YYYY (fr-FR) |
| Format des nombres | Séparateur décimal: virgule |
| Messages d'erreur | Tous en français |
| Placeholders | Tous en français |

### 7.4 Sécurité

| Exigence | Implémentation |
|----------|----------------|
| Validation côté client | Toutes les saisies sont validées avant sauvegarde |
| Échappement | Les caractères spéciaux sont échappés dans les requêtes Cypher |
| Pas d'injection | Utilisation de requêtes paramétrées |

### 7.5 Résilience

| Exigence | Implémentation |
|----------|----------------|
| Erreur de sauvegarde | Retry automatique (3 tentatives) + message utilisateur |
| Perte de connexion IndexedDB | Fallback en mémoire + avertissement |
| Données corrompues | Détection et proposition de réinitialisation |
| Modifications non sauvegardées | Avertissement avant fermeture |

---

## 8. Plan de tests

### 8.1 Tests unitaires

| Module | Fichier test | Couverture cible |
|--------|--------------|------------------|
| DataService | dataService.test.ts | 90% |
| ValidationService | validationService.test.ts | 95% |
| IdGenerator | idGenerator.test.ts | 100% |
| SchemaService | schemaService.test.ts | 100% |
| ClipboardService | clipboardService.test.ts | 85% |
| MergeService | mergeService.test.ts | 90% |
| ConflictDetector | conflictDetector.test.ts | 95% |

### 8.2 Tests d'intégration

| Scénario | Description | Priorité |
|----------|-------------|----------|
| INT-001 | Création entité → Persistance → Rechargement | P0 |
| INT-002 | Modification entité → Mise à jour graphe | P0 |
| INT-003 | Suppression cascade → Vérification intégrité | P0 |
| INT-004 | Import merge → Résolution conflits → Rapport | P1 |
| INT-005 | Copier/Coller → Nouveaux IDs → Relations préservées | P2 |
| INT-006 | Undo/Redo → Toutes opérations CRUD | P1 |
| INT-007 | DataTable édition inline → Sauvegarde | P2 |

### 8.3 Tests E2E (Playwright)

```typescript
// e2e/data-management.spec.ts

test.describe('Data Management', () => {
  test('should edit an existing entity', async ({ page }) => {
    // Sélectionner un nœud
    await page.click('[data-node-id="ST-001"]');
    // Ouvrir l'édition
    await page.click('[data-testid="edit-button"]');
    // Modifier un champ
    await page.fill('[data-testid="field-nom"]', 'Nouveau nom');
    // Sauvegarder
    await page.click('[data-testid="save-button"]');
    // Vérifier le toast
    await expect(page.locator('.toast-success')).toBeVisible();
    // Vérifier la mise à jour
    await expect(page.locator('[data-testid="node-name"]')).toHaveText('Nouveau nom');
  });

  test('should create a new entity', async ({ page }) => {
    // Ouvrir le dialog
    await page.click('[data-testid="add-entity-button"]');
    // Sélectionner le type
    await page.click('[data-testid="type-SousTraitant"]');
    // Remplir le formulaire
    await page.fill('[data-testid="field-nom"]', 'Test ST');
    await page.selectOption('[data-testid="field-statut"]', 'Approuvé');
    // Créer
    await page.click('[data-testid="create-button"]');
    // Vérifier
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('[data-node-id^="ST-"]')).toBeVisible();
  });

  test('should delete with confirmation', async ({ page }) => {
    await page.click('[data-node-id="ST-001"]');
    await page.click('[data-testid="delete-button"]');
    // Vérifier le dialog
    await expect(page.locator('[data-testid="delete-confirm-dialog"]')).toBeVisible();
    // Confirmer
    await page.click('[data-testid="confirm-delete"]');
    // Vérifier disparition
    await expect(page.locator('[data-node-id="ST-001"]')).not.toBeVisible();
  });

  test('should warn on unsaved changes', async ({ page }) => {
    await page.click('[data-node-id="ST-001"]');
    await page.click('[data-testid="edit-button"]');
    await page.fill('[data-testid="field-nom"]', 'Modifié');
    // Tenter de changer de nœud
    await page.click('[data-node-id="ST-002"]');
    // Vérifier l'avertissement
    await expect(page.locator('[data-testid="unsaved-warning"]')).toBeVisible();
  });
});
```

### 8.4 Tests de performance

| Test | Méthode | Seuil acceptable |
|------|---------|------------------|
| Création de 100 entités consécutives | Script automatisé | < 20 s |
| Import merge 1000 entités | Script automatisé | < 10 s |
| Rendu DataTable 5000 lignes | Lighthouse | FPS > 30 |
| Mémoire après 1000 opérations | DevTools | < 200 MB delta |

---

## 9. Dépendances et risques

### 9.1 Dépendances techniques

| Dépendance | Version | Usage | Risque |
|------------|---------|-------|--------|
| jotai | 2.15+ | State management | Faible - Déjà utilisé |
| jotai-history | 0.4+ | Undo/redo | Faible - Déjà utilisé |
| @radix-ui/react-dialog | 1.1+ | Dialogs | Faible - Déjà utilisé |
| @radix-ui/react-select | 2.2+ | Selects | Faible - Déjà utilisé |
| @tanstack/react-table | 8.x | DataTable | Nouveau - À installer |
| date-fns | 3.x | Manipulation dates | Nouveau - À installer |

### 9.2 Dépendances fonctionnelles

| Fonctionnalité | Dépend de |
|----------------|-----------|
| F11.2.x (Édition) | F11.1.x (Infrastructure) |
| F11.3.x (Suppression) | F11.1.x (Infrastructure) |
| F11.4.x (Création) | F11.1.x + F11.2.x |
| F11.5.x (Relations) | F11.1.x + F11.4.x |
| F11.6.x (Import merge) | F11.1.x |
| F11.7.x (Clipboard) | F11.4.x |
| F11.8.x (DataTable) | F11.2.x + F11.3.x + F11.4.x |

### 9.3 Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Performance dégradée avec grand volume | Moyenne | Élevé | Pagination, virtualisation |
| Conflits de données en édition concurrente | Faible | Moyen | Application mono-utilisateur |
| Perte de données en cas de crash | Faible | Élevé | Sauvegarde automatique fréquente |
| Complexité des formulaires dynamiques | Moyenne | Moyen | Composants réutilisables |
| Régression sur fonctionnalités existantes | Faible | Élevé | Tests E2E complets |

### 9.4 Points d'attention

1. **Intégration avec undo/redo** : Chaque opération CRUD doit être enregistrée dans l'historique jotai-history pour permettre l'annulation.

2. **Synchronisation graphe/timeline** : Les modifications de dates doivent mettre à jour la timeline en temps réel.

3. **Moteur d'inférence** : Les modifications d'entités doivent déclencher une réévaluation des règles d'alerte.

4. **Cohérence visuelle** : Les nouveaux composants doivent respecter le design system existant (glassmorphism, couleurs, animations).

---

## 10. Glossaire

| Terme | Définition |
|-------|------------|
| **CRUD** | Create, Read, Update, Delete - Les 4 opérations fondamentales sur les données |
| **Cascade** | Suppression automatique des entités dépendantes lors de la suppression d'une entité parent |
| **Merge** | Fusion intelligente de données importées avec les données existantes |
| **Conflit** | Situation où une entité importée a le même ID qu'une entité existante avec des valeurs différentes |
| **Inline editing** | Édition directe dans un tableau, sans ouvrir de formulaire séparé |
| **Dry run** | Exécution simulée d'une opération pour prévisualiser les résultats sans appliquer les changements |
| **Data Service** | Service centralisé gérant toutes les opérations de mutation de données |
| **Schema Service** | Service fournissant les métadonnées (champs, validation) de chaque type d'entité |

---

## Annexe A : Checklist de validation par phase

### Phase 11.1 - Infrastructure
- [ ] DataService implémenté et testé
- [ ] ValidationService implémenté et testé
- [ ] IdGenerator implémenté et testé
- [ ] SchemaService implémenté avec les 16 types
- [ ] persistence.ts étendu avec opérations unitaires
- [ ] useDataMutations hook fonctionnel
- [ ] Tests unitaires > 85% couverture

### Phase 11.2 - Édition
- [ ] EntityEditor composant fonctionnel
- [ ] Tous les champs par type définis
- [ ] Bouton "Modifier" dans NodeDetailsPanel
- [ ] Validation temps réel fonctionnelle
- [ ] Sauvegarde avec feedback
- [ ] Warning modifications non sauvegardées
- [ ] Tests E2E édition passent

### Phase 11.3 - Suppression
- [ ] DeleteConfirmDialog fonctionnel
- [ ] Détection relations impactées
- [ ] Mode cascade optionnel
- [ ] Prévisualisation avant suppression
- [ ] Bouton supprimer dans panneau
- [ ] Raccourci Suppr fonctionnel
- [ ] Tests E2E suppression passent

### Phase 11.4 - Création
- [ ] EntityCreator dialog fonctionnel
- [ ] TypeSelector avec 16 types groupés
- [ ] Formulaires dynamiques par type
- [ ] Génération auto ID
- [ ] RelationSelector fonctionnel
- [ ] Bouton "+" dans header
- [ ] Menu contextuel clic droit
- [ ] Raccourci Ctrl+N
- [ ] Tests E2E création passent

### Phase 11.5 - Relations
- [ ] RelationEditor fonctionnel
- [ ] RelationCreator fonctionnel
- [ ] Suppression relation
- [ ] Validation compatibilité types
- [ ] Interface création depuis graphe
- [ ] Tests E2E relations passent

### Phase 11.6 - Import merge
- [ ] MergeStrategySelector fonctionnel
- [ ] ConflictDetector implémenté
- [ ] ConflictResolver interface
- [ ] Mode Replace préservé
- [ ] Mode Merge fonctionnel
- [ ] Mode Add only fonctionnel
- [ ] MergeReport détaillé
- [ ] Tests d'intégration import passent

### Phase 11.7 - Clipboard
- [ ] ClipboardService implémenté
- [ ] Ctrl+C copie entités
- [ ] Ctrl+V colle avec nouveaux IDs
- [ ] Ctrl+D duplique
- [ ] Copie avec relations optionnel
- [ ] Menu contextuel copier/coller

### Phase 11.8 - DataTable
- [ ] DataTable composant principal
- [ ] Colonnes configurables
- [ ] Tri multi-colonnes
- [ ] Filtrage avancé
- [ ] Édition inline
- [ ] Multi-sélection
- [ ] Suppression groupée
- [ ] Export CSV
- [ ] Pagination
- [ ] Nouvel onglet interface
- [ ] Performance validée (1000+ lignes)

---

*Document créé le 1er décembre 2025*
*Version 1.0.0*
