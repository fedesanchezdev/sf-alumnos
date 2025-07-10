#!/bin/bash

echo "🏠 Preparando build para Hostinger..."

# Crear directorio de build si no existe
mkdir -p build-hostinger

# Ir al directorio del frontend
cd frontend

# Eliminar build anterior
rm -rf dist

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# Crear build de producción
echo "🔨 Creando build para Hostinger..."
npm run build

# Copiar archivos al directorio de build
echo "📋 Copiando archivos al directorio build-hostinger..."
cd ..
cp -r frontend/dist/* build-hostinger/

echo "✅ Build para Hostinger completado!"
echo ""
echo "📁 Archivos listos en: build-hostinger/"
echo ""
echo "📝 Pasos siguientes:"
echo "1. Comprimir la carpeta build-hostinger en un ZIP"
echo "2. Subir y extraer en tu hosting de Hostinger"
echo "3. Configurar el dominio para apuntar a estos archivos"
echo ""
echo "🌐 URLs:"
echo "Frontend: https://tu-dominio.com (tu dominio de Hostinger)"
echo "Backend:  https://sf-alumnos-backend.onrender.com"
