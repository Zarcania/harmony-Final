# Build et packaging local (PowerShell)

Objectif: produire un `dist.zip` prêt à uploader en FTPS sur o2switch, avec un `.htaccess` adapté à une SPA Vite/React.

Pré-requis:
- Exécuter ces commandes dans le dossier racine du projet
- Avoir Node.js installé et `npm` disponible
- Si besoin, définir vos variables Vite dans `.env.production`

---

## 1) Installer et builder

```powershell
# Installer dépendances et builder
npm ci ; npm run build
```

Sortie attendue: un dossier `dist/` à la racine.

---

## 2) Générer .htaccess dans dist/

```powershell
# Créer le contenu .htaccess (SPA + cache)
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

# Écrire dans dist/.htaccess
$ht | Set-Content -Path ".\dist\.htaccess" -Encoding ASCII

# Vérifier
Get-Content .\dist\.htaccess | Select-Object -First 20
```

---

## 3) Packager en dist.zip

```powershell
# Nettoyer un ancien zip
Remove-Item .\dist.zip -Force -ErrorAction SilentlyContinue

# Créer l’archive
Compress-Archive -Path ".\dist\*" -DestinationPath ".\dist.zip" -Force

# Vérifier taille et hash
Get-Item .\dist.zip | Select-Object Name, Length, LastWriteTime
Get-FileHash .\dist.zip -Algorithm SHA256
```

---

## 4) Contrôles rapides

```powershell
# S’assurer qu’aucune clé sensible n’est dans les bundles (exemples de motifs)
Select-String -Path .\dist\assets\*.js -Pattern "eyJhbGci|supabase\.co|AKIA" -SimpleMatch | Select-Object -First 20

# Lister les fichiers principaux
Get-ChildItem .\dist -Recurse | Select-Object FullName, Length | Sort-Object Length -Descending | Select-Object -First 20
```

---

## 5) Ouvrir l’Explorateur au bon endroit (optionnel)

```powershell
# Ouvre un explorateur sur le dossier dist
Start-Process explorer ".\dist"

# Ouvre un explorateur et sélectionne dist.zip
$zip = Resolve-Path .\dist.zip
Start-Process explorer "/select,`"$zip`""
```

---

## 6) Upload FTPS (rappel)

- Connectez-vous à votre hébergement o2switch en FTPS
- Uploadez le contenu de `dist.zip` (décompressé) vers `public_html/`
- Le `.htaccess` doit être à la racine de `public_html/`

---

## Dépannage rapide

- 404 sur routes: vérifier `.htaccess` (règle de fallback)
- Assets pas à jour: hard refresh (Ctrl+F5) et voir purge de cache dans le guide `Deploiement-o2switch.md`
- Build échoue: vérifier versions Node/npm (`node -v`, `npm -v`) et variables Vite (`.env.production`)
