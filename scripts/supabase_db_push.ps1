param(
	[string]$ProjectRef = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "[ERR]  $msg" -ForegroundColor Red }

function Assert-Command($name, $installHint) {
	if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
		Write-Err "$name introuvable. $installHint"
		exit 1
	}
}

try {
	Write-Info "Vérification Supabase CLI"
	Assert-Command 'supabase' "Installez-le par: npm i -g supabase"

	# Se placer à la racine du repo (dossier parent de scripts)
	$scriptPath = $MyInvocation.MyCommand.Path
	$scriptsDir = Split-Path -Parent $scriptPath
	$repoRoot = Split-Path -Parent $scriptsDir
	if (-not $repoRoot) { $repoRoot = Get-Location }
	Set-Location $repoRoot

	# Vérifier/compléter config.toml
	$cfgPath = Join-Path $repoRoot 'supabase\config.toml'
	if (-not (Test-Path $cfgPath)) { New-Item -ItemType Directory -Path (Split-Path $cfgPath) -Force | Out-Null }
	if (-not (Test-Path $cfgPath)) {
		if ([string]::IsNullOrWhiteSpace($ProjectRef)) { throw "Aucun project_ref fourni et config.toml manquant." }
		$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
		$content = 'project_id = "' + $ProjectRef + '"'
		[System.IO.File]::WriteAllText($cfgPath, $content, $utf8NoBom)
		Write-Info "config.toml créé avec project_id=$ProjectRef"
	} else {
		$cfg = Get-Content $cfgPath -Raw
			if ($cfg -match 'project_id\s*=\s*"([^"]+)"') {
				$projId = $Matches[1]
				Write-Info "project_id détecté: $projId"
		} else {
			if ([string]::IsNullOrWhiteSpace($ProjectRef)) { throw "project_id introuvable dans config.toml et aucun ProjectRef passé." }
			$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
			$content = 'project_id = "' + $ProjectRef + '"'
			[System.IO.File]::WriteAllText($cfgPath, $content, $utf8NoBom)
			Write-Info "config.toml mis à jour avec project_id=$ProjectRef"
		}
	}

		Write-Info "Déploiement des migrations (supabase db push --include-all)"
		$proc = Start-Process -FilePath "supabase" -ArgumentList @("db","push","--include-all") -NoNewWindow -Wait -PassThru
	if ($proc.ExitCode -ne 0) {
		throw "supabase db push a échoué avec code $($proc.ExitCode). Assurez-vous d'être connecté (supabase login) et que le projet est accessible."
	}
	Write-Ok "Migrations appliquées avec succès."
}
catch {
	Write-Err $_.Exception.Message
	exit 1
}
