@echo off
echo 🚀 Preparando deploy para producción...

rem Eliminar archivos de build anteriores
echo 🧹 Limpiando builds anteriores...
if exist frontend\dist rmdir /s /q frontend\dist

rem Instalar dependencias del frontend
echo 📦 Instalando dependencias del frontend...
cd frontend
call npm ci

rem Crear build de producción
echo 🔨 Creando build de producción...
call npm run build

rem Volver al directorio raíz
cd ..

echo ✅ Build completado!
echo 📁 Los archivos están en frontend/dist/
echo.
echo 📝 Para hacer deploy:
echo 1. git add .
echo 2. git commit -m "Deploy: Frontend build for production"
echo 3. git push origin main
echo.
echo 🌐 URLs de producción:
echo Frontend: https://sf-alumnos-frontend.onrender.com
echo Backend:  https://sf-alumnos-backend.onrender.com

pause
