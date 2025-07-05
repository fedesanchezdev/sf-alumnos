# Script simple para iniciar servidores sf-alumnos
param([string]$cmd = "start")

Write-Host "🚀 Script de Desarrollo sf-alumnos" -ForegroundColor Green

function Stop-DevServers {
    Write-Host "🛑 Deteniendo servidores..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Job -ErrorAction SilentlyContinue | Stop-Job
    Get-Job -ErrorAction SilentlyContinue | Remove-Job
    Write-Host "✅ Detenidos" -ForegroundColor Green
}

function Test-Port($port) {
    $result = netstat -an | findstr ":$port.*LISTENING"
    return $result -ne $null
}

function Show-DevStatus {
    Write-Host "`n📊 Estado:" -ForegroundColor Cyan
    
    if (Test-Port 5000) {
        Write-Host "✅ Backend (5000): ACTIVO" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend (5000): INACTIVO" -ForegroundColor Red
    }
    
    if (Test-Port 5173) {
        Write-Host "✅ Frontend (5173): ACTIVO" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend (5173): INACTIVO" -ForegroundColor Red
    }
    
    Write-Host "`n🌐 URLs:" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:5000"
    Write-Host "   Frontend: http://localhost:5173"
}

function Start-DevServers {
    Write-Host "`n🔧 Verificando directorio..." -ForegroundColor Cyan
    if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
        Write-Host "❌ Ejecutar desde directorio sf-alumnos" -ForegroundColor Red
        return
    }
    
    Stop-DevServers
    Start-Sleep 2
    
    Write-Host "`n📡 Iniciando Backend..." -ForegroundColor Cyan
    Start-Job -Name "backend-dev" -ScriptBlock {
        Set-Location "$($args[0])\backend"
        node server.js
    } -ArgumentList $PWD | Out-Null
    
    # Esperar backend
    1..8 | ForEach-Object {
        Start-Sleep 1
        if (Test-Port 5000) {
            Write-Host "✅ Backend listo" -ForegroundColor Green
            return
        }
        Write-Host "." -NoNewline
    }
    
    Write-Host "`n🌐 Iniciando Frontend..." -ForegroundColor Cyan
    Start-Job -Name "frontend-dev" -ScriptBlock {
        Set-Location "$($args[0])\frontend"
        npm run dev
    } -ArgumentList $PWD | Out-Null
    
    # Esperar frontend
    1..12 | ForEach-Object {
        Start-Sleep 1
        if (Test-Port 5173) {
            Write-Host "✅ Frontend listo" -ForegroundColor Green
            return
        }
        Write-Host "." -NoNewline
    }
    
    Show-DevStatus
    Write-Host "`n💡 Para detener: .\quick-dev.ps1 stop" -ForegroundColor Gray
}

# Ejecutar comando
switch ($cmd) {
    "start" { Start-DevServers }
    "stop" { Stop-DevServers }
    "status" { Show-DevStatus }
    default { Write-Host "Uso: .\quick-dev.ps1 [start|stop|status]" -ForegroundColor Yellow }
}
