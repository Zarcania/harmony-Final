# Déploiement sur o2switch — mode express (PowerShell)

Ce guide fournit des commandes « copier/coller » pour produire un paquet prêt à mettre en ligne sur o2switch, puis détaille deux scénarios de déploiement (FTPS et Git).

Prérequis:
- Windows + PowerShell (par défaut sur votre machine)
- Node.js installé (npm disponible)
- Projet à la racine du repo (là où se trouve `package.json`)

Variables Vite (si utilisées au build):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_PUBLIC_SITE_URL (ex: https://harmoniecils.com)

---

## Mode express — commandes à coller dans PowerShell

Collez ces blocs dans un terminal PowerShell ouvert à la racine du projet.

1) (Optionnel) Créer/mettre à jour `.env.production` pour le build

```powershell
$envContent = @"
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
VITE_PUBLIC_SITE_URL=https://harmoniecils.com
"@
$envContent | Set-Content -Path ".\.env.production" -Encoding UTF8
Get-Content .\.env.production
```

2) Installer et builder

```powershell
npm ci ; npm run build
```

3) Générer `.htaccess` dans `dist/` (SPA + cache assets)

```powershell
$ht = @'
# Force HTTPS (optionnel si géré ailleurs)
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache long pour assets fingerprintés (Vite)
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$">
  <IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
  </IfModule>
  <IfModule mod_headers.c>
    Header set Cache-Control "public, max-age=31536000, immutable"
  </IfModule>
  <IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/css application/javascript application/json image/svg+xml
  </IfModule>
</FilesMatch>

# Désactive le cache pour index.html (toujours frais)
<Files "index.html">
  <IfModule mod_expires.c>
    ExpiresActive Off
  </IfModule>
  <IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
  </IfModule>
</Files>

# SPA fallback (toutes les routes → index.html)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
'@

$ht | Set-Content -Path ".\dist\.htaccess" -Encoding ASCII
Get-Content .\dist\.htaccess | Select-Object -First 20
```

4) Packager en `dist.zip`

```powershell
Remove-Item .\dist.zip -Force -ErrorAction SilentlyContinue ; Compress-Archive -Path ".\dist\*" -DestinationPath ".\dist.zip" -Force
Get-Item .\dist.zip | Select-Object Name, Length, LastWriteTime
Get-FileHash .\dist.zip -Algorithm SHA256
```

5) Contrôles rapides (optionnel)

```powershell
# Chercher rapidement des motifs sensibles (exemples)
Select-String -Path .\dist\assets\*.js -Pattern "eyJhbGci|supabase\.co|AKIA" -SimpleMatch | Select-Object -First 20

# Lister les plus gros fichiers
Get-ChildItem .\dist -Recurse | Sort-Object Length -Descending | Select-Object -First 20 FullName, Length
```

6) Ouvrir l’explorateur (optionnel)

```powershell
Start-Process explorer ".\dist" ; $zip = Resolve-Path .\dist.zip ; Start-Process explorer "/select,`"$zip`""
```

À ce stade, vous pouvez:
- soit envoyer tout le contenu de `dist/` dans `public_html/` via FTPS,
- soit envoyer `dist.zip` et l’extraire côté serveur dans `public_html/`.

---

## A) Déploiement FTPS simple (rappel)

1) Construire en local (voir « Mode express »)
2) Uploader le contenu de `dist/` vers `public_html/` en FTPS (FileZilla/WinSCP)
3) Vérifier que `.htaccess` est bien à la racine de `public_html/`
4) Purger le cache serveur si activé (cPanel/Cache Manager/CDN)

---

## B) Déploiement via Git (hook post-receive)

Pré-requis: accès SSH o2switch + dépôt bare dans le home.

1) Créer un dépôt bare sur le serveur (SSH)

```bash
mkdir -p ~/repos/harmonie.git
cd ~/repos/harmonie.git
git init --bare
```

2) Hook `post-receive`

Créez `~/repos/harmonie.git/hooks/post-receive` (puis `chmod +x`) avec:

```bash
#!/bin/bash
set -euo pipefail

BRANCH="main"
WORKTREE_DIR="$HOME/deploy/harmonie-worktree"
WEBROOT="$HOME/public_html"
REPO_DIR="$HOME/repos/harmonie.git"

read oldrev newrev refname
branch="${refname##*/}"
[ "$branch" != "$BRANCH" ] && exit 0

mkdir -p "$WORKTREE_DIR"
if [ ! -d "$WORKTREE_DIR/.git" ]; then
  git --work-tree="$WORKTREE_DIR" --git-dir="$REPO_DIR" checkout -f "$BRANCH"
else
  git --work-tree="$WORKTREE_DIR" --git-dir="$REPO_DIR" fetch --all --prune
  git --work-tree="$WORKTREE_DIR" --git-dir="$REPO_DIR" reset --hard "$newrev"
