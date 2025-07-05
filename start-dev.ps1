# Script simple y confiable para gestionar servidores sf-alumnos
param(
    [string]$Action = "start"
)

function Write-Status($message, $color = "White") {
    Write-Host $message -ForegroundColor $color
}

function Test-ServerPort($port) {
    $result = netstat -an | Select-String ":$port.*LISTENING"
    return $result -ne $null
}

function Stop-Servers {
    Write-Status "🛑 Deteniendo servidores..." "Yellow"
    
    # Detener jobs
    Get-Job -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*servidor*" -or $_.Name -like "*dev*" } | Stop-Job
    Get-Job -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*servidor*" -or $_.Name -like "*dev*" } | Remove-Job
    
    # Detener procesos Node.js
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Start-Sleep -Seconds 2
    Write-Status "✅ Servidores detenidos" "Green"
}

function Show-Status {
    Write-Status "`n📊 Estado de Servidores:" "Cyan"
    
    $backend = Test-ServerPort 5000
    $frontend = Test-ServerPort 5173
    
    if ($backend) {
        Write-Status "✅ Backend (puerto 5000): ACTIVO" "Green"
    } else {
        Write-Status "❌ Backend (puerto 5000): INACTIVO" "Red"
    }
    
    if ($frontend) {
        Write-Status "✅ Frontend (puerto 5173): ACTIVO" "Green"
    } else {
        Write-Status "❌ Frontend (puerto 5173): INACTIVO" "Red"
    }
    
    Write-Status "`n🌐 URLs:" "Cyan"
    Write-Status "   Backend:  http://localhost:5000" "White"
    Write-Status "   Frontend: http://localhost:5173" "White"
}

function Start-Servers {
    Write-Status "🚀 Iniciando Sistema de Gestión de Alumnos..." "Green"
    
    # Verificar directorios
    if (-not (Test-Path "backend\package.json") -or -not (Test-Path "frontend\package.json")) {
        Write-Status "❌ Error: Ejecutar desde el directorio sf-alumnos" "Red"
        return
    }
    
    # Limpiar procesos anteriores
    Stop-Servers
    
    Write-Status "`n📡 Iniciando Backend..." "Cyan"
    
    # Iniciar backend
    $backendJob = Start-Job -Name "dev-backend" -ScriptBlock {
        Set-Location "$($args[0])\backend"
        node server.js
    } -ArgumentList $PWD
    
    # Esperar al backend
    for ($i = 1; $i -le 8; $i++) {
        Start-Sleep -Seconds 1
        if (Test-ServerPort 5000) {
            Write-Status "✅ Backend iniciado" "Green"
            break
        }
        Write-Host "." -NoNewline
    }
    
    Write-Status "`n🌐 Iniciando Frontend..." "Cyan"
    
    # Iniciar frontend
    $frontendJob = Start-Job -Name "dev-frontend" -ScriptBlock {
        Set-Location "$($args[0])\frontend"
        npm run dev
    } -ArgumentList $PWD
    
    # Esperar al frontend
    for ($i = 1; $i -le 12; $i++) {
        Start-Sleep -Seconds 1
        if (Test-ServerPort 5173) {
            Write-Status "✅ Frontend iniciado" "Green"
            break
        }
        Write-Host "." -NoNewline
    }
    
    # Mostrar estado final
    Show-Status
    
    Write-Status "`n💡 Comandos útiles:" "Gray"
    Write-Status "   .\start-dev.ps1 status  - Ver estado" "White"
    Write-Status "   .\start-dev.ps1 stop    - Detener" "White"
    Write-Status "   .\start-dev.ps1 logs    - Ver logs" "White"
}

function Show-Logs {
    Write-Status "📋 Logs de servidores:" "Cyan"
    $jobs = Get-Job -Name "dev-*" -ErrorAction SilentlyContinue
    
    foreach ($job in $jobs) {
        Write-Status "`n=== $($job.Name) ===" "Yellow"
        $output = Receive-Job $job -Keep
        if ($output) {
            $output[-10..-1] | ForEach-Object { Write-Host $_ }
        } else {
            Write-Status "(Sin logs)" "Gray"
        }
    }
}

# Ejecutar según parámetro
switch ($Action.ToLower()) {
    "start" { Start-Servers }
    "stop" { Stop-Servers }
    "status" { Show-Status }
    "logs" { Show-Logs }
    default { 
        Write-Status "Uso: .\start-dev.ps1 [start|stop|status|logs]" "Yellow"
        Write-Status "Ejemplo: .\start-dev.ps1 start" "Gray"
    }
}
