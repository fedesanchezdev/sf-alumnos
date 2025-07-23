import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Music, Filter, Search, MessageCircle, User, Eye, EyeOff } from 'lucide-react';
import { sesionEstudioService } from '../../services/sesionEstudioService';
import { toast } from 'react-hot-toast';

const SesionesCompartidas = () => {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    compositor: '',
    obra: '',
    fechaDesde: '',
    fechaHasta: '',
    alumno: '',
    page: 1,
    limit: 10
  });
  const [paginacion, setPaginacion] = useState({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [comentarios, setComentarios] = useState({});
  const [expandidas, setExpandidas] = useState({});

  useEffect(() => {
    cargarSesionesCompartidas();
  }, [filtros]);

  const cargarSesionesCompartidas = async () => {
    try {
      setCargando(true);
      const response = await sesionEstudioService.obtenerSesionesCompartidas(filtros);
      
      if (response.success) {
        setSesiones(response.sesiones);
        setPaginacion(response.paginacion);
      }
    } catch (error) {
      console.error('Error al cargar sesiones compartidas:', error);
      toast.error('Error al cargar las sesiones compartidas');
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    setFiltros(prev => ({ ...prev, page: 1 }));
    setMostrarFiltros(false);
  };

  const limpiarFiltros = () => {
    setFiltros({
      compositor: '',
      obra: '',
      fechaDesde: '',
      fechaHasta: '',
      alumno: '',
      page: 1,
      limit: 10
    });
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, page: nuevaPagina }));
  };

  const toggleExpandir = (sesionId) => {
    setExpandidas(prev => ({
      ...prev,
      [sesionId]: !prev[sesionId]
    }));
  };

  const handleComentarioProfesor = async (sesionId) => {
    const comentario = comentarios[sesionId];
    if (!comentario || comentario.trim() === '') {
      toast.error('Por favor ingresa un comentario');
      return;
    }

    try {
      const response = await sesionEstudioService.agregarComentarioProfesor(sesionId, comentario);
      
      if (response.success) {
        toast.success('Comentario agregado correctamente');
        
        // Actualizar la sesión en la lista local con la respuesta del servidor
        setSesiones(prevSesiones => 
          prevSesiones.map(sesion => 
            sesion._id === sesionId 
              ? { ...sesion, comentariosProfesor: response.sesion.comentariosProfesor }
              : sesion
          )
        );
        
        // Limpiar el comentario del input
        setComentarios(prev => ({
          ...prev,
          [sesionId]: ''
        }));
      }
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      toast.error('Error al agregar el comentario');
    }
  };

  const formatearTiempo = (segundos) => {
    if (!segundos || isNaN(segundos) || segundos < 0) {
      return '00:00:00';
    }
    
    const segundosNum = Math.floor(Number(segundos));
    const horas = Math.floor(segundosNum / 3600);
    const minutos = Math.floor((segundosNum % 3600) / 60);
    const secs = segundosNum % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (cargando && sesiones.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
          Sesiones Compartidas por Alumnos
        </h1>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-2 md:items-center mb-6">
          <div className="flex gap-2">
            {/* Botón Limpiar visible cuando hay filtros activos */}
            {(filtros.compositor || filtros.obra || filtros.fechaDesde || filtros.fechaHasta || filtros.alumno) && (
              <button
                onClick={limpiarFiltros}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
              >
                Limpiar
              </button>
            )}
            
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md flex items-center space-x-1 transition-colors text-sm"
            >
              <Filter size={16} />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        {/* Panel de Filtros */}
        {mostrarFiltros && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alumno
                </label>
                <input
                  type="text"
                  value={filtros.alumno}
                  onChange={(e) => setFiltros(prev => ({ ...prev, alumno: e.target.value }))}
                  placeholder="Buscar alumno..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compositor
                </label>
                <input
                  type="text"
                  value={filtros.compositor}
                  onChange={(e) => setFiltros(prev => ({ ...prev, compositor: e.target.value }))}
                  placeholder="Buscar compositor..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Obra
                </label>
                <input
                  type="text"
                  value={filtros.obra}
                  onChange={(e) => setFiltros(prev => ({ ...prev, obra: e.target.value }))}
                  placeholder="Buscar obra..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-4">
              <button
                onClick={aplicarFiltros}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Search size={16} />
                <span>Aplicar Filtros</span>
              </button>
              
              <button
                onClick={() => {
                  limpiarFiltros();
                  setMostrarFiltros(false);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Lista de Sesiones Compartidas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">
              Sesiones Compartidas ({paginacion.total || 0})
            </h3>
          </div>

          {sesiones.length === 0 ? (
            <div className="p-8 text-center bg-gray-50">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay sesiones compartidas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sesiones.map((sesion) => (
                <div key={sesion._id} className="p-6 hover:bg-gray-100 bg-gray-50/70 transition-colors border-l-2 border-gray-300">
                  <div className="space-y-3">
                    {/* Header: Alumno y botón expandir */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-blue-700">
                          {sesion.usuario.nombre} {sesion.usuario.apellido}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({sesion.usuario.email})
                        </span>
                      </div>
                      <button
                        onClick={() => toggleExpandir(sesion._id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandidas[sesion._id] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>

                    {/* Información de la obra */}
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base md:text-lg">
                        {sesion.compositor} - {sesion.obra}
                      </h4>
                    </div>

                    {/* Información básica */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Tiempo:</span>
                        <span className="ml-2">{formatearTiempo(sesion.tiempoTotalSegundos)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>
                        <span className="ml-2">
                          {new Date(sesion.fechaInicio).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Compartida:</span>
                        <span className="ml-2">
                          {formatearFecha(sesion.fechaCompartida)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">BPM:</span>
                        <span className="ml-2">
                          {sesion.bpmInicial === sesion.bpmFinal 
                            ? `${sesion.bpmFinal}` 
                            : `${sesion.bpmInicial} → ${sesion.bpmFinal}`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Comentario del alumno */}
                    {sesion.comentarioAlumno && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md">
                        <div className="flex items-start space-x-2 text-left">
                          <MessageCircle className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                          <div className="text-left w-full">
                            <p className="text-sm font-medium text-blue-800 text-left">Comentario del alumno:</p>
                            <p className="text-sm text-blue-700 mt-1 text-left leading-relaxed">{sesion.comentarioAlumno}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detalles expandidos */}
                    {expandidas[sesion._id] && (
                      <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-md">
                        {/* Movimiento y Compases */}
                        {(sesion.movimientoPieza || sesion.compasesEstudiados) && (
                          <div className="text-sm text-gray-600">
                            {sesion.movimientoPieza && (
                              <div className="text-center mb-2">
                                <span className="text-xs font-medium text-gray-500">{sesion.movimientoPieza}</span>
                              </div>
                            )}
                            {sesion.compasesEstudiados && <span><strong>Compases:</strong> {sesion.compasesEstudiados}</span>}
                          </div>
                        )}
                        
                        {/* Historial de BPM detallado */}
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Historial de BPM:</span>
                          <div className="ml-2 mt-1">
                            {sesion.cambiosMetronomo && sesion.cambiosMetronomo.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-xs">
                                  {sesion.bpmInicial} BPM 
                                  <span className="text-gray-400 ml-1">
                                    (desde 00:00:00 hasta {formatearTiempo(sesion.cambiosMetronomo[0]?.tiempoEstudioEnSegundos || 0)})
                                  </span>
                                </div>
                                
                                {sesion.cambiosMetronomo.map((cambio, index) => {
                                  const tiempoSegundos = cambio.tiempoEstudioEnSegundos || 0;
                                  const siguienteCambio = sesion.cambiosMetronomo[index + 1];
                                  const tiempoHasta = siguienteCambio 
                                    ? siguienteCambio.tiempoEstudioEnSegundos 
                                    : sesion.tiempoTotalSegundos;
                                  
                                  return (
                                    <div key={index} className="text-xs">
                                      {cambio.bpm} BPM 
                                      <span className="text-gray-400 ml-1">
                                        (desde {formatearTiempo(tiempoSegundos)} hasta {formatearTiempo(tiempoHasta)})
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-xs">
                                {(sesion.bpmInicial === 0 && sesion.bpmFinal === 0) || 
                                 (sesion.bpmInicial === 120 && sesion.bpmFinal === 120 && !sesion.metronomomUsado) ? (
                                  <span className="text-gray-500">Sin metrónomo</span>
                                ) : sesion.bpmInicial === sesion.bpmFinal ? (
                                  `${sesion.bpmFinal} BPM (toda la sesión)`
                                ) : (
                                  `${sesion.bpmInicial} → ${sesion.bpmFinal} BPM`
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Comentarios del alumno y profesor durante la sesión */}
                        {sesion.comentarios && (
                          <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                            <span className="font-medium">Comentarios de la sesión:</span>
                            <div className="mt-1">{sesion.comentarios}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Comentarios del profesor */}
                    {sesion.comentariosProfesor && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-md">
                        <div className="flex items-start space-x-2 text-left">
                          <MessageCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                          <div className="text-left w-full">
                            <p className="text-sm font-medium text-green-800 text-left">Tu comentario:</p>
                            <p className="text-sm text-green-700 mt-1 text-left whitespace-pre-wrap leading-relaxed">{sesion.comentariosProfesor}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Agregar comentario del profesor */}
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agregar comentario como profesor:
                      </label>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleComentarioProfesor(sesion._id);
                      }} className="flex space-x-2">
                        <textarea
                          value={comentarios[sesion._id] || ''}
                          onChange={(e) => setComentarios(prev => ({
                            ...prev,
                            [sesion._id]: e.target.value
                          }))}
                          placeholder="Escribe tu comentario para el alumno..."
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-left bg-white"
                          rows="2"
                        />
                        <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-1"
                        >
                          <MessageCircle size={16} />
                          <span>Enviar</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {paginacion.totalPaginas > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={() => cambiarPagina(filtros.page - 1)}
              disabled={filtros.page <= 1}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            <span className="text-sm text-gray-600">
              Página {paginacion.paginaActual} de {paginacion.totalPaginas}
            </span>

            <button
              onClick={() => cambiarPagina(filtros.page + 1)}
              disabled={filtros.page >= paginacion.totalPaginas}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SesionesCompartidas;
