#!/usr/bin/env powershell

# Script pour ouvrir les interfaces de developpement
Write-Host "Ouverture des interfaces de developpement..." -ForegroundColor Green

# Verification que Supabase local est demarre
supabase status 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Supabase local n'est pas demarre" -ForegroundColor Red
    Write-Host "Lancez d'abord: npm run dev:local" -ForegroundColor Yellow
    exit 1
}

Write-Host "Ouverture des interfaces dans le navigateur..." -ForegroundColor Yellow

# Ouvrir Supabase Studio
Start-Process "http://127.0.0.1:54323"
Write-Host "- Supabase Studio: http://127.0.0.1:54323" -ForegroundColor Cyan

# Ouvrir Mailpit
Start-Process "http://127.0.0.1:54324" 
Write-Host "- Mailpit (emails): http://127.0.0.1:54324" -ForegroundColor Cyan

# Ouvrir l'application (on tente la détection puis on ouvre quoi qu'il arrive)
$appUrl = "http://localhost:5173"
$isUp = $false
try {
    $resp = Invoke-WebRequest -Uri $appUrl -Method GET -TimeoutSec 2 -UseBasicParsing 2>$null
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { $isUp = $true }
} catch { $isUp = $false }

if ($isUp) {
    Start-Process $appUrl
    Write-Host "- Application: $appUrl" -ForegroundColor Cyan
} else {
    # Detection alternative via netstat (0.0.0.0 ou 127.0.0.1)
    $appRunning = netstat -an | findstr ":5173" | findstr /I "LISTENING"
    if ($appRunning) {
        Start-Process $appUrl
        Write-Host "- Application: $appUrl" -ForegroundColor Cyan
    } else {
        Write-Host "- Application pas encore demarree (utilisez npm run dev ou npm run dev:local)" -ForegroundColor Yellow
        # On ouvre quand même l'URL pour l'utilisateur
        Start-Process $appUrl
    }
}

Write-Host "`nToutes les interfaces sont ouvertes !" -ForegroundColor Green