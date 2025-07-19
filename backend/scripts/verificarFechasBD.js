import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Clase from '../models/Clase.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  // Obtener algunas clases de Santos para ver las fechas almacenadas
  const clases = await Clase.find({ 
    usuario: '68634e20940988de411ac5ef',
    activo: true 
  })
    .sort({ fecha: 1 })
    .limit(5);

  console.log('=== FECHAS ALMACENADAS EN LA BASE DE DATOS ===\n');
  
  clases.forEach((clase, i) => {
    const fecha = clase.fecha;
    console.log(`Clase ${i + 1}:`);
    console.log(`  - Fecha almacenada: ${fecha.toISOString()}`);
    console.log(`  - UTC: ${fecha.getUTCDate()}/${fecha.getUTCMonth() + 1}/${fecha.getUTCFullYear()}`);
    console.log(`  - Local: ${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`);
    console.log(`  - toLocaleDateString(): ${fecha.toLocaleDateString()}`);
    console.log(`  - Es medianoche UTC: ${fecha.getUTCHours() === 0 && fecha.getUTCMinutes() === 0}\n`);
  });

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await mongoose.disconnect();
}
