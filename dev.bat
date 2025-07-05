@echo off
REM Script batch para iniciar servidores sf-alumnos
REM Uso: dev.bat [start|stop|status]

set ACTION=%1
if "%ACTION%"=="" set ACTION=start

echo.
echo 🚀 Script de Gestión de Servidores - sf-alumnos
echo.

if /i "%ACTION%"=="start" goto START
if /i "%ACTION%"=="stop" goto STOP  
if /i "%ACTION%"=="status" goto STATUS
if /i "%ACTION%"=="help" goto HELP

:HELP
echo Uso: dev.bat [comando]
echo.
echo Comandos disponibles:
echo   start    - Inicia ambos servidores (por defecto)
echo   stop     - Detiene todos los servidores
echo   status   - Muestra estado actual
echo   help     - Muestra esta ayuda
echo.
goto END

:START
echo 📡 Iniciando servidores...
echo.

REM Detener procesos existentes
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul

REM Iniciar backend
echo 🔧 Iniciando Backend...
start "Backend - sf-alumnos" cmd /k "cd /d backend && node server.js"

REM Esperar un poco
timeout /t 3 /nobreak >nul

REM Iniciar frontend  
echo 🌐 Iniciando Frontend...
start "Frontend - sf-alumnos" cmd /k "cd /d frontend && npm run dev"

echo.
echo ✅ Servidores iniciados!
echo.
echo 📊 URLs:
echo    Backend:  http://localhost:5000
echo    Frontend: http://localhost:5173
echo.
echo 💡 Para detener: dev.bat stop
goto END

:STOP
echo 🛑 Deteniendo servidores...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
echo ✅ Servidores detenidos
goto END

:STATUS
echo 📊 Verificando estado de servidores...
echo.

netstat -an | findstr ":5000.*LISTENING" >nul
if %errorlevel%==0 (
    echo ✅ Backend ^(puerto 5000^): ACTIVO
) else (
    echo ❌ Backend ^(puerto 5000^): INACTIVO
)

netstat -an | findstr ":5173.*LISTENING" >nul
if %errorlevel%==0 (
    echo ✅ Frontend ^(puerto 5173^): ACTIVO
) else (
    echo ❌ Frontend ^(puerto 5173^): INACTIVO
)

echo.
echo 🌐 URLs:
echo    Backend:  http://localhost:5000
echo    Frontend: http://localhost:5173
goto END

:END
echo.
pause
