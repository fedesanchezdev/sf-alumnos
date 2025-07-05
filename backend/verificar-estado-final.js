import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sf-alumnos');
    console.log('📊 Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const verificarEstadoFinal = async () => {
  await connectDB();

  try {
    console.log('✅ VERIFICACIÓN FINAL DEL PROBLEMA DE SANTOS\n');

    const pagoId = '68674ab224925513fe4587cc';

    // Usar directamente la conexión de mongoose
    const db = mongoose.connection.db;
    
    console.log('📋 ESTADO ACTUAL:');
    
    // Verificar pago
    const pago = await db.collection('pagos').findOne({ _id: new mongoose.Types.ObjectId(pagoId) });
    console.log(`Pago: $${pago.monto}`);
    console.log(`Descripción: ${pago.descripcion}`);
    console.log(`Período: ${pago.fechaInicio?.toISOString().split('T')[0]} - ${pago.fechaFin?.toISOString().split('T')[0]}`);
    if (pago.linkFactura) {
      console.log(`Factura: ✅ ${pago.linkFactura}`);
    } else {
      console.log(`Factura: ❌ Sin factura`);
    }

    // Verificar clases
    const clases = await db.collection('clases')
      .find({ pago: new mongoose.Types.ObjectId(pagoId) })
      .sort({ fecha: 1 })
      .toArray();
    
    console.log(`\nClases: ${clases.length}`);
    clases.forEach((clase, index) => {
      console.log(`  ${index + 1}. ${clase.fecha.toISOString().split('T')[0]} (${clase.estado})`);
    });

    // Verificar duplicados
    const conteoFechas = {};
    clases.forEach(clase => {
      const fechaStr = clase.fecha.toISOString().split('T')[0];
      conteoFechas[fechaStr] = (conteoFechas[fechaStr] || 0) + 1;
    });

    const duplicados = Object.entries(conteoFechas).filter(([fecha, count]) => count > 1);
    
    console.log('\n🔍 RESUMEN DE PROBLEMAS:');
    
    // 1. Problema de fechas duplicadas
    if (duplicados.length === 0) {
      console.log('✅ Fechas duplicadas: RESUELTO');
    } else {
      console.log('❌ Fechas duplicadas: AÚN PRESENTE');
      duplicados.forEach(([fecha, count]) => {
        console.log(`   ${fecha}: ${count} clases`);
      });
    }

    // 2. Problema de cantidad de clases
    if (clases.length === 4) {
      console.log('✅ Cantidad de clases: CORRECTO (4 clases del 3 al 24)');
    } else {
      console.log(`❌ Cantidad de clases: INCORRECTO (${clases.length} clases, debería ser 4)`);
    }

    // 3. Problema de factura
    if (pago.linkFactura && pago.linkFactura !== 'Sin factura') {
      console.log('✅ Factura visible: RESUELTO');
    } else {
      console.log('❌ Factura visible: AÚN FALTA');
    }

    console.log('\n📱 PARA PROBAR EN EL FRONTEND:');
    console.log('1. Ve a la sección de Gestión de Pagos');
    console.log('2. Busca el pago de Santos de $82,000');
    console.log('3. Haz clic en "Editar"');
    console.log('4. SIN CAMBIAR NADA, haz clic en "Guardar"');
    console.log('5. Verifica que no se dupliquen las clases');
    console.log('\n💡 Con las mejoras implementadas, la edición sin cambios no debería regenerar clases.');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

verificarEstadoFinal();
