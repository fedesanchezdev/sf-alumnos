import mongoose from 'mongoose';
import dotenv from 'dotenv';
  console.log('💡 RECOMENDACIÓN:');
  console.log('Para un sistema de gestión de alumnos, es mejor mantener');
  console.log('los datos inactivos para historial y auditoría.');
  console.log('\nSi necesitas limpiar, ejecuta: node scripts/limpiarDatosInactivos.js');
  }rt Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log('=== GESTIÓN DE DATOS INACTIVOS ===\n');

  // Contar registros inactivos
  const pagosInactivos = await Pago.countDocuments({ activo: false });
  const clasesInactivas = await Clase.countDocuments({ activo: false });

  console.log('📊 ESTADO ACTUAL:');
  console.log(`  - Pagos inactivos: ${pagosInactivos}`);
  console.log(`  - Clases inactivas: ${clasesInactivas}\n`);

  if (pagosInactivos === 0 && clasesInactivas === 0) {
    console.log('✅ No hay datos inactivos para limpiar');
  } else {

  // Mostrar detalles de datos inactivos
  if (pagosInactivos > 0) {
    console.log('💰 PAGOS INACTIVOS:');
    const pagos = await Pago.find({ activo: false })
      .populate('usuario', 'nombre apellido email')
      .sort({ fechaPago: -1 });
    
    pagos.forEach((pago, i) => {
      console.log(`  ${i + 1}. ${pago.usuario.nombre} ${pago.usuario.apellido}`);
      console.log(`     Monto: $${pago.monto.toLocaleString()}`);
      console.log(`     Fecha: ${pago.fechaPago.toLocaleDateString()}`);
      console.log(`     ID: ${pago._id}\n`);
    });
  }

  if (clasesInactivas > 0) {
    console.log('📚 CLASES INACTIVAS:');
    const clases = await Clase.find({ activo: false })
      .populate('usuario', 'nombre apellido')
      .sort({ fecha: -1 })
      .limit(10); // Solo mostrar las primeras 10
    
    clases.forEach((clase, i) => {
      console.log(`  ${i + 1}. ${clase.usuario.nombre} ${clase.usuario.apellido}`);
      console.log(`     Fecha: ${clase.fecha.toLocaleDateString()}`);
      console.log(`     Estado: ${clase.estado}`);
      console.log(`     ID: ${clase._id}\n`);
    });
    
    if (clasesInactivas > 10) {
      console.log(`     ... y ${clasesInactivas - 10} más\n`);
    }
  }

  console.log('🔧 OPCIONES DISPONIBLES:');
  console.log('1. Mantener datos inactivos (recomendado para auditoría)');
  console.log('2. Eliminar datos inactivos (libera espacio)');
  console.log('3. Archivar datos antiguos (> 1 año)');
  console.log('\n💡 RECOMENDACIÓN:');
  console.log('Para un sistema de gestión de alumnos, es mejor mantener');
  console.log('los datos inactivos para historial y auditoría.');
  console.log('\nSi necesitas limpiar, ejecuta: node scripts/limpiarDatosInactivos.js');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de la base de datos');
}
