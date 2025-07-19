import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const partituraService = {
  // Obtener todas las partituras
  obtenerPartituras: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.compositor) params.append('compositor', filtros.compositor);
      if (filtros.dificultad) params.append('dificultad', filtros.dificultad);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.q) params.append('q', filtros.q);
      
      const response = await api.get(`/partituras?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener partituras:', error);
      throw error;
    }
  },

  // Buscar partituras por término
  buscarPartituras: async (termino) => {
    try {
      const response = await api.get(`/partituras/buscar?q=${encodeURIComponent(termino)}`);
      return response.data;
    } catch (error) {
      console.error('Error al buscar partituras:', error);
      throw error;
    }
  },

  // Obtener partituras por compositor
  obtenerPorCompositor: async (compositor) => {
    try {
      const response = await api.get(`/partituras/compositor/${encodeURIComponent(compositor)}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener partituras por compositor:', error);
      throw error;
    }
  },

  // Obtener partitura por ID
  obtenerPartituraPorId: async (id) => {
    try {
      const response = await api.get(`/partituras/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener partitura:', error);
      throw error;
    }
  },

  // Crear nueva partitura
  crearPartitura: async (partituraData) => {
    try {
      const response = await api.post(`/partituras`, partituraData);
      return response.data;
    } catch (error) {
      console.error('Error al crear partitura:', error);
      throw error;
    }
  },

  // Actualizar partitura
  actualizarPartitura: async (id, partituraData) => {
    try {
      const response = await api.put(`/partituras/${id}`, partituraData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar partitura:', error);
      throw error;
    }
  },

  // Eliminar partitura
  eliminarPartitura: async (id) => {
    try {
      const response = await api.delete(`/partituras/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar partitura:', error);
      throw error;
    }
  },

  // Obtener compositores únicos
  obtenerCompositores: async () => {
    try {
      const response = await api.get(`/partituras/compositores`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener compositores:', error);
      throw error;
    }
  },

  // Obtener estadísticas de partituras
  obtenerEstadisticas: async () => {
    try {
      const response = await api.get(`/partituras/estadisticas`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
};

export default partituraService;
