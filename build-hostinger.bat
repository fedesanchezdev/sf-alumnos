@echo off
echo 🏠 Preparando build para Hostinger (federicosanchez.com.ar)...

rem Crear directorio de build si no existe
if not exist "build-hostinger" mkdir build-hostinger

rem Ir al directorio del frontend
cd frontend

rem Eliminar build anterior
if exist dist rmdir /s /q dist

rem Instalar dependencias
echo 📦 Instalando dependencias...
call npm ci

rem Crear build de producción con variables de entorno para Hostinger
echo 🔨 Creando build para Hostinger...
call npm run build

rem Copiar archivos al directorio de build
echo 📋 Copiando archivos al directorio build-hostinger...
cd ..
xcopy /E /I /Y frontend\dist\* build-hostinger\

echo ✅ Build para Hostinger completado!
echo.
echo 📁 Archivos listos en: build-hostinger\
echo.
echo 📝 INSTRUCCIONES PARA SUBIR A HOSTINGER:
echo.
echo 1. Ve a tu panel de Hostinger (hpanel.hostinger.com)
echo 2. Busca "Administrador de archivos" o "File Manager"  
echo 3. Navega a la carpeta public_html de federicosanchez.com.ar
echo 4. Haz backup de tu contenido actual (si lo hay)
echo 5. Sube TODOS los archivos de build-hostinger\ a public_html\
echo 6. Asegúrate de que el archivo .htaccess esté incluido
echo.
echo 🌐 URLs:
echo Frontend: https://federicosanchez.com.ar
echo Backend:  https://sf-alumnos-backend.onrender.com/api
echo.
echo ⚠️  IMPORTANTE: Asegúrate de subir el archivo .htaccess para el routing de React

pause
