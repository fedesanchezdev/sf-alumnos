// Script para probar la creación de pagos con fechas corregidas
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';
import Usuario from '../models/Usuario.js';

dotenv.config();

// Conectar a MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB');

// Función corregida (copiada del controlador)
const ajustarFecha = (fecha) => {
  if (typeof fecha === 'string') {
    const fechaConHora = fecha.includes('T') ? fecha : fecha + 'T12:00:00.000Z';
    return new Date(fechaConHora);
  }
  
  const fechaAjustada = new Date(fecha);
  fechaAjustada.setHours(12, 0, 0, 0);
  return fechaAjustada;
};

console.log('🧪 PRUEBA DE CREACIÓN DE PAGO CON FECHAS CORREGIDAS');
console.log('==================================================\n');

// Obtener el usuario Santos para la prueba
const santos = await Usuario.findOne({ email: 'santos@gmail.com' });
if (!santos) {
  console.log('❌ Usuario Santos no encontrado');
  await mongoose.connection.close();
  process.exit(1);
}

console.log(`👤 Usuario encontrado: ${santos.nombre} ${santos.apellido}`);

// Simular la creación de clases individuales para jueves
const fechasJueves = [
  '2025-07-03', // Jueves
  '2025-07-10', // Jueves  
  '2025-07-17', // Jueves
  '2025-07-24', // Jueves
];

console.log('\n📅 Fechas a crear (todas deberían ser jueves):');
fechasJueves.forEach((fecha, index) => {
  const fechaAjustada = ajustarFecha(fecha);
  console.log(`${index + 1}. Input: ${fecha} → ${fechaAjustada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`);
});

// Crear un pago de prueba
const pagoData = {
  usuario: santos._id,
  monto: 120000,
  descripcion: 'Pago de prueba - Fechas corregidas',
  fechaPago: new Date()
};

const pago = new Pago(pagoData);
await pago.save();

console.log(`\n💰 Pago creado: ID ${pago._id}`);

// Crear las clases con fechas corregidas
const clasesParaCrear = fechasJueves.map(fecha => ({
  usuario: santos._id,
  pago: pago._id,
  fecha: ajustarFecha(fecha),
  estado: 'no_iniciada'
}));

await Clase.insertMany(clasesParaCrear);

console.log(`\n📚 ${clasesParaCrear.length} clases creadas exitosamente`);

// Verificar las clases creadas
const clasesCreadas = await Clase.find({ pago: pago._id }).sort({ fecha: 1 });

console.log('\n✅ VERIFICACIÓN DE CLASES CREADAS:');
console.log('==================================');

clasesCreadas.forEach((clase, index) => {
  console.log(`${index + 1}. Fecha almacenada: ${clase.fecha}`);
  console.log(`   Día mostrado: ${clase.fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`);
  console.log(`   ISO: ${clase.fecha.toISOString()}\n`);
});

// Verificar que todas son jueves
const todosJueves = clasesCreadas.every(clase => 
  clase.fecha.toLocaleDateString('es-ES', { weekday: 'long' }) === 'jueves'
);

console.log(`🎯 ¿Todas las clases son jueves? ${todosJueves ? '✅ SÍ' : '❌ NO'}`);

if (todosJueves) {
  console.log('🎉 ¡CORRECCIÓN EXITOSA! Las fechas se guardan correctamente.');
} else {
  console.log('❌ Aún hay problemas con las fechas.');
}

await mongoose.connection.close();
console.log('\n🔌 Conexión cerrada');
