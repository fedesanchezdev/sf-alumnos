import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Usuario from '../models/Usuario.js';

// Cargar variables de entorno
dotenv.config();

const mostrarCredenciales = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar todos los usuarios administradores
    const admins = await Usuario.find({ rol: 'administrador' });
    
    console.log('\n👥 USUARIOS ADMINISTRADORES:');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.nombre} ${admin.apellido}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   ID: ${admin._id}`);
      console.log('');
    });

    // Buscar el usuario Santos
    const santos = await Usuario.findOne({ 
      $or: [
        { email: 'santos@gmail.com' },
        { nombre: 'Santos' }
      ]
    });

    if (santos) {
      console.log('👤 USUARIO SANTOS:');
      console.log(`Nombre: ${santos.nombre} ${santos.apellido}`);
      console.log(`Email: ${santos.email}`);
      console.log(`ID: ${santos._id}`);
      console.log(`Rol: ${santos.rol}`);
    }

    console.log('\n🔑 CREDENCIALES PARA PROBAR:');
    console.log('Admin: admin@sistema.com / admin123');
    console.log('Santos: santos@gmail.com / santos123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
};

mostrarCredenciales();
