# Script para desarrollo - sf-alumnos
param([string]$Action = "start")

Write-Host "Iniciando script de desarrollo sf-alumnos..." -ForegroundColor Green

function Stop-AllProcesses {
    Write-Host "Deteniendo servidores..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Job -ErrorAction SilentlyContinue | Stop-Job  
    Get-Job -ErrorAction SilentlyContinue | Remove-Job
    Start-Sleep 2
    Write-Host "Servidores detenidos" -ForegroundColor Green
}

function Test-ServerPort {
    param([int]$Port)
    $result = netstat -an | findstr ":$Port.*LISTENING"
    return $result -ne $null
}

function Show-ServerStatus {
    Write-Host ""
    Write-Host "Estado de servidores:" -ForegroundColor Cyan
    
    if (Test-ServerPort 5000) {
        Write-Host "Backend (puerto 5000): ACTIVO" -ForegroundColor Green
    } else {
        Write-Host "Backend (puerto 5000): INACTIVO" -ForegroundColor Red
    }
    
    if (Test-ServerPort 5173) {
        Write-Host "Frontend (puerto 5173): ACTIVO" -ForegroundColor Green
    } else {
        Write-Host "Frontend (puerto 5173): INACTIVO" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "URLs disponibles:" -ForegroundColor Cyan
    Write-Host "Backend:  http://localhost:5000"
    Write-Host "Frontend: http://localhost:5173"
}

function Start-DevelopmentServers {
    Write-Host ""
    Write-Host "Verificando estructura del proyecto..." -ForegroundColor Cyan
    
    if (-not (Test-Path "backend\package.json")) {
        Write-Host "ERROR: No se encontro package.json en backend" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Path "frontend\package.json")) {
        Write-Host "ERROR: No se encontro package.json en frontend" -ForegroundColor Red
        return
    }
    
    # Limpiar procesos previos
    Stop-AllProcesses
    
    Write-Host "Iniciando Backend..." -ForegroundColor Cyan
    $backendJob = Start-Job -Name "dev-backend" -ScriptBlock {
        Set-Location "$($args[0])\backend"
        node server.js
    } -ArgumentList $PWD
    
    # Esperar a que el backend se inicie
    $attempts = 0
    do {
        Start-Sleep 1
        $attempts++
        Write-Host "." -NoNewline
    } while (-not (Test-ServerPort 5000) -and $attempts -lt 10)
    
    if (Test-ServerPort 5000) {
        Write-Host " Backend iniciado correctamente" -ForegroundColor Green
    } else {
        Write-Host " Backend tomando mas tiempo del esperado" -ForegroundColor Yellow
    }
    
    Write-Host "Iniciando Frontend..." -ForegroundColor Cyan
    $frontendJob = Start-Job -Name "dev-frontend" -ScriptBlock {
        Set-Location "$($args[0])\frontend"
        npm run dev
    } -ArgumentList $PWD
    
    # Esperar a que el frontend se inicie
    $attempts = 0
    do {
        Start-Sleep 1
        $attempts++
        Write-Host "." -NoNewline
    } while (-not (Test-ServerPort 5173) -and $attempts -lt 15)
    
    if (Test-ServerPort 5173) {
        Write-Host " Frontend iniciado correctamente" -ForegroundColor Green
    } else {
        Write-Host " Frontend tomando mas tiempo del esperado" -ForegroundColor Yellow
    }
    
    Show-ServerStatus
    
    Write-Host ""
    Write-Host "Comandos utiles:" -ForegroundColor Gray
    Write-Host "  .\run-dev.ps1 status  - Ver estado actual"
    Write-Host "  .\run-dev.ps1 stop    - Detener servidores"
    Write-Host "  Get-Job | Receive-Job -Keep  - Ver logs"
}

# Ejecutar segun parametro
switch ($Action.ToLower()) {
    "start" { 
        Start-DevelopmentServers 
    }
    "stop" { 
        Stop-AllProcesses 
    }
    "status" { 
        Show-ServerStatus 
    }
    default { 
        Write-Host "Uso: .\run-dev.ps1 [start|stop|status]" -ForegroundColor Yellow
        Write-Host "Por defecto ejecuta 'start'" -ForegroundColor Gray
    }
}
