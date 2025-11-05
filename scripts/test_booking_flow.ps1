<#
.SYNOPSIS
  Automatisation de test du flux de réservation + emails via Supabase (Windows PowerShell)

.PREREQUIS
  - Variable d'environnement SUPABASE_SERVICE_ROLE_KEY renseignée (clé service_role)
  - Fichier supabase/config.toml présent avec project_id
  - Accès réseau vers *.supabase.co

.USAGE
  # Option A: exporter la clé une fois dans la session
  # $env:SUPABASE_SERVICE_ROLE_KEY = "<votre_service_role_key>"
  # Option B: le script vous demandera la clé si absente

  # Exécuter le script
  # pwsh scripts/test_booking_flow.ps1

.NOTES
  Ce script utilise l'API REST PostgREST pour insérer une ligne (équivalent au SQL fourni) puis appelle les Edge Functions.
  Aucun secret n'est écrit en clair sur disque.
#>

$ErrorActionPreference = 'Stop'

function Get-ProjectIdFromToml {
  param([string]$Path)
  if (!(Test-Path $Path)) { throw "Fichier introuvable: $Path" }
  $content = Get-Content -LiteralPath $Path -Raw
  $m = [regex]::Match($content, 'project_id\s*=\s*"([a-z0-9]+)"', 'IgnoreCase')
  if (!$m.Success) { throw "project_id introuvable dans $Path" }
  return $m.Groups[1].Value
}

function Get-ServiceRoleKey {
  $key = $env:SUPABASE_SERVICE_ROLE_KEY
  if ([string]::IsNullOrWhiteSpace($key)) {
    Write-Host "SUPABASE_SERVICE_ROLE_KEY non trouvée dans l'environnement."
    $secure = Read-Host -Prompt "Entrez votre SUPABASE_SERVICE_ROLE_KEY" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  }
  if ([string]::IsNullOrWhiteSpace($key)) { throw "Clé service_role manquante" }
  return $key
}

function Get-ParisNowUtc {
  # Convertit le temps Paris en DateTime (UTC) puis renvoie l'ISO 8601
  try {
    $tzId = 'Romance Standard Time' # Paris (Windows)
    $nowLocal = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([datetime]::UtcNow, $tzId)
  } catch {
    $nowLocal = (Get-Date)
  }
  return $nowLocal
}

# 1) Prépare les variables de base
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$projectToml = Join-Path $repoRoot 'supabase/config.toml'
$projectId = Get-ProjectIdFromToml -Path $projectToml
$serviceKey = Get-ServiceRoleKey
$restBase = "https://$projectId.supabase.co"
$funcBase = "https://$projectId.functions.supabase.co"
$commonHeaders = @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey"; 'Content-Type' = 'application/json' }

Write-Host "Projet: $projectId" -ForegroundColor Cyan
Write-Host "REST:   $restBase" -ForegroundColor DarkGray
Write-Host "Funcs:  $funcBase" -ForegroundColor DarkGray

# 2) Crée une réservation en attente (équivalent SQL)
$nowParis = Get-ParisNowUtc
$startAt = $nowParis.AddDays(1).AddHours(1)
$endAt   = $nowParis.AddDays(1).AddHours(2)
$preferredDate = ($nowParis.AddDays(1).Date).ToString('yyyy-MM-dd')

$bookingPayload = [ordered]@{
  client_name       = 'Test Zarcania'
  client_email      = 'contact@zarcania.com'
  client_phone      = '0600000000'
  service_id        = $null
  service_name      = 'Extension de cils - Test'
  preferred_date    = $preferredDate
  preferred_time    = '14:30'
  message           = 'Test de confirmation'
  status            = 'en_attente'
  reminder_sent     = $null
  duration_minutes  = 60
  start_at          = $startAt.ToString('o')
  end_at            = $endAt.ToString('o')
  user_id           = $null
}

$insertHeaders = $commonHeaders.Clone()
$insertHeaders['Prefer'] = 'return=representation'

Write-Host "Insertion PostgREST de la réservation..." -ForegroundColor Yellow
$insertUrl = "$restBase/rest/v1/bookings"
$insertResp = Invoke-RestMethod -Method Post -Uri $insertUrl -Headers $insertHeaders -Body ($bookingPayload | ConvertTo-Json -Depth 5)
if (-not $insertResp) { throw "Réponse vide à l'insertion" }
$BOOKING_ID = $insertResp[0].id
if (-not $BOOKING_ID) { throw "ID non retourné par l'insertion" }
$BOOKING_ID_PART = $BOOKING_ID.Substring(0, [Math]::Min(8, $BOOKING_ID.Length))
Write-Host "BOOKING_ID: $BOOKING_ID" -ForegroundColor Green

