import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

try {
  // Encontrar el usuario administrador
  const admin = await Usuario.findOne({ rol: 'administrador' }).lean();
  
  if (admin) {
    // Generar token
    const token = jwt.sign(
      { 
        id: admin._id, 
        rol: admin.rol 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    console.log('=== CREDENCIALES DE ADMINISTRADOR ===');
    console.log('Email:', admin.email);
    console.log('Token:', token);
    console.log('');
    console.log('Para usar en el navegador:');
    console.log('1. Abre la consola del navegador (F12)');
    console.log('2. Ejecuta: localStorage.setItem("token", "' + token + '")');
    console.log('3. Recarga la página');
  } else {
    console.log('No se encontró usuario administrador');
  }

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await mongoose.disconnect();
}
