# Script para iniciar los servidores de desarrollo
Write-Host "Iniciando servidores de desarrollo..." -ForegroundColor Green

# Iniciar Backend
Write-Host "Iniciando Backend en puerto 5000..." -ForegroundColor Yellow
Start-Process -WindowStyle Minimized cmd.exe -ArgumentList "/c", "cd /d `"E:\Proyectos\sf-alumnos\backend`" && npm run dev"

# Esperar un poco antes de iniciar el frontend
Start-Sleep -Seconds 3

# Iniciar Frontend  
Write-Host "Iniciando Frontend en puerto 5173..." -ForegroundColor Yellow
Start-Process -WindowStyle Minimized cmd.exe -ArgumentList "/c", "cd /d `"E:\Proyectos\sf-alumnos\frontend`" && npm run dev"

Write-Host "Servidores iniciados!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener los servidores, cierra las ventanas de consola o usa Ctrl+C" -ForegroundColor Gray
