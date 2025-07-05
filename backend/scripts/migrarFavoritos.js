import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';

// Configurar variables de entorno
dotenv.config();

const migrarFavoritos = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios que no tienen el campo favoritosPartituras
    const usuariosSinFavoritos = await Usuario.find({
      favoritosPartituras: { $exists: false }
    });

    console.log(`📊 Usuarios sin campo favoritos encontrados: ${usuariosSinFavoritos.length}`);

    if (usuariosSinFavoritos.length === 0) {
      console.log('✅ Todos los usuarios ya tienen el campo favoritosPartituras');
      return;
    }

    // Agregar el campo favoritosPartituras (array vacío) a todos los usuarios que no lo tienen
    const resultado = await Usuario.updateMany(
      { favoritosPartituras: { $exists: false } },
      { $set: { favoritosPartituras: [] } }
    );

    console.log(`✅ Campo favoritosPartituras agregado a ${resultado.modifiedCount} usuarios`);

    // Verificar que todos los usuarios ahora tienen el campo
    const usuariosActualizados = await Usuario.countDocuments({
      favoritosPartituras: { $exists: true }
    });

    console.log(`📊 Total de usuarios con campo favoritos: ${usuariosActualizados}`);
    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar la migración
migrarFavoritos();
