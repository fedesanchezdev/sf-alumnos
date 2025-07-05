import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log('=== CREANDO PAGO CON FACTURA DIGITAL ===\n');

  // Buscar un usuario activo (Laura)
  const laura = await Usuario.findOne({ email: 'laura@gmail.com', activo: true });
  
  if (!laura) {
    console.log('❌ No se encontró el usuario Laura');
    process.exit(1);
  }

  console.log(`👤 Usuario encontrado: ${laura.nombre} ${laura.apellido}`);

  // Crear pago con factura digital (ejemplo con Google Drive)
  const nuevoPago = new Pago({
    usuario: laura._id,
    monto: 150000,
    fechaPago: new Date('2025-01-15T00:00:00.000Z'),
    fechaInicio: new Date('2025-02-01T00:00:00.000Z'),
    fechaFin: new Date('2025-02-28T00:00:00.000Z'),
    descripcion: 'Pago febrero 2025 - Laura',
    linkFactura: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing',
    activo: true
  });

  await nuevoPago.save();
  console.log(`💰 Pago creado: ID ${nuevoPago._id}`);
  console.log(`📄 Factura: ${nuevoPago.linkFactura}`);

  // Crear algunas clases para este pago
  const fechasClases = [
    new Date('2025-02-03T00:00:00.000Z'),
    new Date('2025-02-05T00:00:00.000Z'),
    new Date('2025-02-10T00:00:00.000Z'),
    new Date('2025-02-12T00:00:00.000Z'),
    new Date('2025-02-17T00:00:00.000Z'),
    new Date('2025-02-19T00:00:00.000Z'),
    new Date('2025-02-24T00:00:00.000Z'),
    new Date('2025-02-26T00:00:00.000Z')
  ];

  console.log('\n📚 Creando clases...');
  for (const fecha of fechasClases) {
    const clase = new Clase({
      usuario: laura._id,
      pago: nuevoPago._id,
      fecha: fecha,
      estado: 'no_iniciada',
      activo: true
    });
    await clase.save();
  }

  console.log(`✅ ${fechasClases.length} clases creadas para Laura`);

  // Mostrar resumen
  console.log('\n📊 RESUMEN:');
  console.log(`👤 Usuario: ${laura.nombre} ${laura.apellido}`);
  console.log(`💰 Monto: $${nuevoPago.monto.toLocaleString()}`);
  console.log(`📅 Período: ${nuevoPago.fechaInicio.toLocaleDateString()} - ${nuevoPago.fechaFin.toLocaleDateString()}`);
  console.log(`📄 Factura disponible: SÍ`);
  console.log(`📚 Clases programadas: ${fechasClases.length}`);

  console.log('\n🎯 PRUEBAS DISPONIBLES:');
  console.log('1. ✅ Ver pago en la interfaz web');
  console.log('2. ✅ Verificar botón "Descargar factura"');
  console.log('3. ✅ Probar enlace a Google Drive (ejemplo)');
  console.log('4. ✅ Editar pago y modificar link de factura');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de la base de datos');
}
