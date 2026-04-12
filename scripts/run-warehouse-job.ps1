param(
  [ValidateSet("autopilot", "deep-backfill")]
  [string]$Mode = "autopilot",
  [string]$ProjectRoot = "C:\Users\sashi\Projects\FightInsuranceDenials-working",
  [string]$NodeExe = "C:\Program Files\nodejs\node.exe"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$runtimeDir = Join-Path $ProjectRoot ".runtime"
$logDir = Join-Path $runtimeDir "logs"
$tsxCli = Join-Path $ProjectRoot "node_modules\tsx\dist\cli.mjs"
$tsEntry = Join-Path $ProjectRoot "scripts\run-warehouse-job.ts"
$logFile = Join-Path $logDir ("warehouse-{0}-{1}.log" -f $Mode, (Get-Date).ToString("yyyyMMdd"))
$stdoutFile = Join-Path $logDir ("warehouse-{0}-stdout.tmp" -f $Mode)
$stderrFile = Join-Path $logDir ("warehouse-{0}-stderr.tmp" -f $Mode)

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Remove-Item -Path $stdoutFile,$stderrFile -Force -ErrorAction SilentlyContinue

Push-Location $ProjectRoot
try {
  $proc = Start-Process -FilePath $NodeExe `
    -ArgumentList @($tsxCli, $tsEntry, $Mode) `
    -PassThru `
    -Wait `
    -RedirectStandardOutput $stdoutFile `
    -RedirectStandardError $stderrFile

  if (Test-Path $stdoutFile) {
    Get-Content -Path $stdoutFile | Out-File -FilePath $logFile -Append -Encoding utf8
  }
  if (Test-Path $stderrFile) {
    Get-Content -Path $stderrFile | Out-File -FilePath $logFile -Append -Encoding utf8
  }

  exit $proc.ExitCode
} finally {
  Pop-Location
  Remove-Item -Path $stdoutFile,$stderrFile -Force -ErrorAction SilentlyContinue
}
