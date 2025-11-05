param(
  [string[]]$Tables = @(
    'services',
    'service_items',
    'portfolio_categories',
    'portfolio_items',
    'promotions',
    'about_content',
    'site_settings',
    'reviews',
    'business_hours',
    'closures',
    'bookings' # RLS: peut ne pas être lisible en anon
  ),
  [int]$PageSize = 1000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Charger .env.local (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
$envPath = Join-Path (Get-Location) ".env.local"
if (-not (Test-Path $envPath)) { Write-Error ".env.local introuvable"; exit 1 }
$envContent = Get-Content $envPath -ErrorAction Stop
$SUPABASE_URL = ($envContent | Where-Object { $_ -match '^VITE_SUPABASE_URL=' } | ForEach-Object { ($_ -split '=',2)[1] }).Trim()
$ANON_KEY = ($envContent | Where-Object { $_ -match '^VITE_SUPABASE_ANON_KEY=' } | ForEach-Object { ($_ -split '=',2)[1] }).Trim()
if (-not $SUPABASE_URL -or -not $ANON_KEY) { Write-Error "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants dans .env.local"; exit 1 }

# Préparer dossier sortie
$outDir = "supabase/seed/csv"
if (-not (Test-Path $outDir)) { New-Item -Type Directory $outDir | Out-Null }

function Export-TableCSV {
  param(
    [string]$Table
  )
  $url = "$SUPABASE_URL/rest/v1/${Table}?select=*"
  $file = Join-Path $outDir ("$Table.csv")
  $all = @()
  try {
    $headers = New-Object 'System.Collections.Generic.Dictionary[[String],[String]]'
    $headers.Add('apikey', $ANON_KEY)
    $headers.Add('Authorization', "Bearer $ANON_KEY")
    $resp = Invoke-WebRequest -Uri $url -Headers $headers -Method GET -ContentType 'application/json' -UseBasicParsing
  } catch {
    Write-Warning ("Lecture échouée pour {0} (peut-être RLS). Détails: {1}" -f $Table, $_.Exception.Message)
    return
  }
  if ($resp.StatusCode -eq 200 -or $resp.StatusCode -eq 206) {
    $json = $resp.Content | ConvertFrom-Json
    if ($json) { $all += $json }
  }
  if ($all.Count -eq 0) {
  Write-Host ("[OK] {0}: 0 lignes (ou non lisible)" -f $Table) -ForegroundColor Yellow
    return
  }
  # Conversion en CSV
  try {
  $all | Export-Csv -Path $file -NoTypeInformation -Encoding UTF8
  Write-Host ("[OK] {0}: {1} lignes -> {2}" -f $Table, $all.Count, $file) -ForegroundColor Green
  } catch {
  Write-Warning ("Export CSV échoué pour {0}: {1}" -f $Table, $_.Exception.Message)
  }
}

foreach ($t in $Tables) { Export-TableCSV -Table $t }

Write-Host "Terminé. CSV dans $outDir" -ForegroundColor Cyan
