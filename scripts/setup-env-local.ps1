$ErrorActionPreference = "Stop"

function New-RandomHex {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return ([System.BitConverter]::ToString($bytes) -replace "-", "").ToLowerInvariant()
}

function Read-RequiredValue {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [string]$Help = ""
  )

  do {
    if ($Help) {
      Write-Host ""
      Write-Host $Help -ForegroundColor DarkGray
    }
    $value = Read-Host $Name
    if ([string]::IsNullOrWhiteSpace($value)) {
      Write-Host "Este valor es obligatorio." -ForegroundColor Yellow
    }
  } while ([string]::IsNullOrWhiteSpace($value))

  return $value.Trim()
}

function Read-OptionalValue {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [string]$Default = ""
  )

  $label = if ($Default) { "$Name [$Default]" } else { $Name }
  $value = Read-Host $label
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }
  return $value.Trim()
}

Write-Host ""
Write-Host "Configuracion privada de BEAULYX" -ForegroundColor Cyan
Write-Host "Pega claves nuevas. No uses las que quedaron visibles en capturas." -ForegroundColor Yellow
Write-Host ""

$adminPassword = Read-RequiredValue "ADMIN_PASSWORD (clave para entrar a #admin)"
$sessionSecret = Read-OptionalValue "ADMIN_SESSION_SECRET, Enter para generar automaticamente" ""
if ([string]::IsNullOrWhiteSpace($sessionSecret)) {
  $sessionSecret = New-RandomHex
  Write-Host "ADMIN_SESSION_SECRET generado automaticamente." -ForegroundColor Green
}

$databaseUrl = Read-RequiredValue "DATABASE_URL de Neon" "Ejemplo: postgresql://usuario:password@host/db?sslmode=require"
$cloudName = Read-RequiredValue "CLOUDINARY_CLOUD_NAME"
$apiKey = Read-RequiredValue "CLOUDINARY_API_KEY"
$apiSecret = Read-RequiredValue "CLOUDINARY_API_SECRET"
$folder = Read-OptionalValue "CLOUDINARY_FOLDER" "beaulyx/productos"

$envPath = Join-Path (Split-Path -Parent $PSScriptRoot) ".env.local"
$content = @(
  "# Archivo local privado. No se sube a GitHub por el .gitignore."
  "# Generado con scripts/setup-env-local.ps1"
  ""
  "ADMIN_PASSWORD=$adminPassword"
  "ADMIN_SESSION_SECRET=$sessionSecret"
  ""
  "DATABASE_URL=$databaseUrl"
  ""
  "CLOUDINARY_CLOUD_NAME=$cloudName"
  "CLOUDINARY_API_KEY=$apiKey"
  "CLOUDINARY_API_SECRET=$apiSecret"
  "CLOUDINARY_FOLDER=$folder"
)

Set-Content -LiteralPath $envPath -Value $content -Encoding UTF8
Write-Host ""
Write-Host ".env.local actualizado correctamente." -ForegroundColor Green
Write-Host "Siguiente: copia estos mismos nombres/valores en Vercel > Settings > Environment Variables." -ForegroundColor Cyan
