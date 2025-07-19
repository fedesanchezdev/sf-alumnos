// Script para probar la corrección de fechas
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('🧪 PRUEBA DE CORRECCIÓN DE FECHAS');
console.log('=================================\n');

// Función corregida
const ajustarFecha = (fecha) => {
  // Si la fecha viene como string (ej: "2025-07-03"), la interpretamos como fecha local
  if (typeof fecha === 'string') {
    // Agregamos 'T12:00:00.000Z' para establecer mediodía UTC
    // Esto asegura que la fecha se mantenga correcta independientemente de la zona horaria
    const fechaConHora = fecha.includes('T') ? fecha : fecha + 'T12:00:00.000Z';
    return new Date(fechaConHora);
  }
  
  // Si ya es un objeto Date, establecer mediodía local
  const fechaAjustada = new Date(fecha);
  fechaAjustada.setHours(12, 0, 0, 0);
  return fechaAjustada;
};

// Función original
const ajustarFechaOriginal = (fecha) => {
  const fechaAjustada = new Date(fecha);
  fechaAjustada.setHours(12, 0, 0, 0);
  return fechaAjustada;
};

const fechasTest = [
  '2025-07-03', // Jueves
  '2025-07-10', // Jueves
  '2025-07-17', // Jueves
  '2025-07-24', // Jueves
];

console.log('Zona horaria del sistema:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Offset actual:', new Date().getTimezoneOffset(), 'minutos\n');

fechasTest.forEach((fechaInput, index) => {
  console.log(`${index + 1}. INPUT: ${fechaInput}`);
  
  const fechaOriginal = ajustarFechaOriginal(fechaInput);
  const fechaCorregida = ajustarFecha(fechaInput);
  
  console.log(`   MÉTODO ORIGINAL:`);
  console.log(`   - Resultado: ${fechaOriginal}`);
  console.log(`   - Día mostrado: ${fechaOriginal.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`);
  console.log(`   - ISO: ${fechaOriginal.toISOString()}`);
  
  console.log(`   MÉTODO CORREGIDO:`);
  console.log(`   - Resultado: ${fechaCorregida}`);
  console.log(`   - Día mostrado: ${fechaCorregida.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`);
  console.log(`   - ISO: ${fechaCorregida.toISOString()}`);
  
  const esIgual = fechaOriginal.toLocaleDateString() === fechaCorregida.toLocaleDateString();
  console.log(`   - ¿Misma fecha local? ${esIgual ? '✅' : '❌'}\n`);
});

console.log('✅ Prueba completada');
