<#
  normalize-assets.ps1
  Usage:
    -DryRun: Show what would be moved (default)
    -Apply : Perform the moves listed in assets-manifest.json

  This script reads assets-manifest.json located in the same folder and performs
  safe renames/moves. It writes a moves-log.json when applied so you can undo.
#>
param(
  [switch]$Apply
)

$manifestPath = Join-Path $PSScriptRoot 'assets-manifest.json'
if (-not (Test-Path $manifestPath)) {
  Write-Error "Manifest not found at $manifestPath"
  exit 2
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$moves = @()

foreach ($item in $manifest) {
  $src = Join-Path $PSScriptRoot $item.source
  $dst = Join-Path $PSScriptRoot $item.destination
  $dstDir = Split-Path $dst -Parent

  if (-not (Test-Path $src)) {
    Write-Warning "Source missing: $src"
    continue
  }

  if (-not (Test-Path $dstDir)) {
    Write-Output "Creating directory: $dstDir"
    if ($Apply) {
      New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }
  }

  if (Test-Path $dst) {
    Write-Warning "Destination already exists, skipping: $dst"
    continue
  }

  if ($Apply) {
    try {
      Move-Item -LiteralPath $src -Destination $dst -Force
      Write-Output "Moved: $src -> $dst"
      $moves += [pscustomobject]@{ source = $src; destination = $dst; timestamp = (Get-Date).ToString('o') }
    } catch {
      Write-Error "Failed to move $src -> $dst : $_"
    }
  } else {
    Write-Output "Would move: $src -> $dst"
  }
}

if ($Apply -and $moves.Count -gt 0) {
  $logPath = Join-Path $PSScriptRoot 'moves-log.json'
  $moves | ConvertTo-Json -Depth 5 | Set-Content -Path $logPath -Encoding utf8
  Write-Output "Moves recorded to: $logPath"
}

Write-Output "Done. Run './normalize-assets.ps1 -Apply' from the assets folder to perform the moves."
