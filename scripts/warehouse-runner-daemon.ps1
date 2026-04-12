param(
  [string]$ProjectRoot = "C:\Users\sashi\Projects\FightInsuranceDenials-working",
  [string]$NodeExe = "C:\Program Files\nodejs\node.exe"
)

$ErrorActionPreference = "Stop"

$runtimeDir = Join-Path $ProjectRoot ".runtime"
$logDir = Join-Path $runtimeDir "logs"
$statePath = Join-Path $runtimeDir "warehouse-daemon-state.json"
$daemonLockPath = Join-Path $runtimeDir "warehouse-daemon.lock"
$jobWrapper = Join-Path $ProjectRoot "scripts\run-warehouse-job.ps1"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-DaemonLog {
  param([string]$Message)

  $line = "[{0}] {1}" -f (Get-Date).ToString("s"), $Message
  $line | Out-File -FilePath (Join-Path $logDir "warehouse-daemon.log") -Append -Encoding utf8
}

function Run-Job {
  param([string]$Mode)

  Write-DaemonLog "Starting $Mode"

  try {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $jobWrapper -Mode $Mode

    if ($LASTEXITCODE -eq 0) {
      Write-DaemonLog "Completed $Mode"
      return $true
    }

    Write-DaemonLog ("Failed {0}: exit code {1}" -f $Mode, $LASTEXITCODE)
    return $false
  } catch {
    Write-DaemonLog ("Failed {0}: {1}" -f $Mode, $_.Exception.Message)
    return $false
  }
}

function Get-State {
  if (Test-Path $statePath) {
    try {
      return Get-Content $statePath -Raw | ConvertFrom-Json
    } catch {
      return [pscustomobject]@{}
    }
  }

  return [pscustomobject]@{}
}

function Save-State {
  param([object]$State)
  $State | ConvertTo-Json | Out-File -FilePath $statePath -Encoding utf8
}

if (Test-Path $daemonLockPath) {
  try {
    $existing = Get-Content $daemonLockPath -Raw | ConvertFrom-Json
    if ($existing.pid) {
      $proc = Get-Process -Id $existing.pid -ErrorAction SilentlyContinue
      if ($proc) {
        Write-DaemonLog "Another daemon is already running with PID $($existing.pid). Exiting."
        exit 0
      }
    }
  } catch {
  }
}

([pscustomobject]@{
  pid = $PID
  startedAt = (Get-Date).ToString("s")
}) | ConvertTo-Json | Out-File -FilePath $daemonLockPath -Encoding utf8

try {
  Write-DaemonLog "Warehouse daemon started"

  while ($true) {
    $state = Get-State
    $null = Run-Job -Mode "autopilot"

    $today = (Get-Date).ToString("yyyy-MM-dd")
    $now = Get-Date
    $shouldDeepRun = $now.Hour -eq 2 -and $now.Minute -ge 15 -and $now.Minute -le 59 -and $state.lastDeepBackfillDate -ne $today

    if ($shouldDeepRun) {
      $deepSucceeded = Run-Job -Mode "deep-backfill"
      if ($deepSucceeded) {
        $state | Add-Member -NotePropertyName lastDeepBackfillDate -NotePropertyValue $today -Force
        Save-State -State $state
      }
    }

    Write-DaemonLog "Sleeping for 60 minutes"
    Start-Sleep -Seconds 3600
  }
} finally {
  Write-DaemonLog "Warehouse daemon stopping"
  Remove-Item -Path $daemonLockPath -Force -ErrorAction SilentlyContinue
}
