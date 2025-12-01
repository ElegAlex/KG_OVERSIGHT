# Mises à jour automatiques - KG-Oversight

Ce document décrit le système de mises à jour automatiques de l'application KG-Oversight basé sur le plugin Tauri Updater.

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Application   │────▶│  GitHub Releases     │────▶│  latest.json    │
│   (vérifie)     │     │  (héberge)           │     │  (métadonnées)  │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Binaires signés     │
                        │  (.msi, .dmg, .deb)  │
                        └──────────────────────┘
```

## Fonctionnement

1. **Vérification** : L'app vérifie `https://github.com/ElegAlex/KG_OVERSIGHT/releases/latest/download/latest.json`
2. **Comparaison** : Si une nouvelle version existe, une notification apparaît
3. **Téléchargement** : L'utilisateur peut télécharger et installer la mise à jour
4. **Vérification de signature** : Le binaire est vérifié avec la clé publique avant installation

## Clés de signature

### Clé publique (dans `tauri.conf.json`)

```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEJBRkY1ODVGRjFBRUM4RTgKUldUb3lLN3hYMWovdWoyd1dqNDBKMS9LN2N6MWFMYjc3aUxGaHh0aUdWaE56SFBTWHBDdVdCNHEK
```

### Clé privée

**ATTENTION** : La clé privée ne doit JAMAIS être commitée dans le repo.

Emplacement local : `~/.tauri/kg-oversight.key`

### Secrets GitHub Actions

Les secrets suivants doivent être configurés dans GitHub :
- **Settings** > **Secrets and variables** > **Actions**

| Secret | Description |
|--------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Contenu de `~/.tauri/kg-oversight.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Mot de passe de la clé privée |

## Régénérer les clés

Si les clés sont perdues ou compromises :

```bash
# Générer une nouvelle paire de clés
npx tauri signer generate -w ~/.tauri/kg-oversight.key -p "NOUVEAU_MOT_DE_PASSE"

# Afficher la clé publique
cat ~/.tauri/kg-oversight.key.pub
```

Ensuite :
1. Mettre à jour `pubkey` dans `app/src-tauri/tauri.conf.json`
2. Mettre à jour les secrets GitHub
3. Publier une nouvelle release

**IMPORTANT** : Les anciennes versions ne pourront plus se mettre à jour vers les nouvelles si la clé change.

## Créer une release

1. Mettre à jour la version dans :
   - `app/package.json`
   - `app/src-tauri/tauri.conf.json`

2. Commit et tag :
   ```bash
   git commit -am "chore: bump version to X.Y.Z"
   git tag vX.Y.Z
   git push origin main --tags
   ```

3. Le workflow GitHub Actions se déclenche automatiquement et :
   - Build les 3 plateformes (Linux, macOS, Windows)
   - Signe les binaires
   - Génère `latest.json`
   - Publie la release

## Structure de latest.json

Le fichier `latest.json` est généré automatiquement par `tauri-action` :

```json
{
  "version": "1.0.3",
  "notes": "Release notes...",
  "pub_date": "2025-12-01T12:00:00Z",
  "platforms": {
    "linux-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../KG-Oversight_1.0.3_amd64.AppImage.tar.gz"
    },
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../KG-Oversight.app.tar.gz"
    },
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../KG-Oversight_1.0.3_x64-setup.nsis.zip"
    }
  }
}
```

## Dépannage

### L'application ne détecte pas les mises à jour

1. Vérifier que `latest.json` existe dans la dernière release
2. Vérifier que la version dans `latest.json` est supérieure à la version installée
3. Vérifier les logs dans la console de l'app (`Ctrl+Shift+I`)

### Erreur de signature

1. Vérifier que les secrets GitHub sont corrects
2. Vérifier que la `pubkey` dans `tauri.conf.json` correspond à la clé privée utilisée

### Mode développement

En mode développement (`npm run tauri dev`), les mises à jour sont désactivées pour éviter les erreurs de connexion au serveur de mise à jour.

## Sécurité

- La clé privée doit être gardée en lieu sûr
- Ne jamais commiter la clé privée ou le mot de passe
- Utiliser un mot de passe fort pour la clé
- Les secrets GitHub sont chiffrés et jamais exposés dans les logs
