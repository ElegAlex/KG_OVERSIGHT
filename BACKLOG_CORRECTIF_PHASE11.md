# KG-OVERSIGHT - Backlog Correctif Phase 11

**Version** : 1.0.0
**Date** : 3 décembre 2025
**Origine** : Audit de conformité AUDIT_DATA_MANAGEMENT.md
**Statut** : À planifier

---

## 1. Contexte

Suite à l'audit de conformité de la Phase 11 Data Management, des écarts critiques ont été identifiés entre les spécifications du backlog initial et l'implémentation réelle. Ce backlog correctif définit les User Stories nécessaires pour atteindre la conformité totale.

### 1.1 Écarts à corriger

| ID | Écart | Sévérité | Effort |
|----|-------|----------|--------|
| EC-01 | `updateEdge()` absent | Critique | 6h |
| EC-02 | Propriétés relations non gérées | Critique | 11h |
| EC-03 | RelationEditor inexistant | Critique | 8h |
| EC-04 | Undo/Redo non intégré | Majeur | 6h |
| EC-05 | RelationCreator sans propriétés | Majeur | 4h |

**Effort total estimé** : 35 heures

### 1.2 Priorisation

| Sprint | Contenu | Objectif |
|--------|---------|----------|
| **Correctif 1** | EC-01, EC-02, EC-03, EC-05 | Gestion complète des relations |
| **Correctif 2** | EC-04, écarts mineurs | Undo/redo + finitions |

---

## 2. Sprint Correctif 1 : Gestion des Relations

**Durée** : 29 heures
**Objectif** : Permettre la création, modification et visualisation des propriétés des relations

---

### US-C1.1 : Implémenter updateEdge dans DataService

**En tant que** système,
**Je veux** disposer d'une méthode `updateEdge()` dans le DataService,
**Afin de** permettre la modification des propriétés d'une relation existante.

**Priorité** : P0 - Bloquant
**Effort** : 4 heures
**Dépendances** : Aucune

#### Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | La méthode `updateEdge(edgeId, changes)` existe dans dataService.ts | Test unitaire |
| 2 | Les propriétés modifiables sont : toutes sauf `id`, `_type`, `source`, `target` | Test unitaire |
| 3 | La modification persiste dans IndexedDB | Test d'intégration |
| 4 | L'atom `allEdgesAtom` est mis à jour après modification | Test d'intégration |
| 5 | Une erreur explicite est retournée si l'edge n'existe pas | Test unitaire |
| 6 | Les messages d'erreur sont en français | Test unitaire |

#### Spécification technique

```typescript
// services/dataService.ts

export async function updateEdge(
  edgeId: string,
  changes: Partial<Omit<GraphEdge, 'id' | '_type' | 'source' | 'target'>>
): Promise<DataServiceResult<GraphEdge>> {
  // 1. Vérifier que l'edge existe
  const existingEdge = edgesCache.get(edgeId);
  if (!existingEdge) {
    return {
      success: false,
      error: {
        code: 'EDGE_NOT_FOUND',
        message: `La relation "${edgeId}" n'existe pas`,
      },
    };
  }

  // 2. Fusionner les changements
  const updatedEdge: GraphEdge = {
    ...existingEdge,
    ...changes,
    id: existingEdge.id,
    _type: existingEdge._type,
    source: existingEdge.source,
    target: existingEdge.target,
  };

  // 3. Mettre à jour le cache
  edgesCache.set(edgeId, updatedEdge);

  // 4. Persister
  await saveEdge(updatedEdge);

  console.log(`[DataService] Edge updated: ${edgeId}`, changes);

  return {
    success: true,
    data: updatedEdge,
  };
}
```

#### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `services/dataService.ts` | Ajouter fonction `updateEdge()` |
| `services/dataService.ts` | Exporter `updateEdge` |

---

### US-C1.2 : Exposer updateEdge dans useDataMutations

**En tant que** développeur,
**Je veux** accéder à `updateEdge` via le hook useDataMutations,
**Afin de** l'utiliser dans les composants React.

**Priorité** : P0 - Bloquant
**Effort** : 2 heures
**Dépendances** : US-C1.1

#### Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | Le hook expose `updateEdge(edgeId, changes)` | Test unitaire |
| 2 | L'état `isLoading` est géré pendant l'opération | Test unitaire |
| 3 | Les erreurs sont capturées et exposées | Test unitaire |
| 4 | L'atom `allEdgesAtom` est synchronisé | Test d'intégration |

#### Spécification technique

```typescript
// hooks/useDataMutations.ts

