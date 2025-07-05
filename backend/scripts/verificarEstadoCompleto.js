import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Clase from '../models/Clase.js';
import Pago from '../models/Pago.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log('=== VERIFICACIÓN COMPLETA DEL ESTADO DE LA BASE DE DATOS ===\n');

  // 1. Verificar colecciones existentes
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('📊 COLECCIONES EXISTENTES:');
  collections.forEach(col => {
    console.log(`  - ${col.name}`);
  });
  console.log();

  // 2. Verificar datos en la colección usuarios
  const usuarios = await Usuario.find({});
  console.log(`👥 USUARIOS (${usuarios.length} documentos):`);
  usuarios.forEach((usuario, i) => {
    console.log(`  ${i + 1}. ${usuario.nombre} (${usuario.email})`);
    console.log(`     ID: ${usuario._id}`);
    console.log(`     Rol: ${usuario.rol}`);
    console.log(`     Activo: ${usuario.activo}\n`);
  });

  // 3. Verificar si existe la colección "users" antigua
  const usersCollection = collections.find(col => col.name === 'users');
  if (usersCollection) {
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`⚠️  COLECCIÓN ANTIGUA "users" ENCONTRADA: ${usersCount} documentos`);
    
    if (usersCount > 0) {
      const oldUsers = await mongoose.connection.db.collection('users').find({}).toArray();
      console.log('   Usuarios en colección antigua:');
      oldUsers.forEach((user, i) => {
        console.log(`     ${i + 1}. ${user.nombre || user.name} (${user.email})`);
      });
    }
    console.log();
  } else {
    console.log('✅ No se encontró la colección antigua "users"\n');
  }

  // 4. Verificar pagos y clases (deberían estar vacías)
  const pagosCount = await Pago.countDocuments();
  const clasesCount = await Clase.countDocuments();
  
  console.log(`💰 PAGOS: ${pagosCount} documentos`);
  console.log(`📚 CLASES: ${clasesCount} documentos`);
  
  if (pagosCount > 0 || clasesCount > 0) {
    console.log('⚠️  Atención: Existen pagos o clases residuales');
  } else {
    console.log('✅ Base de datos limpia para nuevas pruebas');
  }
  console.log();

  // 5. Verificar índices y estructura de los modelos
  console.log('🔍 VERIFICACIÓN DE MODELOS:');
  
  // Verificar modelo Usuario
  const usuarioIndexes = await Usuario.collection.getIndexes();
  console.log('  Usuario - Índices:', Object.keys(usuarioIndexes));
  
  // Verificar modelo Pago
  const pagoIndexes = await Pago.collection.getIndexes();
  console.log('  Pago - Índices:', Object.keys(pagoIndexes));
  
  // Verificar modelo Clase
  const claseIndexes = await Clase.collection.getIndexes();
  console.log('  Clase - Índices:', Object.keys(claseIndexes));

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de la base de datos');
}
