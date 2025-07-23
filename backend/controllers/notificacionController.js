import { notificacionService } from '../services/notificacionService.js';

// Obtener notificaciones del usuario
export const obtenerNotificaciones = async (req, res) => {
  try {
    const { limite = 20, soloNoLeidas = false } = req.query;
    
    const notificaciones = await notificacionService.obtenerNotificaciones(
      req.usuario._id,
      parseInt(limite),
      soloNoLeidas === 'true'
    );

    res.json({
      success: true,
      notificaciones
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Contar notificaciones no leídas
export const contarNoLeidas = async (req, res) => {
  try {
    const count = await notificacionService.contarNoLeidas(req.usuario._id);

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Error al contar notificaciones no leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Marcar notificación como leída
export const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;

    await notificacionService.marcarComoLeida(id, req.usuario._id);

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Marcar todas las notificaciones como leídas
export const marcarTodasComoLeidas = async (req, res) => {
  try {
    await notificacionService.marcarTodasComoLeidas(req.usuario._id);

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });

  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