// Ajouter dans l'interface EdgeMutations
interface EdgeMutations {
  createEdge: (...) => Promise<DataServiceResult<GraphEdge>>;
  updateEdge: (
    edgeId: string,
    changes: Partial<Omit<GraphEdge, 'id' | '_type' | 'source' | 'target'>>
  ) => Promise<DataServiceResult<GraphEdge>>;
  deleteEdge: (edgeId: string) => Promise<DataServiceResult<boolean>>;
}

// Implémenter la fonction
const updateEdge = useCallback(
  async (
    edgeId: string,
    changes: Partial<Omit<GraphEdge, 'id' | '_type' | 'source' | 'target'>>
  ): Promise<DataServiceResult<GraphEdge>> => {
    startMutation('updateEdge');
    syncCaches();

    try {
      const result = await dataService.updateEdge(edgeId, changes);

      if (result.success && result.data) {
        setEdges((prev) => {
          const newEdges = new Map(prev);
          newEdges.set(edgeId, result.data!);
          return newEdges;
        });
      }

      endMutation(result.error?.message);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      endMutation(errorMsg);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: errorMsg },
      };
    }
  },
  [startMutation, endMutation, syncCaches, setEdges]
);
```

#### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `hooks/useDataMutations.ts` | Ajouter `updateEdge` dans EdgeMutations |
| `hooks/useDataMutations.ts` | Implémenter `updateEdge` |
| `hooks/useDataMutations.ts` | Exporter dans le return |

---

### US-C1.3 : Créer le composant RelationEditor

**En tant que** utilisateur,
**Je veux** un panneau d'édition pour modifier les propriétés d'une relation,
**Afin de** maintenir des métadonnées précises sur les liens entre entités.

**Priorité** : P0 - Bloquant
**Effort** : 8 heures
**Dépendances** : US-C1.1, US-C1.2

#### Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | Le composant affiche le type de relation | Test UI |
| 2 | Les nœuds source et cible sont affichés (lecture seule) | Test UI |
| 3 | Les propriétés définies dans relationSchemas sont éditables | Test UI |
| 4 | Un bouton "Sauvegarder" enregistre les modifications | Test UI |
| 5 | Un bouton "Annuler" ferme sans sauvegarder | Test UI |
| 6 | La validation est effectuée sur les propriétés | Test UI |
| 7 | Un toast confirme la sauvegarde | Test UI |

#### Maquette

```
┌─────────────────────────────────────────────────────┐
│ Modifier la relation                          [✕]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Type : EST_SOUS_TRAITANT_DE                        │
│                                                     │
│  ┌─────────────┐           ┌─────────────┐          │
│  │  ST Alpha   │ ────────▶ │  ST Beta    │          │
│  │  (Source)   │           │  (Cible)    │          │
│  └─────────────┘           └─────────────┘          │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌─ Propriétés de la relation ───────────────────┐  │
│  │                                               │  │
│  │  Niveau                                       │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ 2                                    ▼  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  Date de création du lien                     │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ 15/03/2024                           📅 │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [Annuler]                         [Sauvegarder]   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Spécification technique

