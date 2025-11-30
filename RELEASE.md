# Guide de Release - KG-Oversight

Ce document décrit comment créer une nouvelle release de l'application KG-Oversight.

## Prérequis

- Accès en écriture au repository GitHub
- Git configuré localement

## Processus de Release

### 1. Mettre à jour les versions

Modifier la version dans **deux fichiers** :

#### `app/package.json`
```json
{
  "name": "kg-oversight",
  "version": "1.0.0",  // ← Mettre à jour ici
  ...
}
```

#### `app/src-tauri/tauri.conf.json`
```json
{
  "version": "1.0.0",  // ← Mettre à jour ici
  ...
}
```

### 2. Commit des changements

```bash
git add app/package.json app/src-tauri/tauri.conf.json
git commit -m "chore: bump version to 1.0.0"
```

### 3. Créer et pousser le tag

```bash
# Créer le tag (format: v + version)
git tag v1.0.0

# Pousser le commit et le tag
git push origin main --tags
```

### 4. Vérifier le build

1. Aller sur GitHub → **Actions**
2. Le workflow "Release" se déclenche automatiquement
3. Attendre ~15-20 minutes (build sur 3 OS)
4. Vérifier que tous les jobs sont verts ✅

### 5. Publier la release

Une fois le build terminé :
1. Aller sur GitHub → **Releases**
2. La release est créée automatiquement avec tous les artifacts
3. Vérifier les fichiers générés
4. (Optionnel) Éditer les notes de release

## Artifacts Générés

| Plateforme | Fichiers | Description |
|------------|----------|-------------|
| **Linux** | `kg-oversight_X.X.X_amd64.deb` | Package Debian/Ubuntu |
| | `kg-oversight_X.X.X_amd64.AppImage` | Image portable (toutes distros) |
| **macOS** | `kg-oversight_X.X.X_x64.dmg` | Intel (x86_64) |
| | `kg-oversight_X.X.X_aarch64.dmg` | Apple Silicon (M1/M2/M3) |
| **Windows** | `kg-oversight_X.X.X_x64-setup.exe` | Installeur NSIS |
| | `kg-oversight_X.X.X_x64_en-US.msi` | Installeur MSI |

## Release Manuelle (sans tag)

Si besoin de déclencher manuellement :

1. GitHub → **Actions** → **Release**
2. Cliquer **Run workflow**
3. Entrer la version (ex: `1.0.0`)
4. Cliquer **Run workflow**

## Versioning (SemVer)

Format : `MAJOR.MINOR.PATCH`

- **MAJOR** : Changements incompatibles (breaking changes)
- **MINOR** : Nouvelles fonctionnalités (rétro-compatibles)
- **PATCH** : Corrections de bugs

Exemples :
- `1.0.0` → `1.0.1` : Bug fix
- `1.0.1` → `1.1.0` : Nouvelle fonctionnalité
- `1.1.0` → `2.0.0` : Refonte majeure

## Signature macOS (Optionnel)

Pour distribuer sur macOS sans avertissement de sécurité, configurer ces secrets GitHub :

| Secret | Description |
|--------|-------------|
| `APPLE_CERTIFICATE` | Certificat Developer ID (base64) |
| `APPLE_CERTIFICATE_PASSWORD` | Mot de passe du certificat |
| `APPLE_SIGNING_IDENTITY` | Ex: "Developer ID Application: Nom (TEAMID)" |
| `APPLE_ID` | Email du compte Apple Developer |
| `APPLE_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Team ID Apple Developer |

## Dépannage

### Le workflow échoue sur Linux
Vérifier que les dépendances webkit2gtk sont à jour dans le workflow.

### Le workflow échoue sur macOS
- Vérifier la target Rust (x86_64 vs aarch64)
- Les builds Apple Silicon nécessitent des runners récents

### Le workflow échoue sur Windows
- Vérifier que le chemin vers `src-tauri` est correct
- Les caractères spéciaux dans les chemins peuvent poser problème

### La release n'apparaît pas
- Vérifier que le tag commence par `v` (ex: `v1.0.0`)
- Vérifier les permissions du workflow (`contents: write`)

## Structure du Workflow

```
.github/workflows/release.yml
│
├── create-release      # Crée la release GitHub (draft)
│
├── build (parallèle)   # Build sur chaque plateforme
│   ├── ubuntu-22.04    # → .deb, .AppImage
│   ├── macos-latest    # → .dmg (x64 + arm64)
│   └── windows-latest  # → .exe, .msi
│
└── publish-release     # Retire le mode draft
```

## Commandes Utiles

```bash
# Voir les tags existants
git tag -l

# Supprimer un tag local
git tag -d v1.0.0

# Supprimer un tag distant
git push origin --delete v1.0.0

# Voir l'historique des versions
git log --oneline --decorate --tags

# Build local (pour test)
cd app && npm run tauri build
```
