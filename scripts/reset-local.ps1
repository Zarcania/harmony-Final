#!/usr/bin/env powershell

# Script pour réinitialiser complètement l'environnement local
Write-Host "🔄 Réinitialisation complète de l'environnement local" -ForegroundColor Yellow

$confirmation = Read-Host "⚠️  Cette action va supprimer TOUTES les données locales. Continuer? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Opération annulée" -ForegroundColor Red
    exit 0
}

Write-Host "🛑 Arrêt de Supabase local..." -ForegroundColor Yellow
supabase stop

Write-Host "🗑️  Nettoyage des volumes Docker..." -ForegroundColor Yellow
docker volume prune -f

Write-Host "🚀 Redémarrage de Supabase local..." -ForegroundColor Yellow
supabase start

Write-Host "📥 Récupération des données de production..." -ForegroundColor Yellow
supabase db dump --linked -f supabase/seed/production_full_dump.sql
supabase db dump --linked --data-only -f supabase/seed/production_data_only.sql

Write-Host "🔄 Application des données..." -ForegroundColor Yellow
supabase db reset

Write-Host "✅ Environnement local complètement réinitialisé!" -ForegroundColor Green
Write-Host "   → Studio disponible sur: http://127.0.0.1:54323" -ForegroundColor Gray