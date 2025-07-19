# Script PowerShell para seleccionar modo de desarrollo
Write-Host "🚀 Sistema de Gestión de Alumnos - Selector de Modo" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

Write-Host "Selecciona cómo quieres ejecutar el proyecto:" -ForegroundColor White
Write-Host ""
Write-Host "1. 🌐 Frontend + Backend en Render.com (Recomendado)" -ForegroundColor Cyan
Write-Host "   - Solo ejecuta el frontend localmente" -ForegroundColor Gray
Write-Host "   - Backend ya desplegado en la nube" -ForegroundColor Gray
Write-Host "   - Base de datos persistente" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 💻 Todo local (Backend + Frontend)" -ForegroundColor Yellow
Write-Host "   - Ejecuta ambos servidores localmente" -ForegroundColor Gray
Write-Host "   - Requiere MongoDB local o Atlas" -ForegroundColor Gray
Write-Host "   - Desarrollo completo" -ForegroundColor Gray
Write-Host ""

do {
    $seleccion = Read-Host "Ingresa tu selección (1 o 2)"
} while ($seleccion -notin @("1", "2"))

switch ($seleccion) {
    "1" {
        Write-Host ""
        Write-Host "🌐 Iniciando modo Frontend + Render.com..." -ForegroundColor Cyan
        Start-Sleep 1
        & ".\iniciar-frontend.ps1"
    }
    "2" {
        Write-Host ""
        Write-Host "💻 Iniciando modo Todo Local..." -ForegroundColor Yellow
        Start-Sleep 1
        & ".\iniciar-dev.ps1"
    }
}
