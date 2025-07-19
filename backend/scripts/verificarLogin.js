import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';

// Configurar variables de entorno
dotenv.config();

const verificarLogin = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar el usuario administrador
    const admin = await Usuario.findOne({ email: 'admin@sistema.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ No se encontró usuario con email admin@sistema.com');
      return;
    }

    console.log(`👤 Usuario encontrado: ${admin.nombre} ${admin.apellido}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password hash: ${admin.password.substring(0, 20)}...`);
    console.log(`👑 Rol: ${admin.rol}`);
    console.log(`📅 Último acceso: ${admin.ultimoAcceso || 'Nunca'}`);

    // Verificar si la contraseña 'admin123' coincide
    console.log('\n🔍 Verificando contraseña "admin123"...');
    const passwordValida = await admin.compararPassword('admin123');
    
    if (passwordValida) {
      console.log('✅ La contraseña "admin123" es correcta');
    } else {
      console.log('❌ La contraseña "admin123" NO es correcta');
      
      // Intentar con otras contraseñas comunes
      const passwordsComunes = ['admin', 'password', '123456', 'administrador'];
      for (const pwd of passwordsComunes) {
        const esValida = await admin.compararPassword(pwd);
        if (esValida) {
          console.log(`✅ La contraseña correcta es: "${pwd}"`);
          break;
        }
      }
    }

  } catch (error) {
    console.error('❌ Error al verificar login:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
};

verificarLogin();
