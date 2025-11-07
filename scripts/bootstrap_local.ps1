<#
.SYNOPSIS
  Bootstrap complet de l'environnement local (Windows PowerShell): Supabase Docker, secrets Functions, .env.local, et vérifications rapides.

.USAGE
  powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap_local.ps1

.PREREQUIS
  - Docker Desktop installé et démarré
  - Supabase CLI installé (supabase --version)
  - Node.js + npm installés
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Ok($m){ Write-Host "[ OK ] $m" -ForegroundColor Green }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERR ] $m" -ForegroundColor Red }

function Assert-Command($name, $hint){
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)){
    throw "$name introuvable. $hint"
  }
}

function Ensure-AtRepoRoot {
  $scriptPath = $PSCommandPath
  if (-not $scriptPath) { $scriptPath = $MyInvocation.MyCommand.Path }
  if (-not $scriptPath) { $scriptPath = (Join-Path (Get-Location) 'scripts\bootstrap_local.ps1') }
  $scriptsDir = Split-Path -Parent $scriptPath
  $repoRoot = Split-Path -Parent $scriptsDir
  if (-not $repoRoot) { $repoRoot = Get-Location }
  Set-Location $repoRoot
  return $repoRoot
}

function Start-SupabaseIfNeeded {
  Write-Info "Demarrage de la stack Supabase locale (Docker)"
  $proc = Start-Process -FilePath 'supabase' -ArgumentList @('start') -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) { Write-Warn "supabase start a retourné $($proc.ExitCode). On continue si la stack est déjà active." }
}

function Get-SupabaseStatus {
  Write-Info "Lecture des informations via 'supabase status'"
  $status = ''
  try {
    $status = (& supabase status | Out-String)
  } catch {
    $status = ''
  }
  # Essayer plusieurs formats de sortie possibles
  $apiUrl = ''
  $anon = ''
  $service = ''
  if ($status) {
    $m1 = Select-String -InputObject $status -Pattern 'API URL\s*:\s*(.+)$'
    if ($m1 -and $m1.Matches.Count -gt 0) { $apiUrl = $m1.Matches[0].Groups[1].Value.Trim() }

    $m2 = Select-String -InputObject $status -Pattern 'anon key\s*:\s*([A-Za-z0-9\._\-]+)'
    if ($m2 -and $m2.Matches.Count -gt 0) { $anon = $m2.Matches[0].Groups[1].Value.Trim() }

    $m3 = Select-String -InputObject $status -Pattern 'service_role key\s*:\s*([A-Za-z0-9\._\-]+)'
    if ($m3 -and $m3.Matches.Count -gt 0) { $service = $m3.Matches[0].Groups[1].Value.Trim() }

    # Formats alternatifs (Publishable/Secret key)
    if (-not $anon) {
      $m4 = Select-String -InputObject $status -Pattern 'Publishable key\s*:\s*([A-Za-z0-9_\.-]+)'
      if ($m4 -and $m4.Matches.Count -gt 0) { $anon = $m4.Matches[0].Groups[1].Value.Trim() }
    }
    if (-not $service) {
      $m5 = Select-String -InputObject $status -Pattern 'Secret key\s*:\s*([A-Za-z0-9_\.-]+)'
      if ($m5 -and $m5.Matches.Count -gt 0) { $service = $m5.Matches[0].Groups[1].Value.Trim() }
    }
  }
  if (-not $apiUrl) { $apiUrl = 'http://localhost:54321' }
  if (-not $anon)   { Write-Warn "Anon key non trouvee dans la sortie - vous devrez la remplir manuellement dans .env.local" }
  return [pscustomobject]@{ ApiUrl=$apiUrl; Anon=$anon; Service=$service }
}

function Write-EnvLocal([string]$apiUrl,[string]$anon,[string]$site){
  $path = Join-Path (Get-Location) '.env.local'
  $content = @()
  $content += "VITE_SUPABASE_URL=$apiUrl"
  $content += "VITE_SUPABASE_ANON_KEY=$anon"
  $content += "VITE_PUBLIC_SITE_URL=$site"
  $content += "VITE_ADMIN_EMAILS=admin@local.test"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllLines($path, $content, $utf8NoBom)
  Write-Ok ".env.local mis a jour"
}

function Configure-FunctionSecrets([string]$site){
  Write-Info "Configuration des secrets Edge Functions"
  $resend = $env:RESEND_API_KEY
  if ([string]::IsNullOrWhiteSpace($resend)){
  Write-Warn "RESEND_API_KEY non present dans l'environnement. Vous pourrez l'ajouter plus tard avec 'supabase secrets set RESEND_API_KEY=xxxx'"
  }
  $args = @('secrets','set',"PUBLIC_SITE_URL=$site","ALLOWED_ORIGINS=$site")
  if ($resend) { $args += "RESEND_API_KEY=$resend" }
  $proc = Start-Process -FilePath 'supabase' -ArgumentList $args -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) { Write-Warn "supabase secrets set a retourne $($proc.ExitCode)." } else { Write-Ok "Secrets configures" }
}

function Ensure-NodeDeps {
  if (Test-Path 'node_modules') {
    Write-Info "Dependances deja installees (node_modules present)"
    return
  }
  if (Test-Path 'package-lock.json'){
  Write-Info "Installation des dependances (npm ci)"
    $proc = Start-Process -FilePath 'npm' -ArgumentList @('ci') -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) { throw "npm ci a echoue ($($proc.ExitCode))" }
  } else {
  Write-Info "Installation des dependances (npm install)"
    $proc = Start-Process -FilePath 'npm' -ArgumentList @('install') -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) { throw "npm install a echoue ($($proc.ExitCode))" }
  }
  Write-Ok "Dependances Node installees"
}

function Quick-Checks {
  Write-Info "Typecheck"
  $proc = Start-Process -FilePath 'npm' -ArgumentList @('run','typecheck') -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) { Write-Warn "Typecheck en erreur (consultez la sortie), on continue" } else { Write-Ok "Typecheck OK" }

  Write-Info "Tests unitaires (vitest)"
  $proc2 = Start-Process -FilePath 'npm' -ArgumentList @('run','test','--','--run') -NoNewWindow -Wait -PassThru
  if ($proc2.ExitCode -ne 0) { Write-Warn "Tests en erreur (ok pour dev local), on continue" } else { Write-Ok "Tests OK" }
}

# --- Main ---
try {
  Write-Info "Verifications prealables"
  Assert-Command 'supabase' 'Installez: npm i -g supabase'; Write-Ok (supabase --version)
  Assert-Command 'docker'   'Installez Docker Desktop: https://www.docker.com/products/docker-desktop'
  Assert-Command 'npm'      'Installez Node.js LTS: https://nodejs.org/'

  $root = Ensure-AtRepoRoot
  Start-SupabaseIfNeeded
  $s = Get-SupabaseStatus
  $site = 'http://localhost:5173'
  Write-EnvLocal -apiUrl $s.ApiUrl -anon $s.Anon -site $site
  Configure-FunctionSecrets -site $site
  Ensure-NodeDeps
  Quick-Checks

  Write-Host "\n== Prochaines étapes ==" -ForegroundColor Cyan
  Write-Host "1) Lancer les Edge Functions:  supabase functions serve" -ForegroundColor Gray
  Write-Host "2) Lancer le front:          npm run dev" -ForegroundColor Gray
  Write-Host "3) Ouvrir:                   $site" -ForegroundColor Gray

  Write-Ok "Bootstrap local termine"
}
catch {
  Write-Err $_.Exception.Message
  exit 1
}
