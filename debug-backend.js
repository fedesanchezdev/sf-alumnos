// Script de debug para verificar conexión con backend
// Ejecutar en la consola del navegador para verificar qué backend estás usando

console.log('🔍 DEBUG: Verificando configuración del backend...');

// 1. Verificar la URL base de la API
const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
console.log('📡 URL base de la API:', apiUrl);

// 2. Hacer una prueba de conexión al backend
async function testBackendConnection() {
  try {
    console.log('🔄 Probando conexión con el backend...');
    
    const response = await fetch(`${apiUrl}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Backend LOCAL funcionando correctamente');
      console.log('🎯 Estás usando el backend local en:', apiUrl);
    } else {
      console.log('⚠️ Backend responde pero con error:', response.status);
    }
  } catch (error) {
    console.log('❌ Error de conexión con backend local:', error.message);
    console.log('🌐 Probablemente estés usando el backend de producción');
    
    // Probar backend de producción
    try {
      const prodResponse = await fetch('https://sf-alumnos-backend-new.onrender.com/api/test');
      if (prodResponse.ok) {
        console.log('✅ Conectado al backend de PRODUCCIÓN');
      }
    } catch (prodError) {
      console.log('❌ Tampoco hay conexión con producción');
    }
  }
}

testBackendConnection();

// 3. Verificar localStorage para tokens
const token = localStorage.getItem('token');
console.log('🔑 Token guardado:', token ? 'Sí (existe)' : 'No');

// 4. Función para verificar manualmente la URL de una solicitud
window.debugApiCall = function(endpoint = '/usuarios') {
  const fullUrl = `${apiUrl}${endpoint}`;
  console.log('🌐 URL completa que se usaría:', fullUrl);
  return fullUrl;
};

console.log('💡 Ejecuta debugApiCall("/endpoint") para ver URLs completas');
console.log('💡 Por ejemplo: debugApiCall("/resumenes-clase")');
