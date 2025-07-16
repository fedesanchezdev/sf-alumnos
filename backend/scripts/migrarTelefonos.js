import mongoose from 'mongoose';
import Usuario from '../models/Usuario.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const migrarTelefonos = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexión a MongoDB establecida');

    // Obtener todos los usuarios
    const usuarios = await Usuario.find({});
    console.log(`📊 Encontrados ${usuarios.length} usuarios`);

    let usuariosActualizados = 0;

    for (const usuario of usuarios) {
      if (!usuario.telefono) {
        // Agregar campo telefono vacío si no existe
        usuario.telefono = '';
        await usuario.save();
        usuariosActualizados++;
        console.log(`✅ Usuario ${usuario.nombre} ${usuario.apellido} actualizado con campo teléfono`);
      } else {
        console.log(`⏭️ Usuario ${usuario.nombre} ${usuario.apellido} ya tiene campo teléfono: ${usuario.telefono}`);
      }
    }

    console.log(`\n📈 Migración completada:`);
    console.log(`   - Total usuarios: ${usuarios.length}`);
    console.log(`   - Usuarios actualizados: ${usuariosActualizados}`);
    console.log(`   - Usuarios que ya tenían teléfono: ${usuarios.length - usuariosActualizados}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
};

// Ejecutar migración
migrarTelefonos();
