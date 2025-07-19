import api from './api';

const estudioService = {
  // Obtener todos los estudios (admin) o estudios del usuario
  obtenerEstudios: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.usuarioId) params.append('usuarioId', filtros.usuarioId);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.limit) params.append('limit', filtros.limit);
      
      const response = await api.get(`/estudios?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estudios:', error);
      throw error;
    }
  },

  // Obtener estudios por usuario específico
  obtenerEstudiosPorUsuario: async (usuarioId) => {
    try {
      const response = await api.get(`/estudios/usuario/${usuarioId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estudios del usuario:', error);
      throw error;
    }
  },

  // Crear un nuevo estudio (solo admin)
  crearEstudio: async (estudioData) => {
    try {
      const response = await api.post('/estudios', estudioData);
      return response.data;
    } catch (error) {
      console.error('Error al crear estudio:', error);
      throw error;
    }
  },

  // Actualizar un estudio
  actualizarEstudio: async (id, estudioData) => {
    try {
      const response = await api.put(`/estudios/${id}`, estudioData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estudio:', error);
      throw error;
    }
  },

  // Eliminar un estudio (solo admin)
  eliminarEstudio: async (id) => {
    try {
      const response = await api.delete(`/estudios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar estudio:', error);
      throw error;
    }
  },

  // Finalizar un estudio
  finalizarEstudio: async (id) => {
    try {
      const response = await api.patch(`/estudios/${id}/finalizar`);
      return response.data;
    } catch (error) {
      console.error('Error al finalizar estudio:', error);
      throw error;
    }
  }
};

export default estudioService;
