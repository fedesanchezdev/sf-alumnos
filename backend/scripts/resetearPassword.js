import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';

// Configurar variables de entorno
dotenv.config();

const resetearPassword = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar el usuario administrador
    const admin = await Usuario.findOne({ 
      $or: [
        { email: 'admin@sistema.com' },
        { rol: 'administrador' }
      ]
    });
    
    if (!admin) {
      console.log('❌ No se encontró usuario administrador');
      return;
    }

    console.log(`👤 Usuario encontrado: ${admin.nombre} ${admin.apellido} (${admin.email})`);

    // Resetear la contraseña a 'admin123'
    admin.password = 'admin123'; // Se hasheará automáticamente por el middleware pre('save')
    await admin.save();
    
    console.log('\n🎉 Contraseña restablecida exitosamente!');
    console.log('📧 Email: ' + admin.email);
    console.log('🔑 Nueva contraseña: admin123');
    console.log('⚠️  ¡IMPORTANTE! Cambia esta contraseña después del login');

  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
};

resetearPassword();
