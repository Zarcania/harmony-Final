<#
.SYNOPSIS
  Crée un utilisateur admin local via Edge Functions Supabase.

.USAGE
  powershell -ExecutionPolicy Bypass -File .\scripts\create_local_admin.ps1 -Email admin@local.test -Password Passw0rd!
#>
param(
  [Parameter(Mandatory=$true)][string]$Email,
  [Parameter(Mandatory=$true)][string]$Password
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Ok($m){ Write-Host "[ OK ] $m" -ForegroundColor Green }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERR ] $m" -ForegroundColor Red }

try {
  Write-Info "Création de l'utilisateur via function create-admin-user"
  $payload1 = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
  $resp1 = & supabase functions invoke create-admin-user --no-verify-jwt --body $payload1
  Write-Host $resp1

  Write-Info "Attribution du rôle admin via update-admin-role"
  $payload2 = @{ email = $Email } | ConvertTo-Json -Compress
  $resp2 = & supabase functions invoke update-admin-role --no-verify-jwt --body $payload2
  Write-Host $resp2

  Write-Ok "Utilisateur admin prêt: $Email"
}
catch {
  Write-Err $_.Exception.Message
  exit 1
}
