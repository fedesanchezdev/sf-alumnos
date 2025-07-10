// Script para verificar la funcionalidad de pagos después de las correcciones
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';

dotenv.config();

const verificarFuncionalidad = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar usuarios activos
    const usuariosActivos = await Usuario.find({ activo: true }).countDocuments();
    console.log(`📋 Usuarios activos: ${usuariosActivos}`);

    // Verificar pagos por mes
    const pagos = await Pago.find({ activo: true })
      .populate('usuario', 'nombre apellido email')
      .sort({ fechaPago: -1 });

    console.log(`💰 Total de pagos activos: ${pagos.length}`);

    // Agrupar por mes para verificar la lógica
    const pagosPorMes = {};
    const ahora = new Date();
    const mesActual = `${ahora.getFullYear()}-${ahora.getMonth()}`;

    pagos.forEach(pago => {
      const fechaPago = new Date(pago.fechaPago);
      const mesPago = `${fechaPago.getFullYear()}-${fechaPago.getMonth()}`;
      
      if (mesPago === mesActual) {
        console.log(`📅 Pago del mes actual: ${pago.usuario.nombre} ${pago.usuario.apellido} - $${pago.monto}`);
      } else {
        const mesAnio = fechaPago.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        if (!pagosPorMes[mesAnio]) {
          pagosPorMes[mesAnio] = [];
        }
        pagosPorMes[mesAnio].push(pago);
      }
    });

    console.log('\n📚 Pagos históricos por mes:');
    Object.entries(pagosPorMes).forEach(([mesAnio, pagosMes]) => {
      console.log(`  ${mesAnio}: ${pagosMes.length} pagos`);
      pagosMes.forEach(pago => {
        console.log(`    - ${pago.usuario.nombre} ${pago.usuario.apellido}: $${pago.monto}${pago.linkFactura ? ' 📄' : ''}`);
      });
    });

    // Verificar clases activas
    const clasesActivas = await Clase.find({ activo: true }).countDocuments();
    console.log(`\n🎓 Clases activas: ${clasesActivas}`);

    // Verificar pagos con facturas
    const pagosConFactura = await Pago.find({ 
      activo: true, 
      linkFactura: { $exists: true, $ne: '' } 
    }).countDocuments();
    console.log(`📄 Pagos con factura digital: ${pagosConFactura}`);

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

verificarFuncionalidad();
