# Build et zip du front (Vite) sans exposer de secrets
# Usage:
#   1) Ouvre PowerShell dans le dossier du projet (harmony-Final-main)
#   2) Exécute:  .\build_dist.ps1
#   3) Le script:
#      - charge .env.local (si présent) pour VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
#      - sinon te les demande à l'écran (non sauvegardé)
#      - installe les dépendances si besoin
#      - lance npm run build
#      - crée dist.zip prêt à être uploadé dans cPanel (dossier du domaine)

param(
    [switch]$ForceInstall # force npm ci même si node_modules existe
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERR]  $msg" -ForegroundColor Red }

# 1) Se placer à la racine du script
$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $here
Write-Info "Dossier courant: $(Get-Location)"

# 2) Charger .env.local si présent
$dotenvPath = Join-Path $here ".env.local"
if (Test-Path $dotenvPath) {
    Write-Info ".env.local détecté → chargement des variables VITE_*"
    Get-Content $dotenvPath | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return }
        $idx = $line.IndexOf('=')
        if ($idx -lt 1) { return }
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
        if ($key -match '^(VITE_|NEXT_PUBLIC_)') {
            # Définit la variable d'environnement pour le processus courant
            [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
        }
    }
} else {
    Write-Warn ".env.local introuvable. Saisie interactive des variables nécessaires au build."
}

# 3) Vérifier / demander VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (non persisté)
if (-not $env:VITE_SUPABASE_URL) {
    $env:VITE_SUPABASE_URL = Read-Host "VITE_SUPABASE_URL (ex: https://cbelpqfkxvxwrrbxiyww.supabase.co)"
}
if (-not $env:VITE_SUPABASE_ANON_KEY) {
    $env:VITE_SUPABASE_ANON_KEY = Read-Host "VITE_SUPABASE_ANON_KEY (clé anon)"
}

if (-not $env:VITE_SUPABASE_URL -or -not $env:VITE_SUPABASE_ANON_KEY) {
    Write-Err "Variables VITE_* manquantes. Abandon."
    exit 1
}

Write-Ok "Variables chargées pour ce build. Elles ne seront pas stockées dans des fichiers."

# 4) Installer dépendances si nécessaire
$nodeModules = Join-Path $here "node_modules"
if ($ForceInstall -or -not (Test-Path $nodeModules)) {
    Write-Info "Installation des dépendances (npm ci)"
    npm ci
} else {
    Write-Info "Dépendances détectées → skip npm ci (utilise -ForceInstall pour forcer)"
}

# 5) Build
Write-Info "Lancement du build Vite (npm run build)"
npm run build

# 6) Zip dist → dist.zip
$dist = Join-Path $here "dist"
if (-not (Test-Path $dist)) {
    Write-Err "Dossier dist introuvable après build."
    exit 1
}

$zipPath = Join-Path $here "dist.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Write-Info "Compression du dossier dist → dist.zip"
Compress-Archive -Path (Join-Path $dist '*') -DestinationPath $zipPath -Force

Write-Ok "Build terminé. Archive prête: $zipPath"
Write-Host "" 
Write-Host "Étapes suivantes (cPanel):" -ForegroundColor Cyan
Write-Host "  1) Ouvre cPanel > Gestionnaire de fichiers" -ForegroundColor Gray
Write-Host "  2) Va dans le dossier du domaine (ex: sites/harmoniecils.com)" -ForegroundColor Gray
Write-Host "  3) Bouton 'Téléverser' → envoie dist.zip" -ForegroundColor Gray
Write-Host "  4) Sélectionne dist.zip → 'Extraire' dans ce dossier" -ForegroundColor Gray
Write-Host "  5) Vérifie que index.html est bien à la racine du dossier du domaine" -ForegroundColor Gray
Write-Host "  6) Si un dossier 'dist' a été créé, déplace son CONTENU à la racine puis supprime 'dist' vide" -ForegroundColor Gray
Write-Host "  7) Assure-toi que .htaccess est présent pour les routes SPA (sinon ajoute-le)" -ForegroundColor Gray
Write-Ok   "Tu peux maintenant tester https://harmoniecils.com"