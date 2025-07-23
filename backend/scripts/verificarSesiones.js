import dotenv from 'dotenv';
import conectarDB from '../config/database.js';
import SesionEstudio from '../models/SesionEstudio.js';
import Usuario from '../models/Usuario.js';

// Cargar variables de entorno
dotenv.config();

const verificarSesiones = async () => {
  try {
    await conectarDB();
    
    console.log('🔍 Verificando sesiones en la base de datos...');
    
    // Buscar todos los usuarios
    const usuarios = await Usuario.find({}, 'nombre email');
    console.log('👥 Usuarios en la base de datos:', usuarios);
    
    // Buscar todas las sesiones
    const sesiones = await SesionEstudio.find({}).populate('usuario', 'nombre email');
    console.log(`📊 Total de sesiones encontradas: ${sesiones.length}`);
    
    if (sesiones.length > 0) {
      console.log('📝 Detalles de las sesiones:');
      sesiones.forEach((sesion, index) => {
        console.log(`   ${index + 1}. Usuario: ${sesion.usuario?.nombre || 'Sin nombre'} (${sesion.usuario?._id})`);
        console.log(`      Obra: ${sesion.compositor} - ${sesion.obra}`);
        console.log(`      Estado: ${sesion.estado}`);
        console.log(`      Fecha: ${sesion.fechaInicio}`);
        console.log(`      ----`);
      });
    } else {
      console.log('❌ No se encontraron sesiones en la base de datos');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al verificar sesiones:', error);
    process.exit(1);
  }
};

verificarSesiones();
