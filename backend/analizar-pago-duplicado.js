import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Conectar a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sf-alumnos');
    console.log('📊 Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Definir esquemas simplificados
const usuarioSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: String
}, { collection: 'usuarios' });

const pagoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  monto: Number,
  fechaPago: Date,
  descripcion: String,
  linkFactura: String
}, { collection: 'pagos' });

const claseSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  pago: { type: mongoose.Schema.Types.ObjectId, ref: 'Pago' },
  fecha: Date,
  estado: String
}, { collection: 'clases' });

const Usuario = mongoose.model('Usuario', usuarioSchema);
const Pago = mongoose.model('Pago', pagoSchema);
const Clase = mongoose.model('Clase', claseSchema);

const analizarPagoConClasesDuplicadas = async () => {
  await connectDB();

  try {
    // Buscar el pago específico que tiene las 5 clases con fechas duplicadas
    const pagoId = '68674ab224925513fe4587cc';
    
    console.log(`🔍 Analizando pago específico: ${pagoId}`);
    
    const pago = await Pago.findById(pagoId).populate('usuario');
    if (!pago) {
      console.log('❌ Pago no encontrado');
      return;
    }

    console.log('💰 Información del pago:');
    console.log(`   ID: ${pago._id}`);
    console.log(`   Usuario: ${pago.usuario.nombre} ${pago.usuario.apellido}`);
    console.log(`   Monto: $${pago.monto}`);
    console.log(`   Fecha: ${pago.fechaPago}`);
    console.log(`   Descripción: ${pago.descripcion || 'Sin descripción'}`);
    console.log(`   Factura: ${pago.linkFactura || 'SIN FACTURA'}`);

    // Buscar todas las clases de este pago
    const clases = await Clase.find({ pago: pagoId }).sort({ fecha: 1 });
    console.log(`\n📚 Clases del pago: ${clases.length}`);

    const fechasContadas = {};
    clases.forEach((clase, index) => {
      const fechaStr = clase.fecha.toISOString().split('T')[0];
      if (!fechasContadas[fechaStr]) {
        fechasContadas[fechaStr] = 0;
      }
      fechasContadas[fechaStr]++;
      
      console.log(`   ${index + 1}. ${fechaStr} (${clase.estado}) - ID: ${clase._id}`);
    });

    // Mostrar resumen de fechas
    console.log('\n📅 Resumen de fechas:');
    Object.entries(fechasContadas).forEach(([fecha, cantidad]) => {
      const marca = cantidad > 1 ? '⚠️ ' : '✅ ';
      console.log(`   ${marca}${fecha}: ${cantidad} clase(s)`);
    });

    // Proponer corrección para las fechas duplicadas
    const fechasDuplicadas = Object.entries(fechasContadas).filter(([fecha, cantidad]) => cantidad > 1);
    
    if (fechasDuplicadas.length > 0) {
      console.log('\n🛠️  OPCIONES DE CORRECCIÓN:');
      console.log('1. Eliminar clases duplicadas (mantener solo una por fecha)');
      console.log('2. Redistribuir las clases en fechas diferentes');
      console.log('3. Cambiar a fechas de julio que no estén ocupadas');
      
      // Sugerir fechas disponibles en julio
      const fechasOcupadas = Object.keys(fechasContadas);
      const fechasSugeridas = [];
      
      for (let dia = 1; dia <= 31; dia++) {
        const fecha = `2025-07-${dia.toString().padStart(2, '0')}`;
        if (!fechasOcupadas.includes(fecha)) {
          fechasSugeridas.push(fecha);
        }
      }
      
      console.log('\n📆 Fechas disponibles en julio para redistribuir:');
      fechasSugeridas.slice(0, 10).forEach(fecha => {
        console.log(`   - ${fecha}`);
      });

      // Ejemplo de cómo corregir (comentado por seguridad)
      console.log('\n💡 Para aplicar correcciones, descomenta las líneas correspondientes en el código.');
      
      /*
      // Ejemplo: Eliminar la segunda clase del 2025-07-03
      const clasesDel3Julio = clases.filter(c => c.fecha.toISOString().split('T')[0] === '2025-07-03');
      if (clasesDel3Julio.length > 1) {
        const claseAEliminar = clasesDel3Julio[1]; // La segunda clase
        await Clase.deleteOne({ _id: claseAEliminar._id });
        console.log(`✅ Eliminada clase duplicada: ${claseAEliminar._id}`);
      }
      */

      /*
      // Ejemplo: Cambiar fecha de una clase duplicada
      const clasesDel3Julio = clases.filter(c => c.fecha.toISOString().split('T')[0] === '2025-07-03');
      if (clasesDel3Julio.length > 1) {
        const claseACambiar = clasesDel3Julio[1]; // La segunda clase
        const nuevaFecha = new Date('2025-07-31'); // Fecha libre
        await Clase.updateOne(
          { _id: claseACambiar._id },
          { fecha: nuevaFecha }
        );
        console.log(`✅ Cambiada fecha de clase ${claseACambiar._id} a ${nuevaFecha.toISOString().split('T')[0]}`);
      }
      */
    }

  } catch (error) {
    console.error('❌ Error en análisis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

// Ejecutar análisis
analizarPagoConClasesDuplicadas();
