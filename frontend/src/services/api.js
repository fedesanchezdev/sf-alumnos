import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      
      // Redirigir al login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Servicios para la gestión de usuarios/alumnos
export const usuariosService = {
  // Obtener todos los usuarios
  obtenerTodos: () => api.get('/usuarios'),
  
  // Obtener usuario por ID
  obtenerPorId: (id) => api.get(`/usuarios/${id}`),
  
  // Crear nuevo usuario
  crear: (userData) => api.post('/usuarios', userData),
  
  // Actualizar usuario
  actualizar: (id, userData) => api.put(`/usuarios/${id}`, userData),
  
  // Eliminar usuario
  eliminar: (id) => api.delete(`/usuarios/${id}`),
  
  // Cambiar estado de usuario (pausar/reactivar)
  cambiarEstado: (id, activo) => api.patch(`/usuarios/${id}/estado`, { activo }),
  
  // Eliminar usuario completo (con todos sus datos)
  eliminarCompleto: (id) => api.delete(`/usuarios/${id}/completo`),
  
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Cambiar contraseña
  cambiarContrasena: (id, passwords) => api.put(`/usuarios/${id}/cambiar-contrasena`, passwords),
  
  // Favoritos
  obtenerFavoritos: (id) => api.get(`/usuarios/${id}/favoritos`),
  agregarFavorito: (id, partituraId) => api.post(`/usuarios/${id}/favoritos/${partituraId}`),
  quitarFavorito: (id, partituraId) => api.delete(`/usuarios/${id}/favoritos/${partituraId}`),
  alternarFavorito: (id, partituraId) => api.put(`/usuarios/${id}/favoritos/${partituraId}`)
};

// Servicios para la gestión de pagos
export const pagosService = {
  // Obtener todos los pagos (solo admin)
  obtenerTodos: () => api.get('/pagos'),
  
  // Obtener pagos por usuario
  obtenerPorUsuario: (usuarioId) => api.get(`/pagos/usuario/${usuarioId}`),
  
  // Crear nuevo pago
  crear: (pagoData) => api.post('/pagos', pagoData),
  
  // Actualizar pago
  actualizar: (id, pagoData) => api.put(`/pagos/${id}`, pagoData),
  
  // Eliminar pago
  eliminar: (id) => api.delete(`/pagos/${id}`),
  
  // Agregar clases individuales a un pago
  agregarClases: (pagoId, fechasClases) => api.post(`/pagos/${pagoId}/clases`, { fechasClases }),
};

// Servicios para la gestión de clases
export const clasesService = {
  // Obtener todas las clases (solo admin)
  obtenerTodas: () => api.get('/clases'),
  
  // Obtener estudiantes con clases pagadas agrupados por día (solo admin)
  obtenerEstudiantesPorDia: () => api.get('/clases/estudiantes-por-dia'),
  
  // Obtener clases por usuario
  obtenerPorUsuario: (usuarioId) => api.get(`/clases/usuario/${usuarioId}`),
  
  // Obtener clases por pago
  obtenerPorPago: (pagoId) => api.get(`/clases/pago/${pagoId}`),
  
  // Obtener clases separadas por último pago e historial
  obtenerSeparadas: (usuarioId) => api.get(`/clases/usuario/${usuarioId}/separadas`),
  
  // Obtener resumen de clases por usuario
  obtenerResumen: (usuarioId) => api.get(`/clases/resumen/${usuarioId}`),
  
  // Obtener clases por fecha
  obtenerPorFecha: (fecha) => api.get(`/clases/fecha/${fecha}`),
  
  // Actualizar estado de clase
  actualizarEstado: (id, estadoData) => api.put(`/clases/${id}/estado`, estadoData),
};

// Servicios para partituras
export const partiturasService = {
  // Obtener todas las partituras
  obtenerTodas: () => api.get('/partituras'),
  
  // Buscar partituras por término
  buscar: (termino) => api.get(`/partituras/buscar?q=${encodeURIComponent(termino)}`),
  
  // Obtener partituras por compositor
  obtenerPorCompositor: (compositor) => api.get(`/partituras/compositor/${encodeURIComponent(compositor)}`),
  
  // Crear nueva partitura (solo admin)
  crear: (partituraData) => api.post('/partituras', partituraData),
  
  // Actualizar partitura (solo admin)
  actualizar: (id, partituraData) => api.put(`/partituras/${id}`, partituraData),
  
  // Eliminar partitura (solo admin)
  eliminar: (id) => api.delete(`/partituras/${id}`)
};

// Servicios para resúmenes de clase
export const resumenClaseService = {
  // Obtener resumen por clase
  obtenerPorClase: (claseId) => api.get(`/resumenes-clase/clase/${claseId}`),
  
  // Obtener resúmenes por usuario
  obtenerPorUsuario: (usuarioId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/resumenes-clase/usuario/${usuarioId}${queryParams ? `?${queryParams}` : ''}`);
  },
  
  // Obtener estadísticas de usuario
  obtenerEstadisticas: (usuarioId) => api.get(`/resumenes-clase/estadisticas/${usuarioId}`),
  
  // Crear o actualizar resumen
  crearOActualizar: (resumenData) => api.post('/resumenes-clase', resumenData),
  
  // Eliminar resumen
  eliminar: (id) => api.delete(`/resumenes-clase/${id}`),
};

export default api;
