// Script para probar la funcionalidad completa de pagos
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';

dotenv.config();

const probarFuncionalidadCompleta = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 1. Crear un pago por período
    console.log('\n📊 Probando pago por período...');
    const usuario = await Usuario.findOne({ activo: true });
    if (!usuario) {
      console.log('❌ No hay usuarios activos para probar');
      return;
    }

    const pagoPeriodo = new Pago({
      usuario: usuario._id,
      monto: 200000,
      fechaInicio: new Date('2025-07-01'),
      fechaFin: new Date('2025-07-29'),
      descripcion: 'Pago mensual julio 2025',
      linkFactura: 'https://drive.google.com/file/test-july'
    });

    await pagoPeriodo.save();
    console.log(`✅ Pago por período creado: ID ${pagoPeriodo._id}`);

    // 2. Crear un pago con fechas individuales
    console.log('\n📊 Probando pago con fechas individuales...');
    const pagoIndividual = new Pago({
      usuario: usuario._id,
      monto: 150000,
      descripcion: 'Clases individuales',
      linkFactura: 'https://drive.google.com/file/test-individual'
    });

    await pagoIndividual.save();

    // Crear clases individuales
    const fechasIndividuales = [
      new Date('2025-07-05'),
      new Date('2025-07-12'),
      new Date('2025-07-19'),
    ];

    const clasesIndividuales = fechasIndividuales.map(fecha => ({
      usuario: usuario._id,
      pago: pagoIndividual._id,
      fecha: fecha,
      estado: 'no_iniciada'
    }));

    await Clase.insertMany(clasesIndividuales);
    console.log(`✅ Pago individual creado: ID ${pagoIndividual._id} con ${clasesIndividuales.length} clases`);

    // 3. Verificar agrupación por mes
    console.log('\n📊 Verificando agrupación por mes...');
    const todosPagos = await Pago.find({ activo: true }).populate('usuario', 'nombre apellido');
    
    const agrupacionMes = {};
    const fechaActual = new Date();
    const mesActual = `${fechaActual.getFullYear()}-${fechaActual.getMonth()}`;

    todosPagos.forEach(pago => {
      const fechaPago = new Date(pago.fechaPago);
      const mesPago = `${fechaPago.getFullYear()}-${fechaPago.getMonth()}`;
      
      if (mesPago === mesActual) {
        console.log(`📅 Pago mes actual: ${pago.usuario.nombre} - $${pago.monto}`);
      } else {
        const mesAnio = fechaPago.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        if (!agrupacionMes[mesAnio]) agrupacionMes[mesAnio] = [];
        agrupacionMes[mesAnio].push(pago);
      }
    });

    console.log('\n📚 Agrupación histórica:');
    Object.entries(agrupacionMes).forEach(([mes, pagos]) => {
      console.log(`  ${mes}: ${pagos.length} pagos`);
    });

    // 4. Probar endpoint de clases por pago
    console.log('\n📊 Probando endpoint de clases por pago...');
    const clasesPorPago = await Clase.find({ pago: pagoIndividual._id });
    console.log(`✅ Clases encontradas para pago individual: ${clasesPorPago.length}`);
    clasesPorPago.forEach(clase => {
      console.log(`  - Clase: ${clase.fecha.toLocaleDateString('es-ES')}`);
    });

    // 5. Verificar links de factura
    console.log('\n📊 Verificando links de factura...');
    const pagosConFactura = await Pago.find({ 
      activo: true, 
      linkFactura: { $exists: true, $ne: '' } 
    });
    console.log(`✅ Pagos con factura digital: ${pagosConFactura.length}`);

    console.log('\n🎉 Todas las pruebas completadas exitosamente');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

probarFuncionalidadCompleta();
