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

const diagnosticarSantos = async () => {
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

    console.log('👤 Usuario encontrado:', {
      _id: santos._id,
      nombre: santos.nombre,
      apellido: santos.apellido,
      email: santos.email
    });

    // Buscar pagos de Santos
    const pagos = await Pago.find({ usuario: santos._id }).sort({ fechaPago: -1 });
    console.log(`\n💰 Pagos encontrados: ${pagos.length}`);
    
    for (const pago of pagos) {
      console.log(`\nPago ID: ${pago._id}`);
      console.log(`Monto: $${pago.monto}`);
      console.log(`Fecha: ${pago.fechaPago}`);
      console.log(`Descripción: ${pago.descripcion || 'Sin descripción'}`);
      console.log(`Link Factura: ${pago.linkFactura || 'Sin factura'}`);

      // Buscar clases de este pago
      const clases = await Clase.find({ pago: pago._id }).sort({ fecha: 1 });
      console.log(`Clases: ${clases.length}`);
      
      if (clases.length > 0) {
        console.log('Fechas de clases:');
        const fechasAgrupadas = {};
        clases.forEach((clase, index) => {
          const fechaStr = clase.fecha.toISOString().split('T')[0];
          if (!fechasAgrupadas[fechaStr]) {
            fechasAgrupadas[fechaStr] = [];
          }
          fechasAgrupadas[fechaStr].push({
            index: index + 1,
            claseId: clase._id,
            estado: clase.estado
          });
          console.log(`  ${index + 1}. ${fechaStr} (${clase.estado}) - ID: ${clase._id}`);
        });

        // Detectar fechas duplicadas
        const fechasDuplicadas = Object.entries(fechasAgrupadas).filter(([fecha, clases]) => clases.length > 1);
        if (fechasDuplicadas.length > 0) {
          console.log('\n⚠️  FECHAS DUPLICADAS DETECTADAS:');
          fechasDuplicadas.forEach(([fecha, clasesEnFecha]) => {
            console.log(`  📅 ${fecha}: ${clasesEnFecha.length} clases`);
            clasesEnFecha.forEach(clase => {
              console.log(`    - Clase ${clase.index} (ID: ${clase.claseId}) - Estado: ${clase.estado}`);
            });
          });
        }
      }
      console.log('---'.repeat(20));
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

// Ejecutar diagnóstico
diagnosticarSantos();