fi

cd "$WORKTREE_DIR"

if [ -f .env.production ]; then
  export $(grep -E '^[A-Z0-9_]+=' .env.production | xargs)
fi

/usr/local/bin/npm ci
/usr/local/bin/npm run build

rsync -ah --delete "dist/" "$WEBROOT/"

echo "[post-receive] Déploiement terminé sur $WEBROOT"
```

Notes:
- Adaptez les chemins Node/npm (`which node`, `which npm`), selon votre configuration o2switch.
- Placez vos variables `VITE_*` dans `.env.production` au niveau du worktree pour que `npm run build` les lise.

3) Ajouter le remote et pousser depuis votre machine

```powershell
git remote add o2switch "ssh://<USER>@<HOST>:22/~/repos/harmonie.git"
git push o2switch main
```

---

## Purge de cache navigateur

- Hard refresh: Ctrl+F5 (Windows) ou Cmd+Shift+R (macOS)
- Vider le cache du site via les outils du navigateur
- Dans DevTools, onglet Réseau → « Désactiver le cache » pendant le rechargement

Snippet (à coller dans la console) pour invalider Service Workers et caches:

```js
if ('serviceWorker' in navigator) {
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) { try { await r.unregister(); } catch {} }
}
if (caches?.keys) {
  const keys = await caches.keys();
  for (const k of keys) { try { await caches.delete(k); } catch {} }
}
location.reload(true);
```

---

## Checklist de tests post‑déploiement

- Page d’accueil sans erreurs (F12 → Console OK)
- Assets `.js/.css/images` en 200 et fingerprintés
- Routes SPA accessibles en accès direct (ex: /prestations, /portfolio)
- Réservation anonyme: création OK, toasts affichés
- Annulation de réservation (Edge Function): réponse OK, CORS correct
- Supabase REST (services): 200 avec données
- RLS: comportements attendus (session/admin)
- CDN/Proxy: purge et propagation vérifiées

---

## Dépannage rapide

- 404 sur routes SPA: vérifier la règle de fallback dans `.htaccess`
- 500/Build serveur: Node/npm absents ou incompatibles; vérifier `node -v`, `npm -v`
- Variables VITE manquantes: `.env.production` non présent au moment du build
- CORS Edge Function: en-tête Origin autorisé, Authorization = anon key
- Assets en cache: forcer le refresh (voir section Purge)

# Déploiement sur o2switch (hébergement mutualisé)

Ce guide propose deux approches pour mettre en ligne le site buildé par Vite sur un hébergement o2switch.

Prérequis communs:
- Node.js 18+ localement (pour construire le site)
- Accès cPanel o2switch (FTPS, gestion des fichiers, SSH si activé)
- Domaine pointant vers l’hébergement (ex: harmoniecils.com)
- Variables d’environnement Vite disponibles lors du build si nécessaire

Variables Vite utilisées au build (si votre code les lit côté client):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_PUBLIC_SITE_URL (ex: https://harmoniecils.com)

Vous pouvez les définir dans un fichier `.env.production` (non versionné) avant `npm run build`.

---

## A) Déploiement FTPS simple

1) Construire en local

```powershell
npm ci
npm run build
```

2) Uploader le contenu de `dist/` dans `public_html/`
- Connectez-vous en FTPS (FileZilla, WinSCP, Cyberduck)
- Côté local: dossier `dist/`
- Côté distant: `public_html/`
- Transférez tout le contenu de `dist/` (les fichiers et sous-dossiers) directement dans `public_html/`

3) Ajouter le fichier `.htaccess` (à la racine de `public_html/`)

Utilisez ce `.htaccess` pour une SPA React buildée avec Vite (history fallback vers `index.html`) et cache statique agressif pour les assets fingerprintés:

```
# Force HTTPS (optionnel si géré ailleurs)
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache long pour assets fingerprintés (Vite)
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$">
  <IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
  </IfModule>
  <IfModule mod_headers.c>
    Header set Cache-Control "public, max-age=31536000, immutable"
  </IfModule>
</FilesMatch>

# Désactive le cache pour index.html (toujours frais)
<Files "index.html">
  <IfModule mod_expires.c>
    ExpiresActive Off
  </IfModule>
  <IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
  </IfModule>
</Files>

# SPA fallback (toutes les routes → index.html)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

4) Purger caches côté serveur (optionnel)
- Dans cPanel, si vous utilisez un cache (Cache Manager, CDN), purge/vider après upload
- Vous pouvez aussi renommer des assets si nécessaire (Vite gère déjà le fingerprint)

5) Purge de cache navigateur (commande JS à exécuter dans la console)

Ouvrez DevTools sur votre site et exécutez ceci pour invalider les Service Workers et demander un rechargement complet:

