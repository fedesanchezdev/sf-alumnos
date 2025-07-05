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
  console.log('=== CREANDO PAGOS HISTÓRICOS PARA PROBAR LA FUNCIONALIDAD ===\n');

  // Buscar usuarios
  const santos = await Usuario.findOne({ email: 'santos@gmail.com' });
  const laura = await Usuario.findOne({ email: 'laura@gmail.com' });

  if (!santos || !laura) {
    console.log('❌ No se encontraron los usuarios');
    process.exit(1);
  }

  const pagosACrear = [
    // Pago actual (julio 2025) para Santos
    {
      usuario: santos._id,
      monto: 140000,
      fechaPago: new Date('2025-07-01T00:00:00.000Z'),
      fechaInicio: new Date('2025-07-01T00:00:00.000Z'),
      fechaFin: new Date('2025-07-31T00:00:00.000Z'),
      descripcion: 'Pago julio 2025 - Santos',
      linkFactura: 'https://drive.google.com/file/d/ejemplo-julio-santos/view',
      activo: true
    },
    // Pago histórico (mayo 2025) para Laura  
    {
      usuario: laura._id,
      monto: 120000,
      fechaPago: new Date('2025-05-15T00:00:00.000Z'),
      fechaInicio: new Date('2025-05-20T00:00:00.000Z'),
      fechaFin: new Date('2025-06-15T00:00:00.000Z'),
      descripcion: 'Pago mayo 2025 - Laura',
      linkFactura: '',
      activo: true
    },
    // Pago histórico (abril 2025) para Santos
    {
      usuario: santos._id,
      monto: 110000,
      fechaPago: new Date('2025-04-10T00:00:00.000Z'),
      fechaInicio: new Date('2025-04-15T00:00:00.000Z'),
      fechaFin: new Date('2025-05-10T00:00:00.000Z'),
      descripcion: 'Pago abril 2025 - Santos',
      linkFactura: 'https://dropbox.com/s/ejemplo-abril-santos.pdf',
      activo: true
    },
    // Pago histórico (diciembre 2024) para Laura
    {
      usuario: laura._id,
      monto: 100000,
      fechaPago: new Date('2024-12-01T00:00:00.000Z'),
      fechaInicio: new Date('2024-12-05T00:00:00.000Z'),
      fechaFin: new Date('2024-12-30T00:00:00.000Z'),
      descripcion: 'Pago diciembre 2024 - Laura',
      linkFactura: '',
      activo: true
    }
  ];

  console.log('📝 Creando pagos de ejemplo...\n');

  for (const [index, pagoData] of pagosACrear.entries()) {
    const pago = new Pago(pagoData);
    await pago.save();
    
    const usuario = pagoData.usuario.equals(santos._id) ? santos : laura;
    const fechaPago = new Date(pagoData.fechaPago);
    
    console.log(`✅ Pago ${index + 1} creado:`);
    console.log(`   Usuario: ${usuario.nombre} ${usuario.apellido}`);
    console.log(`   Monto: $${pagoData.monto.toLocaleString()}`);
    console.log(`   Fecha: ${fechaPago.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`);
    console.log(`   Factura: ${pagoData.linkFactura ? 'SÍ' : 'NO'}\n`);
  }

  console.log('🎯 RESULTADO ESPERADO EN LA INTERFAZ:');
  console.log('📅 Pagos del mes actual (julio 2025): 1 pago (Santos)');
  console.log('📚 Historial:');
  console.log('   └── 2025');
  console.log('       ├── mayo 2025: 1 pago (Laura)');
  console.log('       └── abril 2025: 1 pago (Santos)');
  console.log('   └── 2024');
  console.log('       └── diciembre 2024: 1 pago (Laura)');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de la base de datos');
}
