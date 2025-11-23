#!/usr/bin/env powershell

# Script de verification de l'environnement local
Write-Host "Verification de l'environnement de developpement local" -ForegroundColor Green

# Verification de Supabase local  
Write-Host "`nEtat de Supabase local:" -ForegroundColor Cyan
supabase status
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Supabase local n'est pas demarre" -ForegroundColor Red
    Write-Host "   -> Lancez 'supabase start' pour le demarrer" -ForegroundColor Yellow
    exit 1
}

# Verification des fichiers de configuration
Write-Host "`nFichiers de configuration:" -ForegroundColor Cyan
if (Test-Path ".env.local") {
    Write-Host "OK: .env.local present" -ForegroundColor Green
} else {
    Write-Host "ERREUR: .env.local manquant" -ForegroundColor Red
}

if (Test-Path ".env.production") {
    Write-Host "OK: .env.production present" -ForegroundColor Green
} else {
    Write-Host "INFO: .env.production manquant (optionnel)" -ForegroundColor Yellow
}

# Verification des scripts
Write-Host "`nScripts disponibles:" -ForegroundColor Cyan
$scripts = @("dev-local.ps1", "sync-from-prod.ps1", "reset-local.ps1", "stop-local.ps1")
foreach ($script in $scripts) {
    if (Test-Path "scripts/$script") {
        Write-Host "OK: scripts/$script" -ForegroundColor Green
    } else {
        Write-Host "ERREUR: scripts/$script manquant" -ForegroundColor Red
    }
}

# Instructions finales
Write-Host "`nPour commencer le developpement:" -ForegroundColor Cyan
Write-Host "   npm run dev:local" -ForegroundColor White

Write-Host "`nURLs importantes:" -ForegroundColor Cyan
Write-Host "   Application: http://localhost:5173" -ForegroundColor White
Write-Host "   Supabase Studio: http://127.0.0.1:54323" -ForegroundColor White
Write-Host "   Mailpit (emails): http://127.0.0.1:54324" -ForegroundColor White

Write-Host "`nEnvironnement local pret !" -ForegroundColor Green