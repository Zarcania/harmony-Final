param(
  [string]$ProjectRef = "lmpfrrkqdevxkgimvnfw"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Cli {
  if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Error "Supabase CLI introuvable. Installe: npm i -g supabase"
    exit 1
  }
}

Assert-Cli

function Test-DockerAvailable {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { return $false }
  try {
    $null = & docker info --format '{{.ServerVersion}}' 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch { return $false }
}

function Assert-PgDump {
  $cmd = Get-Command pg_dump -ErrorAction SilentlyContinue
  return [bool]$cmd
}

function Get-DbConnection {
  param(
    [string]$ProjectRef,
    [string]$DbUrl
  )
  $conn = [ordered]@{}
  if ($DbUrl) {
    try {
      $uri = [Uri]$DbUrl
      $conn['host'] = $uri.Host
      $conn['port'] = if ($uri.Port -gt 0) { $uri.Port } else { 6543 }
      $conn['db']   = $uri.AbsolutePath.TrimStart('/')
      $userInfo = $uri.UserInfo
      if ($userInfo) {
        $parts = $userInfo.Split(':',2)
        $conn['user'] = $parts[0]
        if ($parts.Count -ge 2) { $conn['pwd'] = $parts[1] }
      }
    } catch {
      Write-Warning "SUPABASE_DB_URL invalide. Passage au prompt interactif."
    }
  }
  if (-not $conn.Contains('host') -or [string]::IsNullOrWhiteSpace($conn['host'])) { $conn['host'] = "db.$ProjectRef.supabase.co" }
  if (-not $conn.Contains('port') -or -not $conn['port']) { $conn['port'] = 6543 }
  if (-not $conn.Contains('db')   -or [string]::IsNullOrWhiteSpace($conn['db']))   { $conn['db']   = "postgres" }
  if (-not $conn.Contains('user') -or [string]::IsNullOrWhiteSpace($conn['user'])) { $conn['user'] = "postgres" }
  if (-not $conn.Contains('pwd')  -or [string]::IsNullOrWhiteSpace($conn['pwd']))  {
    Write-Host "Connexion Postgres distante (fallback sans Docker)"
    $h = Read-Host "Host" -Default $conn['host']
    $p = Read-Host "Port" -Default $conn['port']
    $d = Read-Host "Database" -Default $conn['db']
    $u = Read-Host "User" -Default $conn['user']
    $s = Read-Host "Password" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
    try { $pw = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $conn['host'] = $h; $conn['port'] = [int]$p; $conn['db'] = $d; $conn['user'] = $u; $conn['pwd'] = $pw
  }
  return [pscustomobject]@{ host=$conn['host']; port=[int]$conn['port']; db=$conn['db']; user=$conn['user']; pwd=$conn['pwd'] }
}

# Aller à la racine du repo
try {
  $scriptPath = $MyInvocation.MyCommand.Path
  $root = Split-Path -Parent $scriptPath
  $repoRoot = Split-Path $root
  if (-not $repoRoot) { $repoRoot = Get-Location }
  Set-Location $repoRoot
} catch { Set-Location (Get-Location) }

# Préparer arborescence
if (-not (Test-Path "supabase")) { New-Item -Type Directory "supabase" | Out-Null }
if (-not (Test-Path "supabase\migrations")) { New-Item -Type Directory "supabase\migrations" | Out-Null }
if (-not (Test-Path "supabase\_archive")) { New-Item -Type Directory "supabase\_archive" | Out-Null }
if (-not (Test-Path "src\types")) { New-Item -Type Directory "src\types" | Out-Null }

# Config CLI locale (assure le bon project_id)
$cfgPath = "supabase\config.toml"
# Écrire sans BOM pour éviter l'erreur "invalid character at start of key: ï"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = 'project_id = "' + $ProjectRef + '"'
[System.IO.File]::WriteAllText($cfgPath, $content, $utf8NoBom)

# Archiver anciennes migrations (non destructif)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archive = "supabase\_archive\migrations_$timestamp"
New-Item -Type Directory $archive -Force | Out-Null
Get-ChildItem "supabase\migrations" -File -ErrorAction SilentlyContinue | ForEach-Object { Move-Item $_.FullName $archive }

# Dump schema (remote -> baseline unique) - necessite Docker avec la version actuelle du CLI
$baseline = "supabase\migrations\00000000000000_baseline.sql"
$seed = "supabase\seed.sql"
$hasDocker = Test-DockerAvailable
if ($hasDocker) {
  Write-Host "Dump schema+data → $baseline"
  supabase db dump --file $baseline

  Write-Host "Dump data (public) -> $seed"
  supabase db dump --data-only --schema public --file $seed
} else {
  Write-Warning "Docker non detecte: tentative fallback pg_dump (si disponible), sinon seuls les types seront regeneres."
  if (Assert-PgDump) {
    $dbUrl = $env:SUPABASE_DB_URL
    $conn = Get-DbConnection -ProjectRef $ProjectRef -DbUrl $dbUrl
    Write-Host "pg_dump schema -> $baseline (host=$($conn.host) db=$($conn.db))"
    $env:PGPASSWORD = $conn.pwd
    & pg_dump --schema-only --no-owner --no-privileges -h $conn.host -p $conn.port -U $conn.user -d $conn.db -f $baseline
    if ($LASTEXITCODE -ne 0) { Write-Warning "pg_dump schema a echoue ($LASTEXITCODE)." }

    Write-Host "pg_dump data (public) -> $seed"
    & pg_dump --data-only --schema=public -h $conn.host -p $conn.port -U $conn.user -d $conn.db -f $seed
    if ($LASTEXITCODE -ne 0) { Write-Warning "pg_dump data a echoue ($LASTEXITCODE)." }

    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  } else {
    Write-Warning "pg_dump introuvable dans le PATH. Installez les outils PostgreSQL ou fournissez Docker."
  }
}

# Types TypeScript
$typesPath = "src\types\database.types.ts"
Write-Host "Generation types TS -> $typesPath"
supabase gen types typescript --project-id $ProjectRef --schema public | Set-Content -Encoding UTF8 $typesPath

if (-not $hasDocker) {
  # Nettoyage preventif: si des fichiers vides ont ete crees auparavant, on les supprime pour eviter toute confusion
  if ((Test-Path $baseline) -and ((Get-Item $baseline).Length -eq 0)) { Remove-Item $baseline -Force }
  if ((Test-Path $seed) -and ((Get-Item $seed).Length -eq 0)) { Remove-Item $seed -Force }
}

if (Test-Path $baseline -PathType Leaf -ErrorAction SilentlyContinue -and (Get-Item $baseline).Length -gt 0) {
  if (Test-Path $seed -PathType Leaf -ErrorAction SilentlyContinue -and (Get-Item $seed).Length -gt 0) {
    Write-Host "OK. Baseline, seed et types regeneres."
  } else {
    Write-Host "OK. Baseline et types regeneres. (Seed manquant ou vide)"
  }
} else {
  Write-Host "OK. Types regeneres uniquement. (Aucun dump schema/seed genere)"
}
