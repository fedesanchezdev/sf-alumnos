import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Clase from '../models/Clase.js';
import Pago from '../models/Pago.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log('🧹 Limpiando clases huérfanas...\n');
  
  // Encontrar todas las clases activas que apuntan a pagos inactivos
  const clasesHuerfanas = await Clase.aggregate([
    // Buscar clases activas
    { $match: { activo: true } },
    
    // Hacer lookup con pagos
    {
      $lookup: {
        from: 'pagos',
        localField: 'pago',
        foreignField: '_id',
        as: 'pagoInfo'
      }
    },
    
    // Filtrar clases cuyo pago no existe o está inactivo
    {
      $match: {
        $or: [
          { 'pagoInfo': { $size: 0 } }, // Sin pago asociado
          { 'pagoInfo.activo': false }   // Pago inactivo
        ]
      }
    }
  ]);
  
  console.log(`📋 Encontradas ${clasesHuerfanas.length} clases huérfanas`);
  
  if (clasesHuerfanas.length > 0) {
    // Marcar todas las clases huérfanas como inactivas
    const resultado = await Clase.updateMany(
      { _id: { $in: clasesHuerfanas.map(c => c._id) } },
      { $set: { activo: false } }
    );
    
    console.log(`✅ ${resultado.modifiedCount} clases marcadas como inactivas`);
    
    console.log('\nClases afectadas:');
    clasesHuerfanas.forEach((clase, i) => {
      console.log(`  ${i + 1}. ${clase.fecha.toISOString().split('T')[0]} - Clase ID: ${clase._id}`);
    });
  } else {
    console.log('✅ No se encontraron clases huérfanas');
  }
  
  console.log('\n🎯 Limpieza completada exitosamente');

} catch (error) {
  console.error('❌ Error durante la limpieza:', error.message);
} finally {
  await mongoose.disconnect();
}
