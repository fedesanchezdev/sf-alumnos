import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log('=== CREANDO PAGO PARA EL MES ACTUAL (JULIO 2025) ===\n');

  const santos = await Usuario.findOne({ email: 'santos@gmail.com' });
  
  if (!santos) {
    console.log('❌ No se encontró el usuario Santos');
    process.exit(1);
  }

  // Crear pago para julio 2025 (mes actual)
  const pagoJulio = new Pago({
    usuario: santos._id,
    monto: 160000,
    fechaPago: new Date('2025-07-15T00:00:00.000Z'), // 15 de julio 2025
    fechaInicio: new Date('2025-07-01T00:00:00.000Z'),
    fechaFin: new Date('2025-07-31T00:00:00.000Z'),
    descripcion: 'Pago julio 2025 - Santos (mes actual)',
    linkFactura: 'https://drive.google.com/file/d/ejemplo-julio-2025/view',
    activo: true
  });

  await pagoJulio.save();

  console.log('✅ Pago del mes actual creado:');
  console.log(`   Usuario: ${santos.nombre} ${santos.apellido}`);
  console.log(`   Monto: $${pagoJulio.monto.toLocaleString()}`);
  console.log(`   Fecha: ${pagoJulio.fechaPago.toLocaleDateString('es-ES')}`);
  console.log(`   Mes: ${pagoJulio.fechaPago.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`);
  console.log(`   Factura: SÍ`);

  console.log('\n🎯 RESULTADO ESPERADO EN LA INTERFAZ:');
  console.log('🔵 MES ACTUAL (julio 2025) - ABIERTO POR DEFECTO:');
  console.log('   └── Santos - $160.000 con factura');
  console.log('📚 HISTORIAL (más recientes primero):');
  console.log('   ├── 2025: junio, mayo, abril, enero');
  console.log('   └── 2024: noviembre');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de la base de datos');
}
