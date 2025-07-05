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

const corregirProblemasSantos = async () => {
  await connectDB();

  try {
    // Buscar usuario Santos
    const santos = await Usuario.findOne({
      $or: [
        { nombre: { $regex: /santos/i } },
        { apellido: { $regex: /santos/i } }
      ]
    });

    if (!santos) {
      console.log('❌ Usuario Santos no encontrado');
      return;
    }

    console.log('👤 Trabajando con usuario:', santos.nombre, santos.apellido);

    // Buscar las clases duplicadas del 2025-07-03
    const fechaDuplicada = new Date('2025-07-03');
    const clasesDuplicadas = await Clase.find({
      usuario: santos._id,
      fecha: fechaDuplicada
    });

    console.log(`\n🔍 Clases encontradas para el 2025-07-03: ${clasesDuplicadas.length}`);

    if (clasesDuplicadas.length > 1) {
      console.log('📋 Detalles de las clases duplicadas:');
      clasesDuplicadas.forEach((clase, index) => {
        console.log(`  ${index + 1}. ID: ${clase._id} - Estado: ${clase.estado} - Pago: ${clase.pago}`);
      });

      // Preguntar qué hacer con las duplicadas
      console.log('\n⚠️  OPCIONES DE CORRECCIÓN:');
      console.log('1. Eliminar la clase duplicada (no_iniciada)');
      console.log('2. Cambiar la fecha de la clase duplicada');
      console.log('3. Solo mostrar información sin cambios');
      
      // Por seguridad, solo mostramos la información por ahora
      console.log('\n🛡️  Por seguridad, solo mostramos la información. Para hacer cambios, descomenta las líneas correspondientes.');
      
      // Para eliminar la clase duplicada (no_iniciada):
      /*
      const claseAEliminar = clasesDuplicadas.find(c => c.estado === 'no_iniciada');
      if (claseAEliminar) {
        await Clase.deleteOne({ _id: claseAEliminar._id });
        console.log(`✅ Eliminada clase duplicada: ${claseAEliminar._id}`);
      }
      */

      // Para cambiar la fecha de la clase duplicada:
      /*
      const claseACambiar = clasesDuplicadas.find(c => c.estado === 'no_iniciada');
      if (claseACambiar) {
        const nuevaFecha = new Date('2025-07-31'); // O la fecha que desees
        await Clase.updateOne(
          { _id: claseACambiar._id },
          { fecha: nuevaFecha }
        );
        console.log(`✅ Cambiada fecha de clase ${claseACambiar._id} a ${nuevaFecha.toISOString().split('T')[0]}`);
      }
      */
    }

    // Mostrar información sobre facturas
    console.log('\n💰 INFORMACIÓN SOBRE FACTURAS:');
    const pagosConFactura = await Pago.find({
      usuario: santos._id,
      linkFactura: { $exists: true, $ne: null, $ne: 'Sin factura', $ne: '' }
    }).sort({ fechaPago: -1 });

    if (pagosConFactura.length > 0) {
      console.log(`📄 Pagos con factura encontrados: ${pagosConFactura.length}`);
      pagosConFactura.forEach((pago, index) => {
        console.log(`  ${index + 1}. Pago: $${pago.monto} - Fecha: ${pago.fechaPago.toISOString().split('T')[0]}`);
        console.log(`     Factura: ${pago.linkFactura}`);
        console.log(`     Descripción: ${pago.descripcion || 'Sin descripción'}`);
      });

      // Verificar si el último pago (por fecha) tiene factura
      const ultimoPago = await Pago.findOne({ usuario: santos._id }).sort({ fechaPago: -1 });
      console.log(`\n🔍 ÚLTIMO PAGO: ${ultimoPago._id}`);
      console.log(`   Monto: $${ultimoPago.monto}`);
      console.log(`   Fecha: ${ultimoPago.fechaPago}`);
      console.log(`   Factura: ${ultimoPago.linkFactura || 'SIN FACTURA'}`);
      
      if (!ultimoPago.linkFactura || ultimoPago.linkFactura === 'Sin factura') {
        console.log('⚠️  El último pago NO tiene factura asignada.');
        console.log('💡 Posible solución: Asignar la factura de otro pago o crear una nueva.');
      }

    } else {
      console.log('❌ No se encontraron pagos con facturas para Santos');
    }

  } catch (error) {
    console.error('❌ Error en corrección:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

// Ejecutar corrección
corregirProblemasSantos();
