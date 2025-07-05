import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';

// Configurar variables de entorno
dotenv.config();

const crearAdminInicial = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un administrador
    const adminExistente = await Usuario.findOne({ rol: 'administrador' });
    
    if (adminExistente) {
      console.log('ℹ️ Ya existe un usuario administrador:', adminExistente.email);
      return;
    }

    // Crear usuario administrador inicial
    const admin = new Usuario({
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@sistema.com',
      password: 'admin123', // Se hasheará automáticamente
      rol: 'administrador'
    });

    await admin.save();
    
    console.log('🎉 Usuario administrador creado exitosamente:');
    console.log('📧 Email: admin@sistema.com');
    console.log('🔑 Contraseña: admin123');
    console.log('⚠️  ¡IMPORTANTE! Cambia esta contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
};

crearAdminInicial();
