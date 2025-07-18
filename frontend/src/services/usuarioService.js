import api from './api';

const usuarioService = {
  // Obtener todos los usuarios
  obtenerUsuarios: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.rol) params.append('rol', filtros.rol);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.limit) params.append('limit', filtros.limit);
      
      const response = await api.get(`/usuarios?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  // Obtener usuario por ID
  obtenerUsuarioPorId: async (id) => {
    try {
      const response = await api.get(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  },

  // Crear nuevo usuario
  crearUsuario: async (userData) => {
    try {
      const response = await api.post(`/usuarios`, userData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  },

  // Actualizar usuario
  actualizarUsuario: async (id, userData) => {
    try {
      const response = await api.put(`/usuarios/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  },

  // Eliminar usuario
  eliminarUsuario: async (id) => {
    try {
      const response = await api.delete(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  },

  // Cambiar estado de usuario (activo/inactivo)
  cambiarEstadoUsuario: async (id, activo) => {
    try {
      const response = await api.patch(`/usuarios/${id}/estado`, { activo });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      throw error;
    }
  },

  // Cambiar contraseña
  cambiarContrasena: async (id, passwords) => {
    try {
      const response = await api.put(`/usuarios/${id}/cambiar-contrasena`, passwords);
      return response.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },

  // Gestión de favoritos
  obtenerFavoritos: async (id) => {
    try {
      const response = await api.get(`/usuarios/${id}/favoritos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      throw error;
    }
  },

  agregarFavorito: async (id, partituraId) => {
    try {
      const response = await api.post(`/usuarios/${id}/favoritos/${partituraId}`);
      return response.data;
    } catch (error) {
      console.error('Error al agregar favorito:', error);
      throw error;
    }
  },

  quitarFavorito: async (id, partituraId) => {
    try {
      const response = await api.delete(`/usuarios/${id}/favoritos/${partituraId}`);
      return response.data;
    } catch (error) {
      console.error('Error al quitar favorito:', error);
      throw error;
    }
  },

  alternarFavorito: async (id, partituraId) => {
    try {
      const response = await api.put(`/usuarios/${id}/favoritos/${partituraId}`);
      return response.data;
    } catch (error) {
      console.error('Error al alternar favorito:', error);
      throw error;
    }
  }
};

export default usuarioService;
