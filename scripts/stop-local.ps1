param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173,
    [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "SilentlyContinue"
$ports = @($BackendPort, $FrontendPort)
$repoNorm = (Resolve-Path $RepoRoot).Path.ToLowerInvariant()

function Stop-PortListeners {
    param([int[]]$PortList)
    foreach ($port in $PortList) {
        Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object {
                $procId = $_.OwningProcess
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host ("Stopping {0} (PID {1}) on port {2}" -f $proc.ProcessName, $procId, $port)
                } else {
                    Write-Host ("Stopping PID {0} on port {1}" -f $procId, $port)
                }
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
    }
}

Stop-PortListeners -PortList $ports

# uvicorn --reload on Windows leaves orphaned multiprocessing workers after the parent dies.
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
    Where-Object {
        $cmd = $_.CommandLine
        $cmd -match "uvicorn|app\.main:app|multiprocessing\.spawn"
    } |
    ForEach-Object {
        Write-Host ("Stopping python worker (PID {0})" -f $_.ProcessId)
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object {
        $_.CommandLine -match "vite" -and $_.CommandLine.ToLowerInvariant().Contains($repoNorm)
    } |
    ForEach-Object {
        Write-Host ("Stopping vite (PID {0})" -f $_.ProcessId)
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

Get-CimInstance Win32_Process -Filter "Name='esbuild.exe'" |
    Where-Object { $_.CommandLine.ToLowerInvariant().Contains($repoNorm) } |
    ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

Start-Sleep -Seconds 2
Stop-PortListeners -PortList $ports
Start-Sleep -Seconds 1

$blocked = @()
foreach ($port in $ports) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        $blocked += $port
    }
}

if ($blocked.Count -gt 0) {
    Write-Host ""
    Write-Host ("[ERROR] Port(s) still in use: {0}" -f ($blocked -join ", "))
    Write-Host "Close any UP Circuit Backend / Frontend cmd windows, then run stop-local.bat again."
    Write-Host "If it persists, open Task Manager and end leftover python.exe processes."
    exit 1
}

Write-Host ("[OK] Ports {0} and {1} are free." -f $BackendPort, $FrontendPort)
exit 0
