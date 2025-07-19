# Script avanzado para gestión de servidores sf-alumnos
# Ejecutar: .\dev.ps1 [start|stop|status|restart|logs|help]

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "status", "restart", "logs", "help", "")]
    [string]$Action = "start"
)

# Configuración
$BackendPort = 5000
$FrontendPort = 5173
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Colores
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Normal = "White"
    Dim = "Gray"
}

function Write-ColoredMessage {
    param($Message, $Color = "Normal")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Test-Port {
    param([int]$Port)
    $result = netstat -an | Select-String ":$Port\s.*LISTENING"
    return $result -ne $null
}

function Get-ServerStatus {
    $backendRunning = Test-Port $BackendPort
    $frontendRunning = Test-Port $FrontendPort
    
    Write-ColoredMessage "📊 Estado de los Servidores:" "Info"
    Write-Host ""
    
    if ($backendRunning) {
        Write-ColoredMessage "✅ Backend (puerto $BackendPort): ACTIVO" "Success"
    } else {
        Write-ColoredMessage "❌ Backend (puerto $BackendPort): INACTIVO" "Error"
    }
    
    if ($frontendRunning) {
        Write-ColoredMessage "✅ Frontend (puerto $FrontendPort): ACTIVO" "Success"
    } else {
        Write-ColoredMessage "❌ Frontend (puerto $FrontendPort): INACTIVO" "Error"
    }
    
    # Verificar jobs
    $jobs = Get-Job -Name "*sf-alumnos*" -ErrorAction SilentlyContinue
    if ($jobs) {
        Write-Host ""
        Write-ColoredMessage "🔧 Jobs activos:" "Info"
        $jobs | ForEach-Object {
            $status = if ($_.State -eq "Running") { "Success" } else { "Warning" }
            Write-ColoredMessage "   $($_.Name): $($_.State)" $status
        }
    }
    
    Write-Host ""
    Write-ColoredMessage "🌐 URLs:" "Info"
    Write-ColoredMessage "   Backend:  http://localhost:$BackendPort" "Normal"
    Write-ColoredMessage "   Frontend: http://localhost:$FrontendPort" "Normal"
    
    return @{
        BackendRunning = $backendRunning
        FrontendRunning = $frontendRunning
    }
}

function Stop-AllServers {
    Write-ColoredMessage "🛑 Deteniendo todos los servidores..." "Warning"
    
    # Detener jobs
    $jobs = Get-Job -Name "*sf-alumnos*" -ErrorAction SilentlyContinue
    if ($jobs) {
        $jobs | Stop-Job
        $jobs | Remove-Job
        Write-ColoredMessage "   Jobs detenidos" "Dim"
    }
    
    # Detener procesos por puerto
    $processes = @()
    
    # Buscar procesos en puertos específicos
    $netstatOutput = netstat -ano | Select-String ":$BackendPort\s|:$FrontendPort\s"
    foreach ($line in $netstatOutput) {
        if ($line -match "\s+(\d+)$") {
            $pid = $Matches[1]
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process -and ($process.ProcessName -eq "node" -or $process.ProcessName -eq "npm")) {
                    $processes += $process
                }
            } catch {}
        }
    }
    
    # Detener procesos encontrados
    if ($processes) {
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-ColoredMessage "   Procesos Node.js detenidos" "Dim"
    }
    
    Start-Sleep -Seconds 2
    Write-ColoredMessage "✅ Servidores detenidos" "Success"
}

function Start-Backend {
    Write-ColoredMessage "📡 Iniciando Backend..." "Info"
    
    $backendPath = Join-Path $ProjectRoot "backend"
    if (-not (Test-Path "$backendPath\package.json")) {
        Write-ColoredMessage "❌ No se encontró package.json en backend" "Error"
        return $false
    }
    
    $job = Start-Job -Name "sf-alumnos-backend" -ScriptBlock {
        param($BackendPath)
        Set-Location $BackendPath
        node server.js
    } -ArgumentList $backendPath
    
    # Esperar y verificar
    for ($i = 1; $i -le 10; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Port $BackendPort) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort/api/health" -UseBasicParsing -TimeoutSec 3
                if ($response.StatusCode -eq 200) {
                    Write-ColoredMessage "✅ Backend iniciado correctamente" "Success"
                    return $true
                }
            } catch {}
        }
        Write-Host "." -NoNewline
    }
    
    Write-ColoredMessage "`n⚠️  Backend tardando en iniciar, verificar logs con: .\dev.ps1 logs" "Warning"
    return $false
}

