@echo off
echo Iniciando Backend (API)...
cd backend
start "Backend API" cmd /k "node server.js"

echo Esperando 3 segundos...
timeout /t 3 /nobreak > nul

echo Iniciando Frontend (React)...
cd ../frontend
start "Frontend React" cmd /k "npm run dev"

echo.
echo ============================================
echo   Servidores iniciados exitosamente!
echo ============================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
pause
