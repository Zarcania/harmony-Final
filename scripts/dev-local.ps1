#!/usr/bin/env powershell

# Script pour demarrer l'environnement de developpement local
Write-Host "Demarrage de l'environnement de developpement local Harmony Cils" -ForegroundColor Green

# Verification que Supabase local est demarre
Write-Host "Verification de l'etat de Supabase..." -ForegroundColor Yellow
supabase status | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Demarrage de Supabase local..." -ForegroundColor Yellow
    supabase start
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Impossible de demarrer Supabase local"
        exit 1
    }
}

Write-Host "Supabase local est operationnel" -ForegroundColor Green

# Configuration de l'environnement local
Write-Host "Configuration de l'environnement local..." -ForegroundColor Yellow
$env:NODE_ENV = "development"
$env:VITE_ENV = "local"
$env:VITE_SUPABASE_URL = "http://127.0.0.1:54321"
$env:VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Affichage des informations de connexion
Write-Host "`nInformations de l'environnement local:" -ForegroundColor Cyan
Write-Host "   API URL: http://127.0.0.1:54321" -ForegroundColor White
Write-Host "   Studio URL: http://127.0.0.1:54323" -ForegroundColor White
Write-Host "   Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres" -ForegroundColor White
Write-Host "   Mailpit URL: http://127.0.0.1:54324" -ForegroundColor White

# Demarrage du serveur de developpement avec l'environnement local
Write-Host "`nDemarrage du serveur de developpement..." -ForegroundColor Green
Write-Host "   L'application utilisera les variables d'environnement locales" -ForegroundColor Gray
Write-Host "   Ctrl+C pour arreter" -ForegroundColor Gray
Write-Host ""

npm run dev