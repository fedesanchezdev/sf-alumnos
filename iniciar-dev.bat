@echo off
echo 🚀 Iniciando servidores de desarrollo...
echo.

echo 📡 Iniciando Backend (puerto 5000)...
start "Backend Server" cmd /k "cd /d e:\Proyectos\sf-alumnos\backend && npm run dev"

timeout /t 3 /nobreak > nul

echo 🌐 Iniciando Frontend (puerto 5173)...
start "Frontend Server" cmd /k "cd /d e:\Proyectos\sf-alumnos\frontend && npm run dev"

echo.
echo ✅ Servidores iniciados en modo desarrollo
echo 📡 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para salir...
pause > nul
