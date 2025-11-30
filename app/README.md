# KG-Oversight

**Application desktop de visualisation de graphe de connaissances pour la supervision qualité des sous-traitants dans l'industrie pharmaceutique.**

---

## Table des matières

1. [Présentation](#présentation)
2. [Installation](#installation)
3. [Fonctionnalités](#fonctionnalités)
4. [Guide d'utilisation](#guide-dutilisation)
5. [Filtres](#filtres)
6. [Auto-updater](#auto-updater)
7. [Configuration](#configuration)
8. [Développement](#développement)
9. [Build et Distribution](#build-et-distribution)

---

## Présentation

KG-Oversight est une application desktop conçue pour les professionnels de la qualité dans l'industrie pharmaceutique. Elle permet de :

- **Visualiser** les relations entre sous-traitants, études cliniques, audits et événements qualité
- **Naviguer** intuitivement dans un graphe de connaissances interactif
- **Filtrer** les données par type, criticité, statut et dates
- **Analyser** les indicateurs qualité (KQI) via des dashboards
- **Détecter** automatiquement les situations à risque via un moteur d'inférence
- **Démontrer** la conformité lors d'inspections via des scénarios guidés

### Caractéristiques techniques

| Aspect | Détail |
|--------|--------|
| **Framework** | Tauri 2.0 (Rust + WebView) |
| **Frontend** | React 19 + TypeScript 5.9 |
| **Graphe** | Sigma.js v3 (WebGL, 60fps avec 10k+ nœuds) |
| **Base de données** | Kuzu WASM (graphe embarqué) |
| **Déploiement** | 100% offline, standalone |
| **Plateformes** | Windows, macOS, Linux |

---

## Installation

### Prérequis

- Node.js 18+
- Rust (pour le build Tauri)
- Dépendances système Tauri :

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libayatana-appindicator3-dev librsvg2-dev

# macOS
xcode-select --install

# Windows
# Installer Visual Studio Build Tools avec "C++ build tools"
```

### Installation des dépendances

```bash
cd app
npm install
```

### Lancement en développement

```bash
# Mode web uniquement
npm run dev

# Mode desktop Tauri
npm run tauri:dev
```

---

## Fonctionnalités

### Visualisation du graphe

- **16 types de nœuds** : Sous-traitants, Études, Audits, Findings, KQI, etc.
- **26 types de relations** : Contrats, sous-traitance N1/N2, audits, etc.
- **3 layouts** : Force-directed (ForceAtlas2), Hiérarchique, Radial
- **Interactions** : Zoom, pan, sélection, drill-down, highlight

### Timeline interactive

- Visualisation chronologique des événements
- Synchronisation bidirectionnelle avec le graphe
- Zoom temporel multi-échelles

### Dashboard KQI

- Graphiques d'évolution des indicateurs
- Jauges avec seuils d'alerte
- Comparaison multi-sous-traitants
- Export CSV

### Moteur d'inférence

- 7 règles métier automatiques
- Alertes par niveau (HAUTE, MOYENNE, BASSE)
- Navigation contextuelle vers les éléments concernés

### Scénarios guidés

- 4 scénarios prédéfinis pour les inspections
- Navigation étape par étape
- Highlight automatique des nœuds

---

## Guide d'utilisation

### Navigation dans le graphe

| Action | Résultat |
|--------|----------|
| **Clic** sur un nœud | Sélection et affichage des détails |
| **Double-clic** sur un nœud | Mode focus (drill-down sur les voisins) |
| **Survol** d'un nœud | Highlight des connexions directes |
| **Molette** | Zoom avant/arrière |
| **Glisser** | Déplacement de la vue |

### Raccourcis clavier

| Touche | Action |
|--------|--------|
| `?` | Afficher l'aide des raccourcis |
| `F` | Mode plein écran |
| `Échap` | Fermer les panneaux / Annuler |
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` | Rétablir |

---

## Filtres

### Filtre par type de nœud

Les 16 types de nœuds sont organisés en 6 catégories :

- **Acteurs** : Sous-Traitant, Étude Clinique
- **Documents** : Contrat, Accord Qualité
- **Qualité** : Audit, Inspection, Finding, Événement Qualité
- **Décisions & Risques** : Décision, Évaluation Risque, Réunion Qualité
- **Alertes & Événements** : Alerte, Événement
- **Contexte** : Domaine de Service, Contexte Réglementaire, KQI

### Filtre par criticité

4 niveaux de criticité avec code couleur :

| Criticité | Couleur | Description |
|-----------|---------|-------------|
| **Critique** | Rouge | Impact majeur, action immédiate requise |
| **Majeur** | Orange | Impact significatif, action prioritaire |
| **Standard** | Bleu | Impact modéré, traitement normal |
| **Mineur** | Gris | Impact faible, traitement différé |

### Filtre par statut

5 catégories de statuts normalisées :

| Catégorie | Couleur | Statuts inclus |
|-----------|---------|----------------|
| **Actif** | Vert | Actif, Active, Signé, Applicable, Approuvé, Déclaré |
| **En cours** | Bleu | En cours, En démarrage, En évaluation, En révision, En réévaluation, Sous surveillance, Non évalué |
| **Planifié** | Violet | Planifié, Planifiée |
| **Clôturé** | Gris | Clôturé, Résolue, Réalisé, Appliquée |
| **Archivé** | Gris foncé | Archivé |

#### Utilisation des filtres de statut

1. Dans le panneau de filtres à gauche, repérez la section **Statut**
2. Cliquez sur les boutons pour activer/désactiver chaque catégorie
3. Les nœuds sont filtrés en temps réel
4. Utilisez **Réinitialiser les filtres** pour tout réafficher

### Filtre par date

- Sélectionnez une plage de dates pour filtrer les éléments
- Les nœuds sans date sont toujours affichés

### Recherche textuelle

- Recherche dans les identifiants, noms et descriptions
- Insensible à la casse
- Résultats en temps réel

---

## Auto-updater

### Fonctionnement

L'application vérifie automatiquement les mises à jour :
- Au démarrage (après 5 secondes)
- Toutes les heures en arrière-plan

### Notifications

Lorsqu'une mise à jour est disponible :

1. **Bannière de notification** apparaît en haut à droite
2. Affiche la version actuelle et la nouvelle version
3. Deux options :
   - **Installer maintenant** : Télécharge et installe automatiquement
   - **Plus tard** : Ferme la notification (rappel à la prochaine vérification)

### États de mise à jour

| État | Affichage |
|------|-----------|
| Vérification | - |
| Mise à jour disponible | Bannière violette avec boutons |
| Téléchargement | Barre de progression |
| Installation | Message "Redémarrage en cours..." |
| À jour | Message vert temporaire |
| Erreur | Message rouge avec détails |

### Mode navigateur

L'auto-updater est automatiquement désactivé en mode navigateur (développement web). Il ne fonctionne que dans l'application Tauri packagée.

---

## Configuration

### Configuration de l'auto-updater

Pour activer les mises à jour automatiques en production, configurez `src-tauri/tauri.conf.json` :

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "pubkey": "VOTRE_CLE_PUBLIQUE",
      "endpoints": [
        "https://github.com/VOTRE_USERNAME/kg-oversight/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

### Génération des clés de signature

```bash
# Générer une paire de clés
npm run tauri signer generate -- -w ~/.tauri/kg-oversight.key

# La clé publique sera affichée, copiez-la dans pubkey
```

### Format du fichier latest.json

Créez ce fichier dans vos releases GitHub :

```json
{
  "version": "1.1.0",
  "notes": "Description des changements",
  "pub_date": "2025-11-30T12:00:00Z",
  "platforms": {
    "linux-x86_64": {
      "signature": "SIGNATURE_BASE64",
      "url": "https://github.com/.../kg-oversight_1.1.0_amd64.AppImage.tar.gz"
    },
    "darwin-x86_64": {
      "signature": "SIGNATURE_BASE64",
      "url": "https://github.com/.../kg-oversight_1.1.0_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "SIGNATURE_BASE64",
      "url": "https://github.com/.../kg-oversight_1.1.0_aarch64.app.tar.gz"
    },
    "windows-x86_64": {
      "signature": "SIGNATURE_BASE64",
      "url": "https://github.com/.../kg-oversight_1.1.0_x64-setup.nsis.zip"
    }
  }
}
```

---

## Développement

### Structure du projet

```
app/
├── src/
│   ├── features/           # Modules fonctionnels
│   │   ├── graph/          # Visualisation Sigma.js
│   │   ├── timeline/       # Timeline vis-timeline
│   │   ├── kqi/            # Panneau KQI
│   │   ├── dashboard/      # Dashboard ECharts
│   │   ├── inference/      # Moteur de règles
│   │   ├── scenarios/      # Scénarios guidés
│   │   └── import/         # Import CSV/Excel
│   ├── shared/             # Code partagé
│   │   ├── stores/         # Atomes Jotai
│   │   ├── hooks/          # Hooks React
│   │   ├── components/     # Composants UI
│   │   └── utils/          # Utilitaires
│   ├── data/               # Couche données
│   │   ├── types/          # Types TypeScript
│   │   └── database/       # Service Kuzu
│   └── components/         # Layout global
├── src-tauri/              # Backend Rust
└── public/data/            # Données CSV
```

### Scripts npm

```bash
npm run dev           # Serveur de développement Vite
npm run build         # Build de production
npm run typecheck     # Vérification TypeScript
npm run lint          # Linting Biome

npm run tauri:dev     # Développement Tauri
npm run tauri:build   # Build Tauri (toutes plateformes)
```

### Ajout d'un nouveau type de nœud

1. Ajouter le type dans `src/data/types/entities.ts`
2. Ajouter la couleur dans `src/shared/utils/nodeStyles.ts`
3. Ajouter le label dans `NODE_LABELS`
4. Ajouter la catégorie dans `FilterPanel.tsx`

### Ajout d'une règle d'inférence

1. Définir la règle dans `src/features/inference/rules/ruleDefinitions.ts`
2. Implémenter la logique dans `src/features/inference/services/ruleEngine.ts`

---

## Build et Distribution

### Build multi-plateforme

```bash
# Toutes les plateformes (sur la plateforme actuelle)
npm run tauri:build

# Plateformes spécifiques
npm run tauri:build:linux
npm run tauri:build:windows
npm run tauri:build:macos
npm run tauri:build:macos-arm
```

### Artefacts générés

| Plateforme | Format | Emplacement |
|------------|--------|-------------|
| Windows | NSIS installer (.exe) | `src-tauri/target/release/bundle/nsis/` |
| macOS | DMG | `src-tauri/target/release/bundle/dmg/` |
| Linux | AppImage | `src-tauri/target/release/bundle/appimage/` |
| Linux | DEB | `src-tauri/target/release/bundle/deb/` |

### CI/CD GitHub Actions

Le workflow `.github/workflows/build.yml` automatise :
- Build sur les 3 plateformes
- Génération des installers
- Upload des artefacts

---

## Licence

Projet propriétaire - Tous droits réservés.

---

*Documentation mise à jour le 30 novembre 2025*
