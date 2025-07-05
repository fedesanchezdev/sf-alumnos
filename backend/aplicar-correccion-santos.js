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

// Definir esquemas
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

const corregirSantos = async () => {
  await connectDB();

  try {
    console.log('🔧 INICIANDO CORRECCIÓN DE PROBLEMAS DE SANTOS\n');

    // 1. Corregir clases duplicadas
    console.log('📅 PASO 1: Corregir fechas duplicadas');
    
    const pagoProblematico = '68674ab224925513fe4587cc';
    const clasesDuplicadas = await Clase.find({
      pago: pagoProblematico,
      fecha: new Date('2025-07-03')
    }).sort({ _id: 1 }); // Ordenar por ID para tener consistencia

    if (clasesDuplicadas.length > 1) {
      console.log(`   Encontradas ${clasesDuplicadas.length} clases duplicadas el 2025-07-03`);
      
      // Mantener la primera (tomada) y cambiar la fecha de la segunda
      const claseACambiar = clasesDuplicadas[1]; // La segunda clase (no_iniciada)
      const nuevaFecha = new Date('2025-07-31'); // Mover al 31 de julio
      
      const resultado = await Clase.updateOne(
        { _id: claseACambiar._id },
        { fecha: nuevaFecha }
      );

      if (resultado.modifiedCount > 0) {
        console.log(`   ✅ Cambiada fecha de clase ${claseACambiar._id}`);
        console.log(`      De: 2025-07-03 → A: 2025-07-31`);
      } else {
        console.log(`   ❌ No se pudo cambiar la fecha de la clase`);
      }
    } else {
      console.log('   ✅ No hay clases duplicadas que corregir');
    }

    // 2. Corregir problema de factura
    console.log('\n💰 PASO 2: Corregir problema de factura');
    
    // Buscar usuario Santos
    const santos = await Usuario.findOne({
      nombre: { $regex: /santos/i }
    });

    // Obtener el pago con clases (que es el problemático sin factura)
    const pagoSinFactura = await Pago.findById(pagoProblematico);
    console.log(`   Pago sin factura: ${pagoSinFactura._id} - $${pagoSinFactura.monto}`);

    // Obtener el pago más reciente que SÍ tiene factura
    const pagoConFactura = await Pago.findOne({
      usuario: santos._id,
      linkFactura: { $exists: true, $ne: null, $ne: 'Sin factura', $ne: '' }
    }).sort({ fechaPago: -1 });

    if (pagoConFactura && pagoSinFactura) {
      console.log(`   Pago con factura: ${pagoConFactura._id} - $${pagoConFactura.monto}`);
      console.log(`   Factura: ${pagoConFactura.linkFactura}`);

      // Opción 1: Copiar la factura del pago más reciente al pago problemático
      const resultadoFactura = await Pago.updateOne(
        { _id: pagoProblematico },
        { 
          linkFactura: pagoConFactura.linkFactura,
          descripcion: `${pagoSinFactura.descripcion} - Factura agregada desde pago ${pagoConFactura._id.toString().slice(-6)}`
        }
      );

      if (resultadoFactura.modifiedCount > 0) {
        console.log(`   ✅ Factura agregada al pago problemático`);
        console.log(`      Factura: ${pagoConFactura.linkFactura}`);
      } else {
        console.log(`   ❌ No se pudo agregar la factura`);
      }
    }

    // 3. Verificar resultado final
    console.log('\n🔍 PASO 3: Verificar correcciones');
    
    // Verificar clases del pago corregido
    const clasesCorregidas = await Clase.find({ pago: pagoProblematico }).sort({ fecha: 1 });
    console.log(`   Clases después de corrección: ${clasesCorregidas.length}`);
    
    const fechasFinales = {};
    clasesCorregidas.forEach((clase, index) => {
      const fechaStr = clase.fecha.toISOString().split('T')[0];
      if (!fechasFinales[fechaStr]) {
        fechasFinales[fechaStr] = 0;
      }
      fechasFinales[fechaStr]++;
      console.log(`   ${index + 1}. ${fechaStr} (${clase.estado})`);
    });

    // Verificar que no hay duplicados
    const hayDuplicados = Object.values(fechasFinales).some(count => count > 1);
    console.log(`   Fechas duplicadas: ${hayDuplicados ? '❌ SÍ' : '✅ NO'}`);

    // Verificar factura
    const pagoFinal = await Pago.findById(pagoProblematico);
    console.log(`   Factura en el pago: ${pagoFinal.linkFactura ? '✅ SÍ' : '❌ NO'}`);
    if (pagoFinal.linkFactura) {
      console.log(`   Link: ${pagoFinal.linkFactura}`);
    }

    console.log('\n🎉 CORRECCIÓN COMPLETADA');

  } catch (error) {
    console.error('❌ Error en corrección:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

// Ejecutar corrección
corregirSantos();
