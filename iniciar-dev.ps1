# Script PowerShell para iniciar servidores de desarrollo LOCAL
Write-Host "🚀 Iniciando servidores de desarrollo LOCALES..." -ForegroundColor Green
Write-Host ""

Write-Host "📡 Iniciando Backend LOCAL (puerto 5000)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd 'e:\Proyectos\sf-alumnos\backend'; npm run dev" -WindowStyle Normal

Start-Sleep 3

Write-Host "🌐 Iniciando Frontend (puerto 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd 'e:\Proyectos\sf-alumnos\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Servidores LOCALES iniciados en modo desarrollo" -ForegroundColor Green
Write-Host "📡 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Para usar backend en Render.com, ejecuta: iniciar-frontend.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
