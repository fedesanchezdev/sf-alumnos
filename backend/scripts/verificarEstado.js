import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log('=== VERIFICACIÓN DE ESTADO ACTUAL ===\n');
  
  // 1. Verificar usuarios
  const usuarios = await Usuario.find({});
  console.log(`👥 USUARIOS: ${usuarios.length} encontrados`);
  usuarios.forEach(user => {
    console.log(`  • ${user.nombre} ${user.apellido} (${user.rol}) - ID: ${user._id}`);
  });
  
  // 2. Verificar pagos
  const pagos = await Pago.find({});
  console.log(`\n💰 PAGOS: ${pagos.length} encontrados`);
  if (pagos.length > 0) {
    pagos.forEach(pago => {
      console.log(`  • $${pago.monto} - ${pago.descripcion} (activo: ${pago.activo})`);
    });
  }
  
  // 3. Verificar clases
  const clases = await Clase.find({});
  console.log(`\n📅 CLASES: ${clases.length} encontradas`);
  if (clases.length > 0) {
    clases.forEach(clase => {
      console.log(`  • ${clase.fecha.toISOString().split('T')[0]} (activo: ${clase.activo})`);
    });
  }
  
  // 4. Verificar si existe la colección 'users' antigua
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  console.log(`\n📋 COLECCIONES EN LA BD:`);
  collectionNames.forEach(name => {
    console.log(`  • ${name}`);
  });
  
  if (collectionNames.includes('users')) {
    console.log(`\n⚠️  ATENCIÓN: Existe la colección 'users' antigua`);
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`   Contiene ${usersCount} documentos`);
    
    if (usersCount > 0) {
      console.log(`\n💡 RECOMENDACIÓN: Migrar datos de 'users' a 'usuarios' si es necesario`);
    }
  }
  
  console.log(`\n✅ Estado verificado. Listo para crear pagos nuevos.`);

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
}
