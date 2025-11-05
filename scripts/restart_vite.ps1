param(
	[int]$Port = 5173
)

Write-Host "[restart_vite] Arrêt des processus écoutant sur le port $Port..."

function Stop-PortProcess {
	param([int]$Port)
	try {
		$pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
			Select-Object -ExpandProperty OwningProcess -Unique
			if ($pids) {
				foreach ($procId in $pids) {
				try {
						Stop-Process -Id $procId -Force -ErrorAction Stop
						Write-Host "[restart_vite] Processus $procId arrêté"
						} catch {
						Write-Warning "[restart_vite] Impossible d'arrêter $($procId): $($_)"
				}
			}
		} else {
			Write-Host "[restart_vite] Aucun processus trouvé sur le port $Port"
		}
	} catch {
		Write-Warning "[restart_vite] Get-NetTCPConnection indisponible, fallback netstat"
		$lines = netstat -ano | Select-String ":$Port\s" | ForEach-Object { $_.ToString() }
		$pids2 = @()
		foreach ($line in $lines) {
			$parts = $line -split '\s+'
			if ($parts.Length -ge 5) { $pids2 += [int]$parts[-1] }
		}
		$pids2 = $pids2 | Select-Object -Unique
			foreach ($procId in $pids2) {
			try {
					Stop-Process -Id $procId -Force -ErrorAction Stop
					Write-Host "[restart_vite] Processus $procId arrêté (fallback)"
					} catch {
					Write-Warning "[restart_vite] Échec arrêt $($procId) (fallback): $($_)"
			}
		}
	}
}

Stop-PortProcess -Port $Port

Write-Host "[restart_vite] Arrêt terminé. Relancez la tâche 'Dev (vite)' si nécessaire."

