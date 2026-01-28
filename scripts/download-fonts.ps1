# Script para descargar NotoSans-Regular.ttf a public\fonts (Windows PowerShell)
# Ejecutar desde la raíz del proyecto

Set-StrictMode -Version Latest

if (-not (Test-Path "public\fonts")) {
    New-Item -ItemType Directory -Path "public\fonts" | Out-Null
}

$uri = "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf"
$out = "public\fonts\NotoSans-Regular.ttf"

Write-Host "Descargando NotoSans-Regular.ttf a public\fonts..."

try {
    # Preferir Invoke-WebRequest; si falla, intentar curl (disponible en Windows 10+)
    Invoke-WebRequest -Uri $uri -OutFile $out -UseBasicParsing -ErrorAction Stop
    Write-Host "Descargado en $out"
} catch {
    Write-Warning "Invoke-WebRequest falló, intentando curl..."
    try {
        $curl = Get-Command curl -ErrorAction SilentlyContinue
        if ($curl) {
            curl -L $uri -o $out
            if (Test-Path $out) { Write-Host "Descargado en $out (curl)"; exit 0 }
        }
        throw "No se pudo descargar la fuente con Invoke-WebRequest ni curl"
    } catch {
        Write-Error "Error descargando la fuente: $_"
        Write-Host "Si esto falla, descarga manualmente desde https://github.com/googlefonts/noto-fonts or https://fonts.google.com/specimen/Noto+Sans"
        exit 1
    }
}
Write-Host "Descargando NotoSans-Regular.ttf a public\fonts..."#if (-not (Test-Path "public\fonts")) { New-Item -ItemType Directory -Path "public\fonts" | Out-Null }