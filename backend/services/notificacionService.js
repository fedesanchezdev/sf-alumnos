import Notificacion from '../models/Notificacion.js';
import Usuario from '../models/Usuario.js';

export const notificacionService = {
  // Crear notificación cuando un alumno comparte una sesión
  async crearNotificacionSesionCompartida(sesion) {
    try {
      // Obtener todos los profesores y administradores
      const profesores = await Usuario.find({
        rol: { $in: ['profesor', 'administrador'] }
      });

      const notificaciones = profesores.map(profesor => ({
        usuario: profesor._id,
        tipo: 'sesion_compartida',
        titulo: 'Nueva sesión compartida',
        mensaje: `${sesion.usuario.nombre} ${sesion.usuario.apellido} ha compartido una sesión de "${sesion.compositor} - ${sesion.obra}"`,
        sesionEstudio: sesion._id
      }));

      await Notificacion.insertMany(notificaciones);
      console.log(`✅ Creadas ${notificaciones.length} notificaciones para sesión compartida`);
    } catch (error) {
      console.error('Error al crear notificaciones de sesión compartida:', error);
    }
  },

  // Crear notificación cuando el profesor comenta
  async crearNotificacionComentarioProfesor(sesion, comentario) {
    try {
      await Notificacion.create({
        usuario: sesion.usuario._id || sesion.usuario,
        tipo: 'comentario_profesor',
        titulo: 'Nuevo comentario del profesor',
        mensaje: `Tu profesor ha comentado tu sesión de "${sesion.compositor} - ${sesion.obra}": "${comentario.substring(0, 100)}${comentario.length > 100 ? '...' : ''}"`,
        sesionEstudio: sesion._id
      });

      console.log(`✅ Notificación creada para comentario del profesor`);
    } catch (error) {
      console.error('Error al crear notificación de comentario del profesor:', error);
    }
  },

  // Obtener notificaciones de un usuario
  async obtenerNotificaciones(usuarioId, limite = 20, soloNoLeidas = false) {
    try {
      const filtro = { usuario: usuarioId };
      if (soloNoLeidas) {
        filtro.leida = false;
      }

      const notificaciones = await Notificacion.find(filtro)
        .populate('sesionEstudio', 'compositor obra fechaInicio')
        .sort({ fechaCreacion: -1 })
        .limit(limite);

      return notificaciones;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  },

  // Marcar notificación como leída
  async marcarComoLeida(notificacionId, usuarioId) {
    try {
      await Notificacion.findOneAndUpdate(
        { _id: notificacionId, usuario: usuarioId },
        { 
          leida: true, 
          fechaLeida: new Date() 
        }
      );
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  },

  // Marcar todas las notificaciones como leídas
  async marcarTodasComoLeidas(usuarioId) {
    try {
      await Notificacion.updateMany(
        { usuario: usuarioId, leida: false },
        { 
          leida: true, 
          fechaLeida: new Date() 
        }
      );
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  },

  // Contar notificaciones no leídas
  async contarNoLeidas(usuarioId) {
    try {
      return await Notificacion.countDocuments({
        usuario: usuarioId,
        leida: false
      });
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      return 0;
    }
  }
};