```typescript
// components/RelationEditor.tsx

interface RelationEditorProps {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  onClose: () => void;
  onSaved?: (edge: GraphEdge) => void;
}

export function RelationEditor({
  edge,
  sourceNode,
  targetNode,
  onClose,
  onSaved,
}: RelationEditorProps) {
  const { updateEdge, state } = useDataMutations();
  const schema = getRelationSchema(edge._type);

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    // Initialiser avec les propriétés existantes de l'edge
    const initial: Record<string, unknown> = {};
    if (schema?.properties) {
      for (const prop of schema.properties) {
        initial[prop.name] = (edge as Record<string, unknown>)[prop.name] ?? '';
      }
    }
    return initial;
  });

  const handleSave = async () => {
    const result = await updateEdge(edge.id, formData);
    if (result.success) {
      addNotification({ type: 'success', message: 'Relation mise à jour' });
      onSaved?.(result.data!);
      onClose();
    }
  };

  // Si pas de propriétés éditables
  if (!schema?.hasProperties || !schema.properties?.length) {
    return (
      <div className="p-4 text-center text-slate-500">
        Cette relation n'a pas de propriétés modifiables.
      </div>
    );
  }

  return (
    <Dialog>
      {/* Header avec type et visualisation source→cible */}
      {/* Formulaire dynamique basé sur schema.properties */}
      {/* Actions */}
    </Dialog>
  );
}
```

#### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `components/RelationEditor.tsx` | Composant principal |

#### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `components/RelationList.tsx` | Ajouter bouton "Modifier" par relation |
| `index.ts` | Exporter RelationEditor |

---

### US-C1.4 : Afficher les propriétés dans RelationList

**En tant que** utilisateur,
**Je veux** voir les propriétés d'une relation dans la liste,
**Afin de** connaître les métadonnées sans ouvrir l'éditeur.

**Priorité** : P1 - Important
**Effort** : 3 heures
**Dépendances** : Aucune

#### Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | Les propriétés non-nulles sont affichées sous le nom de la relation | Test UI |
| 2 | Le format d'affichage est : `propriété: valeur` | Test UI |
| 3 | Les propriétés sont stylées de manière discrète | Test UI |
| 4 | Un bouton "Modifier" apparaît au survol si hasProperties=true | Test UI |

#### Maquette

```
┌─────────────────────────────────────────────────────┐
│ Relations sortantes (3)                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ● Est sous-traitant de                      │    │
│  │   Alpha Clinical Services                   │    │
│  │   niveau: 2 • date_lien: 15/03/2024    [✎] │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ● Implique le sous-traitant                 │    │
│  │   Étude BEACON-2024                         │    │
│  │   role: Laboratoire central             [✎] │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `components/RelationList.tsx` | Ajouter affichage des propriétés dans RelationItem |
| `components/RelationList.tsx` | Ajouter bouton édition conditionnelle |

---

### US-C1.5 : Ajouter la saisie des propriétés dans RelationCreator

**En tant que** utilisateur,
**Je veux** pouvoir définir les propriétés d'une relation lors de sa création,
**Afin de** renseigner les métadonnées dès le départ.

**Priorité** : P1 - Important
**Effort** : 4 heures
**Dépendances** : US-C1.1

#### Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | Une étape "Propriétés" apparaît si le type de relation a des propriétés | Test UI |
| 2 | Les champs sont générés dynamiquement depuis relationSchemas | Test UI |
| 3 | L'étape est ignorée si hasProperties=false | Test UI |
| 4 | Les propriétés sont passées à createEdge() | Test d'intégration |

#### Modification du workflow

```
Actuel :     Type → Cible → Confirmer
Nouveau :    Type → Cible → [Propriétés] → Confirmer
                             (conditionnel)
```

#### Spécification technique

```typescript
// components/RelationCreatorDialog.tsx

// Modifier le type Step
type Step = 'select-type' | 'select-target' | 'properties' | 'confirm';

// Ajouter state pour les propriétés
const [properties, setProperties] = useState<Record<string, unknown>>({});

// Ajouter la logique de navigation
const handleSelectTargetNode = useCallback((node: GraphNode) => {
  setSelectedTargetNode(node);

  // Vérifier si le type de relation a des propriétés
  const schema = RELATION_SCHEMAS[selectedRelationType!];
  if (schema?.hasProperties && schema.properties?.length) {
    setStep('properties');
  } else {
    setStep('confirm');
  }
}, [selectedRelationType]);

// Ajouter le composant StepProperties
function StepProperties({ ... }) {
  // Afficher les champs basés sur schema.properties
}

