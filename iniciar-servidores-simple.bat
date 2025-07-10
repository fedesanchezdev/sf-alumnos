@echo off
echo Iniciando servidores sf-alumnos...
echo.

echo [1/2] Iniciando Backend...
cd /d "e:\Proyectos\03. sf-alumnos\backend"
start "Backend SF-Alumnos" cmd /k "node server.js"

echo [2/2] Iniciando Frontend...
cd /d "e:\Proyectos\03. sf-alumnos\frontend"
start "Frontend SF-Alumnos" cmd /k "npm run dev"

echo.
echo ✅ Servidores iniciados:
echo    - Backend: http://localhost:5000
echo    - Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para salir...
pause > nul
