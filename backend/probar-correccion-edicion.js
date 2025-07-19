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
const pagoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  monto: Number,
  fechaPago: Date,
  fechaInicio: Date,
  fechaFin: Date,
  descripcion: String,
  linkFactura: String
}, { collection: 'pagos' });

const claseSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  pago: { type: mongoose.Schema.Types.ObjectId, ref: 'Pago' },
  fecha: Date,
  estado: String
}, { collection: 'clases' });

const Pago = mongoose.model('Pago', pagoSchema);
const Clase = mongoose.model('Clase', claseSchema);

const probarCorreccion = async () => {
  await connectDB();

  try {
    console.log('🧪 PROBANDO CORRECCIÓN DE EDICIÓN DE PAGOS\n');

    const pagoId = '68674ab224925513fe4587cc'; // Pago problemático de Santos

    console.log('📋 ESTADO ANTES:');
    const pagoAntes = await Pago.findById(pagoId);
    const clasesAntes = await Clase.find({ pago: pagoId }).sort({ fecha: 1 });
    
    console.log(`Pago: $${pagoAntes.monto}`);
    console.log(`Período: ${pagoAntes.fechaInicio?.toISOString().split('T')[0] || 'N/A'} - ${pagoAntes.fechaFin?.toISOString().split('T')[0] || 'N/A'}`);
    console.log(`Clases: ${clasesAntes.length}`);
    clasesAntes.forEach((clase, index) => {
      console.log(`  ${index + 1}. ${clase.fecha.toISOString().split('T')[0]} (${clase.estado})`);
    });

    // Simular una edición sin cambios (solo actualizar descripción)
    console.log('\n🔄 SIMULANDO EDICIÓN SIN CAMBIOS EN FECHAS:');
    
    // Esta es la actualización que haría el frontend cuando "editas sin cambiar nada"
    const datosActualizacion = {
      monto: pagoAntes.monto,
      descripcion: pagoAntes.descripcion + ' - Editado para prueba',
      linkFactura: pagoAntes.linkFactura
      // NO incluir fechaInicio ni fechaFin para no trigger regeneración
    };

    const pagoActualizado = await Pago.findByIdAndUpdate(
      pagoId, 
      datosActualizacion,
      { new: true }
    );

    console.log('✅ Pago actualizado (solo datos básicos)');

    console.log('\n📋 ESTADO DESPUÉS:');
    const clasesDespues = await Clase.find({ pago: pagoId }).sort({ fecha: 1 });
    
    console.log(`Pago: $${pagoActualizado.monto}`);
    console.log(`Descripción: ${pagoActualizado.descripcion}`);
    console.log(`Clases: ${clasesDespues.length}`);
    clasesDespues.forEach((clase, index) => {
      console.log(`  ${index + 1}. ${clase.fecha.toISOString().split('T')[0]} (${clase.estado})`);
    });

    // Verificar si hay duplicados
    const conteoFechas = {};
    clasesDespues.forEach(clase => {
      const fechaStr = clase.fecha.toISOString().split('T')[0];
      conteoFechas[fechaStr] = (conteoFechas[fechaStr] || 0) + 1;
    });

    const duplicados = Object.entries(conteoFechas).filter(([fecha, count]) => count > 1);
    
    if (duplicados.length === 0) {
      console.log('\n🎉 ¡SUCCESS! No se generaron clases duplicadas');
    } else {
      console.log('\n⚠️  Aún hay duplicados:');
      duplicados.forEach(([fecha, count]) => {
        console.log(`  ${fecha}: ${count} clases`);
      });
    }

    // Revertir cambios para dejar todo como estaba
    console.log('\n🔄 Revirtiendo cambios...');
    await Pago.findByIdAndUpdate(pagoId, {
      descripcion: pagoAntes.descripcion
    });
    console.log('✅ Cambios revertidos');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

// Ejecutar prueba
probarCorreccion();
