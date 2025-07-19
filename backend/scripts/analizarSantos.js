import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Clase from '../models/Clase.js';
import Pago from '../models/Pago.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  const usuarioId = '68634e20940988de411ac5ef'; // Santos
  
  console.log('=== ANÁLISIS COMPLETO DE SANTOS ===\n');
  
  // 1. Verificar pagos
  const pagosActivos = await Pago.find({ usuario: usuarioId, activo: true });
  const pagosInactivos = await Pago.find({ usuario: usuarioId, activo: false });
  
  console.log('💰 PAGOS:');
  console.log(`  - Pagos activos: ${pagosActivos.length}`);
  console.log(`  - Pagos eliminados (inactivos): ${pagosInactivos.length}`);
  
  if (pagosActivos.length > 0) {
    console.log('\n  Pagos activos:');
    pagosActivos.forEach(pago => {
      console.log(`    • ${pago._id}: $${pago.monto} - ${pago.descripcion}`);
    });
  }
  
  if (pagosInactivos.length > 0) {
    console.log('\n  Pagos eliminados:');
    pagosInactivos.forEach(pago => {
      console.log(`    • ${pago._id}: $${pago.monto} - ${pago.descripcion}`);
    });
  }
  
  // 2. Verificar clases
  const clasesActivas = await Clase.find({ usuario: usuarioId, activo: true })
    .populate('pago', '_id monto descripcion activo');
  const clasesInactivas = await Clase.find({ usuario: usuarioId, activo: false });
  
  console.log(`\n📅 CLASES:`);
  console.log(`  - Clases activas: ${clasesActivas.length}`);
  console.log(`  - Clases eliminadas (inactivas): ${clasesInactivas.length}`);
  
  if (clasesActivas.length > 0) {
    console.log('\n  Clases activas:');
    clasesActivas.forEach((clase, i) => {
      const pagoInfo = clase.pago ? 
        `Pago: ${clase.pago._id} (${clase.pago.activo ? 'ACTIVO' : 'ELIMINADO'})` : 
        'SIN PAGO';
      console.log(`    ${i + 1}. ${clase.fecha.toISOString().split('T')[0]} - ${pagoInfo}`);
    });
  }
  
  // 3. Detectar problema
  const clasesHuerfanas = clasesActivas.filter(clase => !clase.pago || !clase.pago.activo);
  
  if (clasesHuerfanas.length > 0) {
    console.log(`\n⚠️  PROBLEMA DETECTADO:`);
    console.log(`  • ${clasesHuerfanas.length} clases activas sin pago activo asociado`);
    console.log(`  • Estas clases deberían haberse marcado como inactivas`);
    console.log(`\n🔧 Solución: Ejecutar limpieza de clases huérfanas`);
  }

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await mongoose.disconnect();
}