// Modifier handleCreate pour passer les propriétés
const handleCreate = useCallback(async () => {
  const result = await createEdge(
    sourceNode.id,
    selectedTargetNode!.id,
    selectedRelationType!,
    properties  // ← Ajouter ce paramètre
  );
  // ...
}, [/* deps */, properties]);
```

#### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `components/RelationCreatorDialog.tsx` | Ajouter étape properties |
| `components/RelationCreatorDialog.tsx` | Modifier workflow de navigation |
| `components/RelationCreatorDialog.tsx` | Passer properties à createEdge |

---

### US-C1.6 : Ajouter date_lien aux schémas de relations

**En tant que** métier,
**Je veux** pouvoir enregistrer la date de création d'un lien,
**Afin de** tracer l'historique des associations.

**Priorité** : P1 - Important
**Effort** : 2 heures
**Dépendances** : Aucune

#### Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | Tous les types de relations ont une propriété `date_lien` optionnelle | Revue code |
| 2 | La propriété est de type `date` | Revue code |
| 3 | La date est optionnelle (required: false) | Revue code |

#### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `constants/relationSchemas.ts` | Ajouter `date_lien` à chaque type |

#### Exemple de modification

```typescript
EST_SOUS_TRAITANT_DE: {
  type: 'EST_SOUS_TRAITANT_DE',
  // ...
  hasProperties: true,
  properties: [
    { name: 'niveau', label: 'Niveau', type: 'number', required: false },
    { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },  // ← Ajout
  ],
},

// Pour les relations sans propriétés, ajouter :
EST_LIE_AU_CONTRAT: {
  // ...
  hasProperties: true,  // ← Changer de false à true
  properties: [
    { name: 'date_lien', label: 'Date du lien', type: 'date', required: false },
  ],
},
```

---

## 3. Sprint Correctif 2 : Undo/Redo et Finitions

**Durée** : 12 heures
**Objectif** : Permettre l'annulation des opérations et finaliser les fonctionnalités P2

---

### US-C2.1 : Intégrer jotai-history pour Undo/Redo

**En tant que** utilisateur,
**Je veux** pouvoir annuler mes dernières modifications,
**Afin de** corriger des erreurs de manipulation.

**Priorité** : P1 - Important
**Effort** : 6 heures
**Dépendances** : Sprint Correctif 1

#### Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | Ctrl+Z annule la dernière opération CRUD | Test UI |
| 2 | Ctrl+Y/Ctrl+Shift+Z rétablit l'opération | Test UI |
| 3 | L'historique conserve les 50 dernières opérations | Test unitaire |
| 4 | Un bouton Undo/Redo est disponible dans le Header | Test UI |
| 5 | Les boutons sont désactivés si pas d'historique | Test UI |

#### Spécification technique

```typescript
// stores/historyAtoms.ts

import { atomWithHistory } from 'jotai-history';
import { allNodesAtom, allEdgesAtom } from '@shared/stores/selectionAtoms';

// Wrapper les atoms avec historique
export const nodesWithHistoryAtom = atomWithHistory(allNodesAtom, 50);
export const edgesWithHistoryAtom = atomWithHistory(allEdgesAtom, 50);

// Atoms dérivés pour les actions
export const canUndoAtom = atom((get) => {
  const nodesHistory = get(nodesWithHistoryAtom);
  return nodesHistory.canUndo;
});

export const canRedoAtom = atom((get) => {
  const nodesHistory = get(nodesWithHistoryAtom);
  return nodesHistory.canRedo;
});

export const undoAtom = atom(null, (get, set) => {
  const nodesHistory = get(nodesWithHistoryAtom);
  const edgesHistory = get(edgesWithHistoryAtom);

  if (nodesHistory.canUndo) {
    set(nodesWithHistoryAtom, nodesHistory.undo());
  }
  if (edgesHistory.canUndo) {
    set(edgesWithHistoryAtom, edgesHistory.undo());
  }
});

