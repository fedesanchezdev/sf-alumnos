# Script PowerShell para desarrollo con backend en Render.com
Write-Host "🚀 Iniciando desarrollo con backend remoto..." -ForegroundColor Green
Write-Host ""

Write-Host "📡 Backend ejecutándose en Render.com" -ForegroundColor Yellow
Write-Host "🔗 URL: https://sf-alumnos-backend.onrender.com" -ForegroundColor Cyan
Write-Host "🏥 Health: https://sf-alumnos-backend.onrender.com/api/health" -ForegroundColor Gray

Write-Host ""
Write-Host "🌐 Iniciando Frontend local (puerto 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd 'e:\Proyectos\sf-alumnos\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Frontend iniciado en modo desarrollo" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📡 Backend: https://sf-alumnos-backend.onrender.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Para usar backend local, ejecuta: iniciar-dev.ps1" -ForegroundColor Gray
Write-Host "🔧 Para desplegar backend, ver: DEPLOY-RENDER.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
