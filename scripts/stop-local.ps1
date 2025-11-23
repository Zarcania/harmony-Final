#!/usr/bin/env powershell

# Script pour arrêter complètement l'environnement de développement local
Write-Host "⏹️  Arrêt de l'environnement de développement local" -ForegroundColor Yellow

# Arrêt de Supabase local
Write-Host "🔄 Arrêt de Supabase local..." -ForegroundColor Yellow
supabase stop

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supabase local arrêté avec succès" -ForegroundColor Green
} else {
    Write-Host "⚠️  Erreur lors de l'arrêt de Supabase local" -ForegroundColor Yellow
}

Write-Host "💡 Pour redémarrer l'environnement local, utilisez:" -ForegroundColor Cyan
Write-Host "   ./scripts/dev-local.ps1" -ForegroundColor White