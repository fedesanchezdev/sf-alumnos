import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log('=== ACTUALIZANDO USUARIOS EXISTENTES ===\n');

  // Obtener usuarios que no tienen el campo activo
  const usuariosSinActivo = await Usuario.find({ 
    $or: [
      { activo: { $exists: false } },
      { activo: null }
    ]
  });

  console.log(`Usuarios encontrados sin campo 'activo': ${usuariosSinActivo.length}\n`);

  if (usuariosSinActivo.length > 0) {
    // Actualizar todos los usuarios para que tengan activo: true por defecto
    const resultado = await Usuario.updateMany(
      { 
        $or: [
          { activo: { $exists: false } },
          { activo: null }
        ]
      },
      { $set: { activo: true } }
    );

    console.log(`✅ Usuarios actualizados: ${resultado.modifiedCount}`);

    // Verificar la actualización
    console.log('\n📋 ESTADO ACTUAL DE USUARIOS:');
    const todosLosUsuarios = await Usuario.find({}).select('nombre apellido email rol activo');
    
    todosLosUsuarios.forEach((usuario, i) => {
      const estadoIcon = usuario.activo ? '🟢' : '🔴';
      const rolIcon = usuario.rol === 'administrador' ? '👑' : '👤';
      console.log(`  ${i + 1}. ${estadoIcon} ${rolIcon} ${usuario.nombre} ${usuario.apellido} (${usuario.email})`);
      console.log(`      Activo: ${usuario.activo}, Rol: ${usuario.rol}\n`);
    });

  } else {
    console.log('✅ Todos los usuarios ya tienen el campo "activo" configurado');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('🔌 Desconectado de la base de datos');
}