```js
// Purge SW + cache statique
if ('serviceWorker' in navigator) {
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) { try { await r.unregister(); } catch {} }
}
if (caches?.keys) {
  const keys = await caches.keys();
  for (const k of keys) { try { await caches.delete(k); } catch {} }
}
location.reload(true);
```

---

## B) Déploiement via Git (hook post-receive)

Pré-requis: accès SSH activé par o2switch et dépôt bare dans le home.

Vue d’ensemble:
- Vous poussez sur la branche `main` d’un dépôt bare côté serveur
- Un hook `post-receive` build le site et synchronise `dist/` vers `public_html/`

1) Créer un dépôt bare sur le serveur (SSH)

```bash
mkdir -p ~/repos/harmonie.git
cd ~/repos/harmonie.git
git init --bare
```

2) Configurer le hook `post-receive`

Créez `~/repos/harmonie.git/hooks/post-receive` avec ce contenu, puis rendez-le exécutable (`chmod +x`):

```bash
#!/bin/bash
set -euo pipefail

BRANCH="main"
WORKTREE_DIR="$HOME/deploy/harmonie-worktree"
WEBROOT="$HOME/public_html"
REPO_DIR="$HOME/repos/harmonie.git"

# Lire la ref poussée
read oldrev newrev refname
branch="${refname##*/}"
[ "$branch" != "$BRANCH" ] && exit 0

# Préparer worktree
mkdir -p "$WORKTREE_DIR"
if [ ! -d "$WORKTREE_DIR/.git" ]; then
  git --work-tree="$WORKTREE_DIR" --git-dir="$REPO_DIR" checkout -f "$BRANCH"
else
  git --work-tree="$WORKTREE_DIR" --git-dir="$REPO_DIR" fetch --all --prune
  git --work-tree="$WORKTREE_DIR" --git-dir="$REPO_DIR" reset --hard "$newrev"
fi

cd "$WORKTREE_DIR"

# Charger variables de build si présentes
if [ -f .env.production ]; then
  export $(grep -E '^[A-Z0-9_]+=' .env.production | xargs)
fi

# Build
/usr/local/bin/npm ci
/usr/local/bin/npm run build

# Synchroniser dist → public_html
rsync -ah --delete "dist/" "$WEBROOT/"

# Facultatif: toucher index.html pour invalider certains caches
# touch "$WEBROOT/index.html"

echo "[post-receive] Déploiement terminé sur $WEBROOT"
```

Notes:
- Adaptez les chemins Node/npm si nécessaire (`which node`, `which npm`). Sur o2switch, Node peut être installé via cPanel/Setup Node.js ou disponible via nvm.
- Placez vos variables Vite (VITE_*) dans `.env.production` au niveau du worktree pour que `npm run build` les lise.
- Si vous utilisez PNPM/Yarn, remplacez les commandes npm par l’équivalent.

3) Ajouter le remote et pousser depuis votre machine

```powershell
# Dans votre dépôt local
git remote add o2switch "ssh://<USER>@<HOST>:22/~/repos/harmonie.git"
# Première fois: pousser l’historique
git push o2switch main
```

4) Vérifier que les fichiers arrivent dans `public_html/`
- `index.html` à la racine
- `assets/` avec fichiers fingerprintés
- `.htaccess` présent et pris en compte

---

## Purge de cache navigateur (utilisateur final)

À communiquer aux utilisateurs en cas de problème d’affichage après une mise à jour:
- Hard refresh: Ctrl+F5 (Windows) ou Cmd+Shift+R (macOS)
- Vider le cache du site via les outils du navigateur
- Ouvrir l’onglet Réseau et cocher « Désactiver le cache » pendant le rechargement

Option programmatique (dans la console): voir script dans la section FTPS.

---

## Checklist de tests post‑déploiement

- Page d’accueil charge sans erreur (F12 → Console vide d’erreurs)
- Les assets (`.js`, `.css`, images) chargent avec 200 et sont bien fingerprintés
- Navigation client-side (SPA) fonctionne sur les routes profondes (ex: /prestations, /portfolio) y compris accès direct via URL
- Formulaire de réservation: création anonyme OK, toasts affichés sur succès/erreur
- Annulation de réservation: endpoint Edge Function répond, CORS correct
- Appels Supabase REST (services) renvoient des données (200)
- Vérifier les comportements RLS attendus (sélectivité selon session/admin)
- Si un CDN/proxy est utilisé, purger et vérifier la propagation

---

## Dépannage rapide

- 404 sur routes SPA: vérifiez la règle de fallback dans `.htaccess`
- 500/Build échoue sur serveur: Node/npm non installés ou versions incompatibles; vérifier `node -v`, `npm -v`
- Variables VITE manquantes: `.env.production` non présent au moment du build
- CORS Edge Function: vérifiez l’en-tête Origin autorisé côté fonction et que l’Authorization est bien l’anon key
- Assets vieux en cache: forcer le refresh (voir section Purge)
