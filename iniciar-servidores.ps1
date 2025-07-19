# Script para iniciar ambos servidores
Write-Host "🚀 Iniciando Sistema de Gestión de Alumnos..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: No se encontraron las carpetas backend y frontend" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde la carpeta sf-alumnos" -ForegroundColor Yellow
    exit 1
}

# Iniciar Backend
Write-Host "📡 Iniciando Backend (API)..." -ForegroundColor Cyan
Set-Location backend
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "node server.js" -WindowStyle Normal

# Esperar un poco
Start-Sleep -Seconds 3

# Volver al directorio principal
Set-Location ..

# Iniciar Frontend
Write-Host "🌐 Iniciando Frontend (React)..." -ForegroundColor Cyan
Set-Location frontend
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# Volver al directorio principal
Set-Location ..

Write-Host ""
Write-Host "✅ Servidores iniciados exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 URLs disponibles:" -ForegroundColor Yellow
Write-Host "   Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend App: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Para detener los servidores, cierra las ventanas de PowerShell correspondientes" -ForegroundColor Gray
