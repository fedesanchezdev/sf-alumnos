// Script para diagnosticar el problema de fechas que aparecen un día anterior
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Clase from '../models/Clase.js';
import Pago from '../models/Pago.js';
import Usuario from '../models/Usuario.js';

dotenv.config();

// Conectar a MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB');

console.log('🔍 Investigando problema de fechas...\n');

// Obtener algunas clases recientes
const clases = await Clase.find({})
  .populate('pago', 'fechaPago descripcion')
  .populate('usuario', 'nombre apellido')
  .sort({ createdAt: -1 })
  .limit(5);

console.log('📚 ANÁLISIS DE FECHAS EN BASE DE DATOS:');
console.log('=====================================');

clases.forEach((clase, index) => {
  console.log(`\n${index + 1}. Clase ID: ${clase._id}`);
  console.log(`   Usuario: ${clase.usuario.nombre} ${clase.usuario.apellido}`);
  console.log(`   Fecha almacenada en BD: ${clase.fecha}`);
  console.log(`   Fecha como ISO string: ${clase.fecha.toISOString()}`);
  console.log(`   Fecha en zona local: ${clase.fecha.toLocaleDateString('es-ES', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  })}`);
  console.log(`   Día de la semana: ${clase.fecha.toLocaleDateString('es-ES', { weekday: 'long' })}`);
  console.log(`   Hora UTC: ${clase.fecha.getUTCHours()}:${clase.fecha.getUTCMinutes()}`);
  console.log(`   Hora local: ${clase.fecha.getHours()}:${clase.fecha.getMinutes()}`);
});

console.log('\n🧪 PRUEBA DE CREACIÓN DE FECHA:');
console.log('===============================');

// Simular creación de una fecha para jueves
const fechaJueves = '2025-07-03'; // Jueves 3 de julio
console.log(`Fecha input (jueves): ${fechaJueves}`);

// Como se crea actualmente
const fechaActual = new Date(fechaJueves);
fechaActual.setHours(12, 0, 0, 0);
console.log(`Método actual - Fecha resultante: ${fechaActual}`);
console.log(`Método actual - ISO string: ${fechaActual.toISOString()}`);
console.log(`Método actual - Día mostrado: ${fechaActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`);

// Método alternativo para asegurar la fecha correcta
const fechaCorregida = new Date(fechaJueves + 'T12:00:00.000Z');
console.log(`\nMétodo corregido - Fecha resultante: ${fechaCorregida}`);
console.log(`Método corregido - ISO string: ${fechaCorregida.toISOString()}`);
console.log(`Método corregido - Día mostrado: ${fechaCorregida.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`);

console.log('\n⏰ INFORMACIÓN DE ZONA HORARIA:');
console.log('===============================');
console.log(`Zona horaria del sistema: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
console.log(`Offset actual: ${new Date().getTimezoneOffset()} minutos`);

await mongoose.connection.close();
console.log('\n🔌 Conexión cerrada');