# 3) Orchestrateur: confirmation + statut
Write-Host "Appel booking-orchestrator..." -ForegroundColor Yellow
$orchestratorBody = @{ type = 'MANUAL'; booking_id = $BOOKING_ID }
$orchResp = Invoke-RestMethod -Method Post -Uri ("$funcBase/booking-orchestrator") -Headers $commonHeaders -Body ($orchestratorBody | ConvertTo-Json -Depth 5)
Write-Host ("Réponse orchestrator: " + ($orchResp | ConvertTo-Json -Depth 5))

# 4) Vérifie le statut et reminder_sent en base
Write-Host "Vérification statut en base..." -ForegroundColor Yellow
$selectUrl = "$restBase/rest/v1/bookings?id=eq.$BOOKING_ID&select=id,status,reminder_sent"
$selectResp = Invoke-RestMethod -Method Get -Uri $selectUrl -Headers @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey" }
if ($selectResp.Count -eq 1) {
  $row = $selectResp[0]
  Write-Host ("Row: " + ($row | ConvertTo-Json))
} else {
  Write-Warning "Réservation non retrouvée via REST"
}

# 5) Email de rappel (H-24)
Write-Host "Appel booking-reminder-email..." -ForegroundColor Yellow
$remBody = @(
  [ordered]@{
    booking_ref      = $BOOKING_ID_PART
    client_first_name= 'Test'
    customer_email   = 'contact@zarcania.com'
    service_name     = 'Extension de cils - Test'
    starts_at        = (Get-Date).ToString('o')
    timezone         = 'Europe/Paris'
  }
)
$remResp = Invoke-RestMethod -Method Post -Uri ("$funcBase/booking-reminder-email") -Headers $commonHeaders -Body ($remBody | ConvertTo-Json -Depth 5)
Write-Host ("Réponse reminder: " + ($remResp | ConvertTo-Json -Depth 5))

# 6) Email de mise à jour
Write-Host "Appel booking-updated-email..." -ForegroundColor Yellow
$updBody = [ordered]@{
  booking_ref    = $BOOKING_ID_PART
  customer_email = 'contact@zarcania.com'
  old = @{ service_name = 'Extension de cils - Test'; starts_at = '2025-01-01T10:00:00.000Z' }
  new = @{ service_name = 'Extension de cils - Test (MAJ)'; starts_at = '2025-01-01T11:00:00.000Z' }
  timezone = 'Europe/Paris'
}
$updResp = Invoke-RestMethod -Method Post -Uri ("$funcBase/booking-updated-email") -Headers $commonHeaders -Body ($updBody | ConvertTo-Json -Depth 5)
Write-Host ("Réponse updated: " + ($updResp | ConvertTo-Json -Depth 5))

# 7) Email d'annulation
Write-Host "Appel booking-canceled-email..." -ForegroundColor Yellow
$canBody = [ordered]@{
  booking_ref    = $BOOKING_ID_PART
  customer_email = 'contact@zarcania.com'
  service_name   = 'Extension de cils - Test'
  starts_at      = '2025-01-01T11:00:00.000Z'
  timezone       = 'Europe/Paris'
}
$canResp = Invoke-RestMethod -Method Post -Uri ("$funcBase/booking-canceled-email") -Headers $commonHeaders -Body ($canBody | ConvertTo-Json -Depth 5)
Write-Host ("Réponse canceled: " + ($canResp | ConvertTo-Json -Depth 5))

# 8) Sortie synthèse
$summary = [ordered]@{
  booking_id      = $BOOKING_ID
  orchestrator_ok = $orchResp.ok
  orchestrator_status = $orchResp.status
  db_status       = if ($row) { $row.status } else { $null }
  db_reminder_sent= if ($row) { $row.reminder_sent } else { $null }
  reminder_ok     = $remResp.ok
  updated_ok      = $updResp.ok
  canceled_ok     = $canResp.ok
}

Write-Host "\n===== Récap =====" -ForegroundColor Cyan
$summary.GetEnumerator() | ForEach-Object { Write-Host ("{0} = {1}" -f $_.Key, $_.Value) }

Write-Host "\nTerminé."
