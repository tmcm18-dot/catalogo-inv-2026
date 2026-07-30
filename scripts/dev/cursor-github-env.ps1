#Requires -Version 5.1
<#
.SYNOPSIS
  Prepares Git and GitHub CLI for the current PowerShell session only.

.DESCRIPTION
  Locates git.exe (Git for Windows or GitHub Desktop), prepends its directory
  to the session PATH, and verifies git/gh availability and gh auth status.
  Does not modify the permanent user/system PATH.
  Does not perform login or store credentials.

.EXAMPLE
  . .\scripts\dev\cursor-github-env.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

function Write-EnvInfo {
  param([string]$Message)
  Write-Host "[cursor-github-env] $Message"
}

function Write-EnvWarn {
  param([string]$Message)
  Write-Warning "[cursor-github-env] $Message"
}

function Find-GitExecutable {
  $candidates = @(
    'C:\Program Files\Git\cmd\git.exe',
    'C:\Program Files\Git\bin\git.exe'
  )

  $desktopRoot = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
  if (Test-Path $desktopRoot) {
    $desktopGits = Get-ChildItem -Path $desktopRoot -Filter 'git.exe' -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match '[\\/]cmd[\\/]git\.exe$' } |
      Sort-Object FullName -Descending |
      Select-Object -ExpandProperty FullName
    $candidates += @($desktopGits)
  }

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }

  $fromPath = Get-Command git -ErrorAction SilentlyContinue
  if ($fromPath -and $fromPath.Source) {
    return $fromPath.Source
  }

  return $null
}

if ($MyInvocation.InvocationName -ne '.') {
  Write-EnvWarn 'Este script debe ejecutarse con dot-sourcing para que el PATH de sesión persista:'
  Write-Host '  . .\scripts\dev\cursor-github-env.ps1'
  Write-Host 'Continúo de todos modos; si no usaste el punto, el PATH puede no persistir en tu shell.'
}

$gitExe = Find-GitExecutable
if (-not $gitExe) {
  Write-EnvWarn 'No se encontró git.exe. Instalá Git for Windows o usá GitHub Desktop.'
  return
}

$gitDir = Split-Path -Parent $gitExe
if ($env:Path -notlike "*$gitDir*") {
  $env:Path = "$gitDir;$env:Path"
  Write-EnvInfo "PATH de sesión actualizado con: $gitDir"
} else {
  Write-EnvInfo "Git ya estaba en el PATH de sesión: $gitDir"
}

Write-EnvInfo "git.exe = $gitExe"

try {
  $gitVersion = & git --version 2>&1
  Write-EnvInfo "$gitVersion"
} catch {
  Write-EnvWarn "git --version falló: $($_.Exception.Message)"
}

$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghCmd) {
  Write-EnvWarn 'GitHub CLI (gh) no está en el PATH. Instalá https://cli.github.com/'
} else {
  try {
    $ghVersion = & gh --version 2>&1 | Select-Object -First 1
    Write-EnvInfo "$ghVersion"
  } catch {
    Write-EnvWarn "gh --version falló: $($_.Exception.Message)"
  }

  Write-EnvInfo 'Comprobando gh auth status (sin iniciar login)...'
  & gh auth status 2>&1 | ForEach-Object { Write-Host $_ }
  if ($LASTEXITCODE -ne 0) {
    Write-EnvWarn 'gh no está autenticado. Ejecutá manualmente:'
    Write-Host '  gh auth login --web --git-protocol https'
    Write-EnvWarn 'Este helper NO inicia login automáticamente ni guarda credenciales.'
  } else {
    Write-EnvInfo 'gh auth OK.'
  }
}

Write-EnvInfo 'Listo. GitHub Desktop es opcional; no se modifica ni se desinstala.'
