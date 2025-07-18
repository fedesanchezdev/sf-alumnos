import api from './api';

const authService = {
  // Login de usuario
  login: async (credentials) => {
    try {
      const response = await api.post(`/auth/login`, credentials);
      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Obtener perfil del usuario autenticado
  obtenerPerfil: async () => {
    try {
      const response = await api.get(`/auth/perfil`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtener token almacenado
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Obtener usuario almacenado
  getUsuario: () => {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  // Guardar token y usuario
  guardarSession: (token, usuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }
};

export default authService;
