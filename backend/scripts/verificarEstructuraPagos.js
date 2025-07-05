import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Pago from '../models/Pago.js';
import Usuario from '../models/Usuario.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log('=== VERIFICAR PAGOS PARA TESTING DE INTERFAZ ===\n');

  const pagos = await Pago.find({ activo: true })
    .populate('usuario', 'nombre apellido email')
    .sort({ fechaPago: -1 });

  console.log(`📊 Total de pagos activos: ${pagos.length}\n`);

  // Agrupar por mes/año para ver la estructura
  const estructura = {};
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  pagos.forEach(pago => {
    const fecha = new Date(pago.fechaPago);
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    
    const esMesActual = (mes === mesActual && anio === anioActual);
    const categoria = esMesActual ? 'MES_ACTUAL' : `${anio}_${fecha.toLocaleDateString('es-ES', { month: 'long' })}`;
    
    if (!estructura[categoria]) {
      estructura[categoria] = [];
    }
    
    estructura[categoria].push({
      usuario: `${pago.usuario.nombre} ${pago.usuario.apellido}`,
      monto: pago.monto,
      fecha: fecha.toLocaleDateString('es-ES'),
      factura: pago.linkFactura ? 'SÍ' : 'NO'
    });
  });

  // Mostrar estructura
  console.log('📅 ESTRUCTURA ESPERADA EN LA INTERFAZ:\n');

  if (estructura.MES_ACTUAL) {
    console.log(`🔵 MES ACTUAL (${ahora.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}) - ABIERTO:`);
    estructura.MES_ACTUAL.forEach((pago, i) => {
      console.log(`   ${i + 1}. ${pago.usuario} - $${pago.monto.toLocaleString()} (${pago.fecha}) [Factura: ${pago.factura}]`);
    });
    console.log();
  }

  console.log('📚 HISTORIAL (más recientes primero):');
  
  // Ordenar categorías históricas
  const categoriesHistoricas = Object.keys(estructura)
    .filter(cat => cat !== 'MES_ACTUAL')
    .sort((a, b) => {
      const [anioA] = a.split('_');
      const [anioB] = b.split('_');
      return parseInt(anioB) - parseInt(anioA); // Más recientes primero
    });

  const aniosPorCategoria = {};
  categoriesHistoricas.forEach(cat => {
    const [anio, mes] = cat.split('_');
    if (!aniosPorCategoria[anio]) {
      aniosPorCategoria[anio] = [];
    }
    aniosPorCategoria[anio].push({ categoria: cat, mes });
  });

  Object.entries(aniosPorCategoria).forEach(([anio, meses]) => {
    console.log(`   📅 Año ${anio}:`);
    meses.forEach(({ categoria, mes }) => {
      console.log(`      📆 ${mes} ${anio}:`);
      estructura[categoria].forEach((pago, i) => {
        console.log(`         ${i + 1}. ${pago.usuario} - $${pago.monto.toLocaleString()} (${pago.fecha}) [Factura: ${pago.factura}]`);
      });
    });
    console.log();
  });

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('🔌 Desconectado de la base de datos');
}
