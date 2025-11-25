#!/usr/bin/env pwsh
# Test de la fonction Edge contact-form-email

Write-Host "=== Test de la fonction contact-form-email ===" -ForegroundColor Cyan

$url = "http://127.0.0.1:54321/functions/v1/contact-form-email"
# Lire depuis .env
$anonKey = ""
if (Test-Path ".env") {
  $envContent = Get-Content ".env"
  foreach ($line in $envContent) {
    if ($line -match "^VITE_SUPABASE_ANON_KEY=(.+)$") {
      $anonKey = $matches[1].Trim()
      break
    }
  }
}

if (-not $anonKey) {
  $anonKey = $env:VITE_SUPABASE_ANON_KEY
}

if (-not $anonKey) {
  Write-Host "Erreur: VITE_SUPABASE_ANON_KEY non trouvé" -ForegroundColor Red
  exit 1
}

$body = @{
  name = "Test Contact Form"
  email = "test@example.com"
  phone = "+33612345678"
  message = "Ceci est un message de test depuis le script PowerShell pour vérifier que la fonction contact-form-email fonctionne correctement."
} | ConvertTo-Json

$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer $anonKey"
  "apikey" = $anonKey
}

Write-Host "`nEnvoi de la requête..." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host "Anon Key: $anonKey" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray

try {
  $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
  Write-Host "`n✅ Succès!" -ForegroundColor Green
  Write-Host "Réponse: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Green
} catch {
  Write-Host "`n❌ Erreur:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.ErrorDetails) {
    Write-Host "Détails: $($_.ErrorDetails)" -ForegroundColor Red
  }
  exit 1
}

Write-Host "`n=== Test terminé ===" -ForegroundColor Cyan
