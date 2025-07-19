// Script para probar la nueva validación de pagos sin clases
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';

dotenv.config();

const probarValidacionPagos = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const usuario = await Usuario.findOne({ activo: true });
    if (!usuario) {
      console.log('❌ No hay usuarios activos para probar');
      return;
    }

    console.log('\n🧪 Probando validación de pagos...');

    // Caso 1: Intentar crear pago sin fechas (debería fallar)
    console.log('\n📋 Caso 1: Pago sin fechas de clases');
    try {
      const pagoSinClases = new Pago({
        usuario: usuario._id,
        monto: 100000,
        descripcion: 'Pago sin clases - debería fallar'
      });
      
      await pagoSinClases.save();
      console.log('❌ ERROR: Se permitió crear pago sin clases');
      
      // Limpiar si se creó
      await Pago.findByIdAndDelete(pagoSinClases._id);
      
    } catch (error) {
      console.log('✅ CORRECTO: No se permite crear pago sin clases');
    }

    // Caso 2: Crear pago con período (debería funcionar)
    console.log('\n📋 Caso 2: Pago con período válido');
    try {
      const pagoConPeriodo = new Pago({
        usuario: usuario._id,
        monto: 150000,
        fechaInicio: new Date('2025-08-01'),
        fechaFin: new Date('2025-08-29'),
        descripcion: 'Pago con período - debería funcionar'
      });
      
      await pagoConPeriodo.save();
      
      // Simular creación de clases (esto normalmente lo hace el controlador)
      const clases = [
        { usuario: usuario._id, pago: pagoConPeriodo._id, fecha: new Date('2025-08-01'), estado: 'no_iniciada' },
        { usuario: usuario._id, pago: pagoConPeriodo._id, fecha: new Date('2025-08-08'), estado: 'no_iniciada' },
        { usuario: usuario._id, pago: pagoConPeriodo._id, fecha: new Date('2025-08-15'), estado: 'no_iniciada' },
        { usuario: usuario._id, pago: pagoConPeriodo._id, fecha: new Date('2025-08-22'), estado: 'no_iniciada' },
        { usuario: usuario._id, pago: pagoConPeriodo._id, fecha: new Date('2025-08-29'), estado: 'no_iniciada' }
      ];
      
      await Clase.insertMany(clases);
      console.log('✅ CORRECTO: Pago con período creado exitosamente');
      console.log(`   💰 Pago ID: ${pagoConPeriodo._id}`);
      console.log(`   📚 Clases creadas: ${clases.length}`);
      
    } catch (error) {
      console.log('❌ ERROR: No se pudo crear pago con período:', error.message);
    }

    // Caso 3: Verificar total de pagos y clases
    console.log('\n📊 Resumen después de las pruebas:');
    const totalPagos = await Pago.countDocuments({ activo: true });
    const totalClases = await Clase.countDocuments({ activo: true });
    const clasesConPago = await Clase.countDocuments({ activo: true, pago: { $exists: true, $ne: null } });
    
    console.log(`   💰 Total pagos activos: ${totalPagos}`);
    console.log(`   📚 Total clases activas: ${totalClases}`);
    console.log(`   🔗 Clases con pago asignado: ${clasesConPago}`);

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

probarValidacionPagos();