function Start-Frontend {
    Write-ColoredMessage "🌐 Iniciando Frontend..." "Info"
    
    $frontendPath = Join-Path $ProjectRoot "frontend"
    if (-not (Test-Path "$frontendPath\package.json")) {
        Write-ColoredMessage "❌ No se encontró package.json en frontend" "Error"
        return $false
    }
    
    $job = Start-Job -Name "sf-alumnos-frontend" -ScriptBlock {
        param($FrontendPath)
        Set-Location $FrontendPath
        npm run dev
    } -ArgumentList $frontendPath
    
    # Esperar y verificar
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Port $FrontendPort) {
            Write-ColoredMessage "✅ Frontend iniciado correctamente" "Success"
            return $true
        }
        Write-Host "." -NoNewline
    }
    
    Write-ColoredMessage "`n⚠️  Frontend tardando en iniciar, verificar logs con: .\dev.ps1 logs" "Warning"
    return $false
}

function Start-AllServers {
    Write-ColoredMessage "🚀 Iniciando Sistema de Gestión de Alumnos..." "Success"
    Write-Host ""
    
    # Verificar directorio
    if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
        Write-ColoredMessage "❌ Error: Ejecutar desde el directorio sf-alumnos" "Error"
        return
    }
    
    # Detener servidores existentes
    Stop-AllServers
    Start-Sleep -Seconds 1
    
    # Iniciar backend
    $backendOk = Start-Backend
    
    # Iniciar frontend
    $frontendOk = Start-Frontend
    
    Write-Host ""
    if ($backendOk -and $frontendOk) {
        Write-ColoredMessage "🎉 ¡Ambos servidores iniciados exitosamente!" "Success"
    } elseif ($backendOk) {
        Write-ColoredMessage "⚠️  Solo el backend se inició correctamente" "Warning"
    } elseif ($frontendOk) {
        Write-ColoredMessage "⚠️  Solo el frontend se inició correctamente" "Warning"
    } else {
        Write-ColoredMessage "❌ Error al iniciar los servidores" "Error"
    }
    
    Write-Host ""
    Get-ServerStatus | Out-Null
}

function Show-Logs {
    $jobs = Get-Job -Name "*sf-alumnos*" -ErrorAction SilentlyContinue
    if (-not $jobs) {
        Write-ColoredMessage "❌ No hay jobs activos" "Error"
        return
    }
    
    Write-ColoredMessage "📋 Logs de los servidores:" "Info"
    Write-Host ""
    
    foreach ($job in $jobs) {
        Write-ColoredMessage "=== $($job.Name) ===" "Info"
        try {
            $output = Receive-Job $job -Keep
            if ($output) {
                $output | ForEach-Object { Write-Host $_ }
            } else {
                Write-ColoredMessage "(Sin logs disponibles)" "Dim"
            }
        } catch {
            Write-ColoredMessage "Error al obtener logs: $($_.Exception.Message)" "Error"
        }
        Write-Host ""
    }
}

function Show-Help {
    Write-ColoredMessage "🔧 Script de Gestión de Servidores - sf-alumnos" "Info"
    Write-Host ""
    Write-ColoredMessage "Uso:" "Normal"
    Write-ColoredMessage "  .\dev.ps1 [comando]" "Dim"
    Write-Host ""
    Write-ColoredMessage "Comandos disponibles:" "Normal"
    Write-ColoredMessage "  start    - Inicia ambos servidores (por defecto)" "Dim"
    Write-ColoredMessage "  stop     - Detiene todos los servidores" "Dim"
    Write-ColoredMessage "  restart  - Reinicia ambos servidores" "Dim"
    Write-ColoredMessage "  status   - Muestra estado actual" "Dim"
    Write-ColoredMessage "  logs     - Muestra logs de los servidores" "Dim"
    Write-ColoredMessage "  help     - Muestra esta ayuda" "Dim"
    Write-Host ""
    Write-ColoredMessage "Ejemplos:" "Normal"
    Write-ColoredMessage "  .\dev.ps1           # Inicia los servidores" "Dim"
    Write-ColoredMessage "  .\dev.ps1 status    # Ver estado" "Dim"
    Write-ColoredMessage "  .\dev.ps1 stop      # Detener todo" "Dim"
}

# Procesar comando
switch ($Action.ToLower()) {
    "start" { Start-AllServers }
    "stop" { Stop-AllServers }
    "status" { Get-ServerStatus | Out-Null }
    "restart" { 
        Stop-AllServers
        Start-Sleep -Seconds 2
        Start-AllServers 
    }
    "logs" { Show-Logs }
    "help" { Show-Help }
    "" { Start-AllServers }
    default { 
        Write-ColoredMessage "❌ Comando desconocido: $Action" "Error"
        Show-Help 
    }
}
