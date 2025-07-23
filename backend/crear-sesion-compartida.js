import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SesionEstudio from './models/SesionEstudio.js';
import Usuario from './models/Usuario.js';

// Cargar variables de entorno
dotenv.config();

const crearSesionCompartida = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar un usuario existente
    const usuario = await Usuario.findOne({ rol: { $ne: 'administrador' } });
    if (!usuario) {
      console.log('❌ No se encontró un usuario no administrador');
      return;
    }

    console.log(`👤 Usuario encontrado: ${usuario.nombre} ${usuario.apellido}`);

    // Crear una sesión de estudio compartida
    const sesionCompartida = new SesionEstudio({
      usuario: usuario._id,
      compositor: 'Bach, J.S.',
      obra: 'Bach for the Cello - Álbum',
      movimientoPieza: 'Suite No. 1 - Prelude',
      bpmInicial: 60,
      bpmFinal: 80,
      metronomomUsado: true,
      fechaInicio: new Date(Date.now() - 3600000), // 1 hora atrás
      fechaFin: new Date(),
      tiempoTotalSegundos: 3600, // 1 hora
      estado: 'finalizada',
      compartidaConProfesor: true,
      fechaCompartida: new Date(),
      comentarioAlumno: 'Sesión de prueba para verificar los cambios de formato. Practiqué escalas y trabajé en la digitación del primer movimiento.',
      compasesEstudiados: '1-32, 45-64',
      cambiosMetronomo: [
        {
          bpm: 70,
          tiempoEstudioEnSegundos: 1800 // 30 minutos
        },
        {
          bpm: 80,
          tiempoEstudioEnSegundos: 2700 // 45 minutos
        }
      ],
      comentarios: 'Notas durante la práctica: mejorar legato en compases 15-20. Trabajar más despacio la transición del compás 32.'
    });

    await sesionCompartida.save();
    console.log('✅ Sesión compartida creada exitosamente');
    console.log(`📝 ID de sesión: ${sesionCompartida._id}`);
    console.log(`🎼 Obra: ${sesionCompartida.compositor} - ${sesionCompartida.obra}`);
    console.log(`👤 Usuario: ${usuario.nombre} ${usuario.apellido}`);
    console.log(`⏰ Tiempo total: ${Math.floor(sesionCompartida.tiempoTotalSegundos / 3600)}:${Math.floor((sesionCompartida.tiempoTotalSegundos % 3600) / 60).toString().padStart(2, '0')}:${(sesionCompartida.tiempoTotalSegundos % 60).toString().padStart(2, '0')}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar conexión
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

crearSesionCompartida();
