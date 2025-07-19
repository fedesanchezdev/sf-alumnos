// Script para verificar la asociación de clases con pagos
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';

dotenv.config();

const verificarClasesYPagos = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener un pago específico para verificar
    const pagos = await Pago.find({ activo: true })
      .populate('usuario', 'nombre apellido email')
      .limit(5);

    console.log(`\n📊 Verificando ${pagos.length} pagos:`);

    for (const pago of pagos) {
      console.log(`\n💰 Pago: ${pago.usuario.nombre} ${pago.usuario.apellido} - $${pago.monto}`);
      console.log(`   ID: ${pago._id}`);
      console.log(`   Fecha: ${pago.fechaPago.toLocaleDateString('es-ES')}`);
      
      // Buscar clases asociadas a este pago
      const clases = await Clase.find({ pago: pago._id, activo: true });
      console.log(`   🎓 Clases asociadas: ${clases.length}`);
      
      if (clases.length > 0) {
        clases.forEach((clase, index) => {
          console.log(`     ${index + 1}. ${clase.fecha.toLocaleDateString('es-ES')} - ${clase.estado}`);
        });
      } else {
        console.log(`     ⚠️  No hay clases asociadas a este pago`);
        
        // Verificar si hay clases del usuario en general
        const clasesUsuario = await Clase.find({ usuario: pago.usuario._id, activo: true }).limit(3);
        console.log(`     📚 Clases del usuario en total: ${clasesUsuario.length}`);
        if (clasesUsuario.length > 0) {
          clasesUsuario.forEach((clase, index) => {
            console.log(`       ${index + 1}. ${clase.fecha.toLocaleDateString('es-ES')} - Pago: ${clase.pago || 'Sin asignar'}`);
          });
        }
      }
    }

    // Verificar estructura de clases
    console.log('\n📊 Resumen general:');
    const totalClases = await Clase.countDocuments({ activo: true });
    const clasesConPago = await Clase.countDocuments({ activo: true, pago: { $exists: true, $ne: null } });
    const clasesSinPago = await Clase.countDocuments({ activo: true, pago: { $exists: false } });

    console.log(`   📚 Total clases activas: ${totalClases}`);
    console.log(`   🔗 Clases con pago asignado: ${clasesConPago}`);
    console.log(`   ❓ Clases sin pago: ${clasesSinPago}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

verificarClasesYPagos();