export const redoAtom = atom(null, (get, set) => {
  // Similaire pour redo
});
```

#### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `stores/historyAtoms.ts` | Atoms avec historique |

#### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `components/layout/Header.tsx` | Ajouter boutons Undo/Redo |
| `hooks/useKeyboardShortcuts.ts` | Ajouter raccourcis Ctrl+Z/Y |
| `hooks/useDataMutations.ts` | Supprimer commentaire trompeur ligne 9 |

---

### US-C2.2 : Ajouter RelationSelector à la création d'entité

**En tant que** utilisateur,
**Je veux** pouvoir créer des relations initiales lors de la création d'une entité,
**Afin de** lier immédiatement la nouvelle entité au graphe.

**Priorité** : P2 - Nice-to-have
**Effort** : 4 heures
**Dépendances** : Sprint Correctif 1

#### Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | Une section optionnelle permet d'ajouter des relations | Test UI |
| 2 | Seules les relations compatibles sont proposées | Test UI |
| 3 | Plusieurs relations peuvent être ajoutées | Test UI |
| 4 | Les relations sont créées après l'entité | Test d'intégration |

---

### US-C2.3 : Implémenter les raccourcis clavier

**En tant que** utilisateur avancé,
**Je veux** utiliser des raccourcis clavier pour les actions courantes,
**Afin de** gagner en productivité.

**Priorité** : P2 - Nice-to-have
**Effort** : 2 heures
**Dépendances** : Aucune

#### Raccourcis à implémenter

| Raccourci | Action | Contexte |
|-----------|--------|----------|
| Suppr / Delete | Supprimer le nœud sélectionné | Nœud sélectionné |
| Ctrl+N | Ouvrir le dialog de création | Global |
| Ctrl+Z | Undo | Global |
| Ctrl+Y | Redo | Global |

---

## 4. Récapitulatif des livrables

### Sprint Correctif 1

| Fichier | Action | US |
|---------|--------|-----|
| `services/dataService.ts` | Modifier | US-C1.1 |
| `hooks/useDataMutations.ts` | Modifier | US-C1.2 |
| `components/RelationEditor.tsx` | Créer | US-C1.3 |
| `components/RelationList.tsx` | Modifier | US-C1.4 |
| `components/RelationCreatorDialog.tsx` | Modifier | US-C1.5 |
| `constants/relationSchemas.ts` | Modifier | US-C1.6 |

### Sprint Correctif 2

| Fichier | Action | US |
|---------|--------|-----|
| `stores/historyAtoms.ts` | Créer | US-C2.1 |
| `components/layout/Header.tsx` | Modifier | US-C2.1 |
| `components/EntityCreatorDialog.tsx` | Modifier | US-C2.2 |
| `hooks/useKeyboardShortcuts.ts` | Modifier | US-C2.3 |

---

## 5. Critères de validation finale

### 5.1 Tests de non-régression

- [ ] CRUD nœuds fonctionne toujours
- [ ] Import/Export fonctionne toujours
- [ ] Copier/Coller fonctionne toujours
- [ ] DataTable fonctionne toujours

### 5.2 Tests des nouvelles fonctionnalités

- [ ] Créer une relation avec propriétés
- [ ] Modifier les propriétés d'une relation existante
- [ ] Visualiser les propriétés dans RelationList
- [ ] Undo/Redo sur création de nœud
- [ ] Undo/Redo sur modification de nœud
- [ ] Undo/Redo sur suppression de nœud

### 5.3 Documentation

- [ ] Mettre à jour BACKLOG_DATA_MANAGEMENT.md avec les vrais statuts
- [ ] Supprimer les commentaires trompeurs du code
- [ ] Mettre à jour le README si nécessaire

---

## 6. Planning prévisionnel

| Semaine | Sprint | User Stories | Effort |
|---------|--------|--------------|--------|
| S1 | Correctif 1 | US-C1.1 à US-C1.6 | 23h |
| S2 | Correctif 2 | US-C2.1 à US-C2.3 | 12h |
| S2 | Validation | Tests + Documentation | 4h |

**Total** : 39 heures sur 2 semaines

---

*Document généré le 3 décembre 2025*
*Référence : AUDIT_DATA_MANAGEMENT.md*
