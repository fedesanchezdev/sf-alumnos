import dotenv from 'dotenv';
import conectarDB from '../config/database.js';
import SesionEstudio from '../models/SesionEstudio.js';
import Usuario from '../models/Usuario.js';

// Cargar variables de entorno
dotenv.config();

const crearSesionesPrueba = async () => {
  try {
    await conectarDB();
    
    console.log('🔄 Creando sesiones de prueba...');
    
    // Buscar el primer usuario o crear uno de prueba
    let usuario = await Usuario.findOne();
    
    if (!usuario) {
      console.log('No se encontró usuario, creando usuario de prueba...');
      usuario = new Usuario({
        nombre: 'Usuario Prueba',
        email: 'prueba@test.com',
        password: 'test123',
        rol: 'alumno'
      });
      await usuario.save();
    }
    
    console.log(`Usuario encontrado: ${usuario.nombre} (${usuario._id})`);
    
    // Crear sesiones de prueba
    const sesionesPrueba = [
      {
        usuario: usuario._id,
        compositor: 'Johann Sebastian Bach',
        obra: 'Invención No. 1 en Do Mayor',
        movimientoPieza: 'Invención completa',
        compasesEstudiados: '1-16',
        bpmInicial: 100,
        bpmFinal: 120,
        tiempoTotalSegundos: 1800, // 30 minutos
        comentarios: 'Buena sesión, mejoré la articulación',
        estado: 'finalizada',
        fechaInicio: new Date(Date.now() - 86400000), // Ayer
        fechaFin: new Date(Date.now() - 86400000 + 1800000),
        cambiosMetronomo: [
          { bpm: 100, tiempoSegundos: 0 },
          { bpm: 110, tiempoSegundos: 600 },
          { bpm: 120, tiempoSegundos: 1200 }
        ]
      },
      {
        usuario: usuario._id,
        compositor: 'Wolfgang Amadeus Mozart',
        obra: 'Sonata No. 11 en La Mayor',
        movimientoPieza: 'I. Andante grazioso',
        compasesEstudiados: '1-32',
        bpmInicial: 80,
        bpmFinal: 90,
        tiempoTotalSegundos: 2400, // 40 minutos
        comentarios: 'Trabajé en las ornamentaciones del tema principal',
        estado: 'finalizada',
        fechaInicio: new Date(Date.now() - 172800000), // Hace 2 días
        fechaFin: new Date(Date.now() - 172800000 + 2400000),
        cambiosMetronomo: [
          { bpm: 80, tiempoSegundos: 0 },
          { bpm: 85, tiempoSegundos: 1200 },
          { bpm: 90, tiempoSegundos: 1800 }
        ]
      },
      {
        usuario: usuario._id,
        compositor: 'Ludwig van Beethoven',
        obra: 'Sonata para Violín No. 9 "Kreutzer"',
        movimientoPieza: 'I. Adagio sostenuto',
        compasesEstudiados: '1-20',
        bpmInicial: 60,
        bpmFinal: 70,
        tiempoTotalSegundos: 3000, // 50 minutos
        comentarios: 'Sesión intensa, me enfoqué en la expresividad y dinámicas',
        estado: 'finalizada',
        fechaInicio: new Date(Date.now() - 259200000), // Hace 3 días
        fechaFin: new Date(Date.now() - 259200000 + 3000000),
        cambiosMetronomo: [
          { bpm: 60, tiempoSegundos: 0 },
          { bpm: 65, tiempoSegundos: 1500 },
          { bpm: 70, tiempoSegundos: 2400 }
        ]
      }
    ];
    
    // Limpiar sesiones existentes del usuario
    await SesionEstudio.deleteMany({ usuario: usuario._id });
    console.log('Sesiones anteriores eliminadas');
    
    // Insertar nuevas sesiones
    const sesionesCreadas = await SesionEstudio.insertMany(sesionesPrueba);
    
    console.log(`✅ ${sesionesCreadas.length} sesiones de prueba creadas exitosamente:`);
    sesionesCreadas.forEach((sesion, index) => {
      console.log(`   ${index + 1}. ${sesion.compositor} - ${sesion.obra} (${sesion.tiempoTotalSegundos/60} min)`);
    });
    
    console.log('🎯 Puedes verificar el historial en: http://localhost:5174/alumnos/');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al crear sesiones de prueba:', error);
    process.exit(1);
  }
};

crearSesionesPrueba();
