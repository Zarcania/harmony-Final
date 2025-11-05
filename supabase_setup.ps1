# Supabase local setup (sans Docker): PostgreSQL clients + PATH + vérifs
# Usage: Exécuter dans une console PowerShell (Run with PowerShell)
#       powershell -ExecutionPolicy Bypass -File .\supabase_setup.ps1

# 1) Préparation session
$ErrorActionPreference = 'Stop'
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force | Out-Null

function Write-Ok($msg) { Write-Host "[✅] $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "[❌] $msg" -ForegroundColor Red }
function Test-CommandExists($name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }

try {
  Write-Host "== Vérifications initiales ==" -ForegroundColor Cyan
  $supabaseOk = Test-CommandExists 'supabase'
  if ($supabaseOk) { Write-Ok "Supabase CLI détecté: $(supabase --version)" } else { Write-Fail "Supabase CLI introuvable (installez-le avant)" }

  $pgDumpOk = Test-CommandExists 'pg_dump'
  $psqlOk   = Test-CommandExists 'psql'
  if ($pgDumpOk -and $psqlOk) {
    Write-Ok "PostgreSQL clients déjà installés: pg_dump=$(pg_dump --version); psql=$(psql --version)"
  } else {
    Write-Host "== Installation des utilitaires PostgreSQL via Scoop (no admin) ==" -ForegroundColor Cyan
    $scoopOk = Test-CommandExists 'scoop'
    if (-not $scoopOk) {
      Write-Host "Installation de Scoop..." -ForegroundColor Yellow
      Invoke-WebRequest -UseBasicParsing -Uri "https://get.scoop.sh" | Invoke-Expression
    }
    scoop install postgresql
  }

  # 2) PATH (session + utilisateur)
  Write-Host "== Configuration du PATH ==" -ForegroundColor Cyan
  $pgBinCandidates = @()
  $pgBinCandidates += Join-Path $env:USERPROFILE 'scoop/apps/postgresql/current/bin'
  $pgBinCandidates += 'C:\Program Files\PostgreSQL\16\bin'
  $pgBinCandidates += 'C:\Program Files\PostgreSQL\15\bin'
  $pgBinCandidates += 'C:\Program Files\PostgreSQL\14\bin'

  $pgBin = $pgBinCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($pgBin) {
    if (-not ($env:Path -split ';' | Where-Object { $_ -ieq $pgBin })) {
      $env:Path = "$pgBin;" + $env:Path
      Write-Ok "PATH (session) mis à jour: $pgBin"
    } else {
      Write-Ok "PATH (session) déjà contient: $pgBin"
    }
    $userPath = [Environment]::GetEnvironmentVariable('Path','User')
    if (-not ($userPath -split ';' | Where-Object { $_ -ieq $pgBin })) {
      [Environment]::SetEnvironmentVariable('Path', "$pgBin;" + $userPath, 'User')
      Write-Ok "PATH (utilisateur) mis à jour de façon persistante"
    } else {
      Write-Ok "PATH (utilisateur) déjà contient le binaire"
    }
  } else {
    Write-Fail "Répertoire bin PostgreSQL introuvable (Scoop/Chocolatey)."
  }

  # 3) Vérifications finales
  Write-Host "== Vérifications finales ==" -ForegroundColor Cyan
  if (Test-CommandExists 'pg_dump') { Write-Ok "pg_dump: $(pg_dump --version)" } else { Write-Fail "pg_dump introuvable" }
  if (Test-CommandExists 'psql')   { Write-Ok "psql: $(psql --version)" } else { Write-Fail "psql introuvable" }
  if (Test-CommandExists 'supabase') { Write-Ok "supabase: $(supabase --version)" } else { Write-Fail "supabase introuvable" }

  Write-Host "== Terminé ==" -ForegroundColor Cyan
}
catch {
  Write-Fail $_.Exception.Message
  exit 1
}
