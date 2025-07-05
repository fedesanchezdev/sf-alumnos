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
const claseSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  pago: { type: mongoose.Schema.Types.ObjectId, ref: 'Pago' },
  fecha: Date,
  estado: String
}, { collection: 'clases' });

const Clase = mongoose.model('Clase', claseSchema);

const limpiarDuplicadoSantos = async () => {
  await connectDB();

  try {
    console.log('🧹 LIMPIANDO DUPLICADO EXISTENTE DE SANTOS\n');

    const pagoId = '68674ab224925513fe4587cc';
    
    // Buscar clases duplicadas del 3 de julio
    const clasesDel3Julio = await Clase.find({
      pago: pagoId,
      fecha: { 
        $gte: new Date('2025-07-03T00:00:00.000Z'),
        $lt: new Date('2025-07-04T00:00:00.000Z')
      }
    }).sort({ _id: 1 });

    console.log(`📅 Clases encontradas para el 3 de julio: ${clasesDel3Julio.length}`);
    
    if (clasesDel3Julio.length > 1) {
      clasesDel3Julio.forEach((clase, index) => {
        console.log(`  ${index + 1}. ID: ${clase._id} - Estado: ${clase.estado}`);
      });

      // Mantener la clase tomada, eliminar la no_iniciada
      const claseAEliminar = clasesDel3Julio.find(c => c.estado === 'no_iniciada');
      
      if (claseAEliminar) {
        console.log(`\n🗑️  Eliminando clase duplicada: ${claseAEliminar._id} (${claseAEliminar.estado})`);
        
        const resultado = await Clase.deleteOne({ _id: claseAEliminar._id });
        
        if (resultado.deletedCount > 0) {
          console.log('✅ Clase duplicada eliminada exitosamente');
        } else {
          console.log('❌ No se pudo eliminar la clase duplicada');
        }
      } else {
        console.log('❌ No se encontró una clase no_iniciada para eliminar');
      }
    } else {
      console.log('✅ No hay clases duplicadas para el 3 de julio');
    }

    // Verificar estado final
    console.log('\n📋 ESTADO FINAL:');
    const clasesFinales = await Clase.find({ pago: pagoId }).sort({ fecha: 1 });
    
    console.log(`Total de clases: ${clasesFinales.length}`);
    clasesFinales.forEach((clase, index) => {
      console.log(`  ${index + 1}. ${clase.fecha.toISOString().split('T')[0]} (${clase.estado})`);
    });

    // Verificar duplicados
    const conteoFechas = {};
    clasesFinales.forEach(clase => {
      const fechaStr = clase.fecha.toISOString().split('T')[0];
      conteoFechas[fechaStr] = (conteoFechas[fechaStr] || 0) + 1;
    });

    const duplicados = Object.entries(conteoFechas).filter(([fecha, count]) => count > 1);
    
    if (duplicados.length === 0) {
      console.log('\n🎉 ¡PERFECTO! No hay fechas duplicadas');
    } else {
      console.log('\n⚠️  Aún hay duplicados:');
      duplicados.forEach(([fecha, count]) => {
        console.log(`  ${fecha}: ${count} clases`);
      });
    }

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

// Ejecutar limpieza
limpiarDuplicadoSantos();
