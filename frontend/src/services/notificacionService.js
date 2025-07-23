import api from './api';

export const notificacionService = {
  // Obtener notificaciones del usuario
  async obtenerNotificaciones(limite = 20, soloNoLeidas = false) {
    try {
      const response = await api.get('/notificaciones', {
        params: { limite, soloNoLeidas }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  },

  // Contar notificaciones no leídas
  async contarNoLeidas() {
    try {
      const response = await api.get('/notificaciones/no-leidas');
      return response.data;
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      throw error;
    }
  },

  // Marcar notificación como leída
  async marcarComoLeida(notificacionId) {
    try {
      const response = await api.put(`/notificaciones/${notificacionId}/leida`);
      return response.data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  },

  // Marcar todas las notificaciones como leídas
  async marcarTodasComoLeidas() {
    try {
      const response = await api.put('/notificaciones/marcar-todas-leidas');
      return response.data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }
};
