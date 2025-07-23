import api from './api';

export const sesionEstudioService = {
  // Crear nueva sesión de estudio
  crearSesion: async (datosSession) => {
    const response = await api.post('/sesiones-estudio', datosSession);
    return response.data;
  },

  // Obtener sesión activa
  obtenerSesionActiva: async () => {
    const response = await api.get('/sesiones-estudio/activa');
    return response.data;
  },

  // Actualizar sesión (cambios de metrónomo, pause, etc.)
  actualizarSesion: async (id, datos) => {
    const response = await api.put(`/sesiones-estudio/${id}`, datos);
    return response.data;
  },

  // Finalizar sesión
  finalizarSesion: async (id, datos) => {
    const response = await api.put(`/sesiones-estudio/${id}/finalizar`, datos);
    return response.data;
  },

  // Obtener historial de sesiones
  obtenerHistorial: async (filtros = {}) => {
    const params = new URLSearchParams();
    
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.compositor) params.append('compositor', filtros.compositor);
    if (filtros.obra) params.append('obra', filtros.obra);
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);

    const response = await api.get(`/sesiones-estudio/historial?${params.toString()}`);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (fechaDesde, fechaHasta, compositor, obra) => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (compositor) params.append('compositor', compositor);
    if (obra) params.append('obra', obra);

    const response = await api.get(`/sesiones-estudio/estadisticas?${params.toString()}`);
    return response.data;
  },

  // Obtener obras del usuario para selector
  obtenerObras: async () => {
    const response = await api.get('/sesiones-estudio/obras');
    return response.data;
  },

  // Eliminar sesión
  eliminarSesion: async (id) => {
    const response = await api.delete(`/sesiones-estudio/${id}`);
    return response.data;
  },

  // Editar sesión
  editarSesion: async (id, datos) => {
    const response = await api.put(`/sesiones-estudio/${id}/editar`, datos);
    return response.data;
  },

  // Obtener una sesión específica por ID
  obtenerSesionPorId: async (id) => {
    const response = await api.get(`/sesiones-estudio/${id}`);
    return response.data;
  },

  // Compartir sesión con el profesor
  compartirSesionConProfesor: async (id, compartir, comentarioAlumno = '') => {
    const response = await api.post(`/sesiones-estudio/${id}/compartir`, {
      compartir,
      comentarioAlumno
    });
    return response.data;
  },

  // Obtener sesiones compartidas (para profesores)
  obtenerSesionesCompartidas: async (filtros = {}) => {
    const params = new URLSearchParams();
    
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.compositor) params.append('compositor', filtros.compositor);
    if (filtros.obra) params.append('obra', filtros.obra);
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    if (filtros.alumno) params.append('alumno', filtros.alumno);

    const response = await api.get(`/sesiones-estudio/compartidas?${params.toString()}`);
    return response.data;
  },

  // Agregar comentario del profesor
  agregarComentarioProfesor: async (id, comentarioProfesor) => {
    const response = await api.post(`/sesiones-estudio/${id}/comentario-profesor`, {
      comentarioProfesor
    });
    return response.data;
  }
};
