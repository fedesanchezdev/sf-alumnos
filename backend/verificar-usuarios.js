import mongoose from 'mongoose';
import './config/database.js';
import Usuario from './models/Usuario.js';

setTimeout(async () => {
  try {
    const usuarios = await Usuario.find({});
    console.log('Total usuarios en la base de datos:', usuarios.length);
    console.log('\nDetalles de usuarios:');
    usuarios.forEach(u => {
      console.log(`- ID: ${u._id}`);
      console.log(`  Nombre: ${u.nombre} ${u.apellido}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Rol: ${u.rol}`);
      console.log(`  Activo: ${u.activo}`);
      console.log('---');
    });
    
    const usuariosConRolUsuario = usuarios.filter(u => u.rol === 'usuario');
    console.log(`\nUsuarios con rol 'usuario': ${usuariosConRolUsuario.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 2000);
