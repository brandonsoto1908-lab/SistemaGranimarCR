# Script para aplicar migraciones de Supabase manualmente
# Ejecutar desde la raíz del proyecto

Write-Host "=== Aplicar Migraciones de Supabase ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "supabase\migrations")) {
    Write-Host "Error: No se encontró el directorio 'supabase\migrations'" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host "Migraciones disponibles:" -ForegroundColor Green
Get-ChildItem "supabase\migrations\*.sql" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "IMPORTANTE: Para aplicar las migraciones, debes:" -ForegroundColor Yellow
Write-Host "1. Ir a tu dashboard de Supabase: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Seleccionar tu proyecto" -ForegroundColor White
Write-Host "3. Ir a 'SQL Editor'" -ForegroundColor White
Write-Host "4. Copiar y pegar el contenido de cada archivo .sql" -ForegroundColor White
Write-Host "5. Ejecutar cada migración en orden" -ForegroundColor White
Write-Host ""

$migrationFile = "supabase\migrations\017_fix_facturacion_triggers.sql"
if (Test-Path $migrationFile) {
    Write-Host "=== Migración más reciente: 017_fix_facturacion_triggers.sql ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Contenido a copiar:" -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
    Get-Content $migrationFile | Write-Host -ForegroundColor White
    Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Presiona cualquier tecla para abrir el dashboard de Supabase..." -ForegroundColor Green
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "https://supabase.com/dashboard"
}
