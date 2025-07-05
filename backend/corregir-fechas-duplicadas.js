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

const corregirFechasDuplicadas = async () => {
  await connectDB();

  try {
    console.log('🔧 CORRIGIENDO FECHAS DUPLICADAS ESPECÍFICAMENTE\n');

    const pagoProblematico = '68674ab224925513fe4587cc';
    
    // Buscar todas las clases del pago problemático
    const clases = await Clase.find({ pago: pagoProblematico }).sort({ fecha: 1, _id: 1 });
    
    console.log(`📚 Clases encontradas: ${clases.length}`);
    clases.forEach((clase, index) => {
      console.log(`   ${index + 1}. ${clase.fecha.toISOString().split('T')[0]} (${clase.estado}) - ID: ${clase._id}`);
    });

    // Buscar específicamente las clases del 2025-07-03
    const clasesDel3Julio = clases.filter(c => 
      c.fecha.toISOString().split('T')[0] === '2025-07-03'
    );

    console.log(`\n🎯 Clases del 2025-07-03: ${clasesDel3Julio.length}`);
    
    if (clasesDel3Julio.length > 1) {
      console.log('📋 Detalles de las clases duplicadas:');
      clasesDel3Julio.forEach((clase, index) => {
        console.log(`   ${index + 1}. ID: ${clase._id} - Estado: ${clase.estado}`);
      });

      // Identificar cuál cambiar: cambiar la que NO esté tomada
      const claseACambiar = clasesDel3Julio.find(c => c.estado !== 'tomada');
      
      if (claseACambiar) {
        console.log(`\n🎯 Clase a modificar: ${claseACambiar._id} (estado: ${claseACambiar.estado})`);
        
        // Buscar una fecha libre en julio para mover la clase
        const fechasOcupadas = clases.map(c => c.fecha.toISOString().split('T')[0]);
        let nuevaFecha = null;
        
        // Probar fechas en julio
        for (let dia = 31; dia >= 1; dia--) { // Empezar desde el final
          const fechaCandidata = `2025-07-${dia.toString().padStart(2, '0')}`;
          if (!fechasOcupadas.includes(fechaCandidata)) {
            nuevaFecha = new Date(fechaCandidata);
            break;
          }
        }

        if (nuevaFecha) {
          console.log(`📅 Nueva fecha seleccionada: ${nuevaFecha.toISOString().split('T')[0]}`);
          
          const resultado = await Clase.updateOne(
            { _id: claseACambiar._id },
            { fecha: nuevaFecha }
          );

          if (resultado.modifiedCount > 0) {
            console.log(`✅ Clase ${claseACambiar._id} movida exitosamente`);
            console.log(`   De: 2025-07-03 → A: ${nuevaFecha.toISOString().split('T')[0]}`);
          } else {
            console.log(`❌ No se pudo mover la clase`);
          }
        } else {
          console.log(`❌ No se encontró una fecha libre en julio`);
        }
      } else {
        console.log(`❌ No se encontró una clase no-tomada para mover`);
      }
    } else {
      console.log('✅ No hay clases duplicadas en el 2025-07-03');
    }

    // Verificación final
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    const clasesFinales = await Clase.find({ pago: pagoProblematico }).sort({ fecha: 1 });
    
    const conteoFechas = {};
    clasesFinales.forEach((clase, index) => {
      const fechaStr = clase.fecha.toISOString().split('T')[0];
      if (!conteoFechas[fechaStr]) {
        conteoFechas[fechaStr] = 0;
      }
      conteoFechas[fechaStr]++;
      console.log(`   ${index + 1}. ${fechaStr} (${clase.estado})`);
    });

    const duplicados = Object.entries(conteoFechas).filter(([fecha, count]) => count > 1);
    if (duplicados.length === 0) {
      console.log('\n🎉 ¡PROBLEMA RESUELTO! Ya no hay fechas duplicadas.');
    } else {
      console.log('\n⚠️  Aún hay fechas duplicadas:');
      duplicados.forEach(([fecha, count]) => {
        console.log(`   ${fecha}: ${count} clases`);
      });
    }

  } catch (error) {
    console.error('❌ Error en corrección:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

// Ejecutar corrección
corregirFechasDuplicadas();
