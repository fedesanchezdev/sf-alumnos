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

// Importar el controlador actualizado
import { actualizarPago } from './controllers/pagoController.js';

const probarEdicionCorregida = async () => {
  await connectDB();

  try {
    console.log('🧪 PROBANDO EDICIÓN CORREGIDA DE SANTOS\n');

    const pagoId = '68674ab224925513fe4587cc';

    // Definir esquemas para verificación manual
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

    console.log('📋 ESTADO ANTES DE LA EDICIÓN:');
    const pagoAntes = await Pago.findById(pagoId);
    const clasesAntes = await Clase.find({ pago: pagoId }).sort({ fecha: 1 });
    
    console.log(`Pago: $${pagoAntes.monto}`);
    console.log(`Descripción: ${pagoAntes.descripcion}`);
    console.log(`Período: ${pagoAntes.fechaInicio?.toISOString().split('T')[0]} - ${pagoAntes.fechaFin?.toISOString().split('T')[0]}`);
    console.log(`Clases: ${clasesAntes.length}`);
    clasesAntes.forEach((clase, index) => {
      console.log(`  ${index + 1}. ${clase.fecha.toISOString().split('T')[0]} (${clase.estado})`);
    });

    // Simular edición sin cambios en fechas (solo cambiar descripción)
    console.log('\n🔄 SIMULANDO EDICIÓN SIN CAMBIOS EN FECHAS:');
    
    const req = {
      params: { id: pagoId },
      body: {
        monto: pagoAntes.monto,
        descripcion: pagoAntes.descripcion + ' - Editado con nueva lógica'
        // NO incluir fechaInicio ni fechaFin
      }
    };

    const res = {
      json: (data) => {
        console.log('✅ Respuesta del controlador:', data.message);
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Error ${code}:`, data.message);
          return data;
        }
      })
    };

    // Ejecutar el controlador actualizado
    await actualizarPago(req, res);

    console.log('\n📋 ESTADO DESPUÉS DE LA EDICIÓN:');
    const pagoDespues = await Pago.findById(pagoId);
    const clasesDespues = await Clase.find({ pago: pagoId }).sort({ fecha: 1 });
    
    console.log(`Pago: $${pagoDespues.monto}`);
    console.log(`Descripción: ${pagoDespues.descripcion}`);
    console.log(`Período: ${pagoDespues.fechaInicio?.toISOString().split('T')[0]} - ${pagoDespues.fechaFin?.toISOString().split('T')[0]}`);
    console.log(`Clases: ${clasesDespues.length}`);
    clasesDespues.forEach((clase, index) => {
      console.log(`  ${index + 1}. ${clase.fecha.toISOString().split('T')[0]} (${clase.estado})`);
    });

    // Verificar duplicados
    const conteoFechas = {};
    clasesDespues.forEach(clase => {
      const fechaStr = clase.fecha.toISOString().split('T')[0];
      conteoFechas[fechaStr] = (conteoFechas[fechaStr] || 0) + 1;
    });

    const duplicados = Object.entries(conteoFechas).filter(([fecha, count]) => count > 1);
    
    if (duplicados.length === 0 && clasesDespues.length === clasesAntes.length) {
      console.log('\n🎉 ¡SUCCESS! La edición no generó duplicados ni clases extra');
    } else {
      console.log('\n⚠️  Problemas detectados:');
      if (duplicados.length > 0) {
        console.log('  - Duplicados:', duplicados);
      }
      if (clasesDespues.length !== clasesAntes.length) {
        console.log(`  - Cambio en cantidad de clases: ${clasesAntes.length} → ${clasesDespues.length}`);
      }
    }

    // Revertir cambios
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
probarEdicionCorregida();
