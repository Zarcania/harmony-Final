#!/usr/bin/env powershell

# Script pour synchroniser les données de production vers l'environnement local
Write-Host "🔄 Synchronisation des données de production vers l'environnement local" -ForegroundColor Green

# Vérification que Supabase local est démarré
$supabaseStatus = supabase status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase local n'est pas démarré. Exécutez 'supabase start' d'abord." -ForegroundColor Red
    exit 1
}

Write-Host "📥 Récupération des dernières données de production..." -ForegroundColor Yellow

# Récupération du schéma et des données de production
supabase db dump --linked -f supabase/seed/production_full_dump.sql
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Erreur lors de la récupération du dump complet"
    exit 1
}

supabase db dump --linked --data-only -f supabase/seed/production_data_only.sql
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Erreur lors de la récupération des données"
    exit 1
}

Write-Host "🔄 Application des données sur l'environnement local..." -ForegroundColor Yellow

# Réinitialisation de la base locale avec les nouvelles données
supabase db reset
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Erreur lors de l'application des données"
    exit 1
}

Write-Host "✅ Synchronisation terminée avec succès!" -ForegroundColor Green
Write-Host "   → Toutes les données de production sont maintenant disponibles localement" -ForegroundColor Gray
Write-Host "   → Base locale accessible sur: http://127.0.0.1:54323" -ForegroundColor Gray