import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Music, Filter, Search, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { sesionEstudioService } from '../../services/sesionEstudioService';
import ModalEditarSesion from './ModalEditarSesion';
import { toast } from 'react-hot-toast';

const HistorialSesiones = () => {
  const [sesiones, setSesiones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    compositor: '',
    obra: '',
    fechaDesde: '',
    fechaHasta: '',
    periodoSemanal: '', // Nuevo filtro para período semanal
    page: 1,
    limit: 10
  });
  const [paginacion, setPaginacion] = useState({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para edición
  const [sesionEditando, setSesionEditando] = useState(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      // Cargar historial
      const responseHistorial = await sesionEstudioService.obtenerHistorial(filtros);
      
      if (responseHistorial.success) {
        setSesiones(responseHistorial.sesiones);
        setPaginacion(responseHistorial.paginacion);
      }

      // Cargar estadísticas con todos los filtros aplicados
      const responseEstadisticas = await sesionEstudioService.obtenerEstadisticas(
        filtros.fechaDesde,
        filtros.fechaHasta,
        filtros.compositor,
        filtros.obra
      );
      
      if (responseEstadisticas.success) {
        setEstadisticas(responseEstadisticas);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar el historial');
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
      periodoSemanal: '',
      page: 1,
      limit: 10
    });
    // No cerramos automáticamente los filtros cuando se llama desde el botón externo
  };

  // Función para calcular fechas según el período seleccionado
  const calcularPeriodo = (periodo) => {
    const hoy = new Date();
    
    if (periodo === 'inicio') {
      // Sin filtro de fecha - mostrar todo desde el inicio
      return {
        fechaDesde: '',
        fechaHasta: ''
      };
    }
    
    // Calcular días hacia atrás según el período
    const diasAtras = parseInt(periodo);
    
    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(hoy.getDate() - diasAtras + 1); // +1 para incluir el día actual
    fechaInicio.setHours(0, 0, 0, 0); // Comenzar al inicio del día
    
    // Para fechaHasta, asegurar que incluya todo el día de hoy
    const fechaFin = new Date(hoy);
    fechaFin.setHours(23, 59, 59, 999); // Hasta el final del día
    
    return {
      fechaDesde: fechaInicio.toISOString().split('T')[0],
      fechaHasta: fechaFin.toISOString().split('T')[0]
    };
  };

  const aplicarPeriodo = (periodo) => {
    if (periodo) {
      const { fechaDesde, fechaHasta } = calcularPeriodo(periodo);
      setFiltros(prev => ({
        ...prev,
        periodoSemanal: periodo,
        fechaDesde,
        fechaHasta,
        page: 1
      }));
    } else {
      setFiltros(prev => ({
        ...prev,
        periodoSemanal: '',
        fechaDesde: '',
        fechaHasta: '',
        page: 1
      }));
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, page: nuevaPagina }));
  };

  const formatearTiempo = (segundos) => {
    // Verificar si segundos es un número válido
    if (!segundos || isNaN(segundos) || segundos < 0) {
      return '00:00:00';
    }
    
    const segundosNum = Math.floor(Number(segundos));
    const horas = Math.floor(segundosNum / 3600);
    const minutos = Math.floor((segundosNum % 3600) / 60);
    const secs = segundosNum % 60;
    
    // Siempre mostrar formato HH:MM:SS
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

  // Función para editar sesión
  const handleEditarSesion = (sesion) => {
    setSesionEditando(sesion);
    setModalEditarAbierto(true);
  };

  // Función para eliminar sesión
  const handleEliminarSesion = async (sesionId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta sesión? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await sesionEstudioService.eliminarSesion(sesionId);
      
      if (response.success) {
        toast.success('Sesión eliminada correctamente');
        
        // Actualizar la lista local removiendo la sesión eliminada
        setSesiones(prevSesiones => 
          prevSesiones.filter(sesion => sesion._id !== sesionId)
        );
        
        // Recargar estadísticas
        cargarDatos();
      }
    } catch (error) {
      console.error('Error al eliminar sesión:', error);
      toast.error('Error al eliminar la sesión');
    }
  };

  // Función para guardar sesión editada
  const handleGuardarSesionEditada = (sesionActualizada) => {
    // Actualizar la sesión en la lista local
    setSesiones(prevSesiones => 
      prevSesiones.map(sesion => 
        sesion._id === sesionActualizada._id ? sesionActualizada : sesion
      )
    );
    
    // Recargar estadísticas
    cargarDatos();
  };

  // Cerrar modal de edición
  const cerrarModalEditar = () => {
    setSesionEditando(null);
    setModalEditarAbierto(false);
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
          Mi Historial de Sesiones
        </h1>

        {/* Estadísticas Generales */}
        {estadisticas && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total de Sesiones</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">
                    {estadisticas.resumen.totalSesiones}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                  <Calendar className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Tiempo Total</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">
                    {estadisticas.resumen.tiempoTotalHoras}h
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-green-100 rounded-full">
                  <Clock className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-2 md:items-center mb-6">
          {/* Selector de Período */}
          <div className="flex-1 md:flex-none">
            <select
              value={filtros.periodoSemanal}
              onChange={(e) => aplicarPeriodo(e.target.value)}
              className="w-full md:w-auto border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Seleccionar período...</option>
              <option value="7">Últimos 7 días</option>
              <option value="15">Últimos 15 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="60">Últimos 60 días</option>
              <option value="inicio">Desde el inicio</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            {/* Botón Limpiar visible cuando hay filtros activos */}
            {(filtros.periodoSemanal || filtros.compositor || filtros.obra || filtros.fechaDesde || filtros.fechaHasta) && (
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
              <span>Más Filtros</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        {mostrarFiltros && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros Adicionales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value, periodoSemanal: '' }))}
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
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value, periodoSemanal: '' }))}
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

        {/* Estadísticas por Obra */}
        {estadisticas && estadisticas.estadisticas.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas por Obra</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estadisticas.estadisticas.map((stat, index) => (
                <div key={index} className="bg-green-100 border border-green-200 rounded-lg shadow-sm h-full flex flex-col min-h-[180px] transition-all duration-300 ease-in-out hover:shadow-md">
                  <div className="p-4 text-left flex-1 flex flex-col">
                    {/* Header: Compositor y Obra */}
                    <div className="mb-3">
                      <h5 className="text-lg font-bold tracking-tight text-gray-900 break-words mb-1">
                        {stat.compositor}
                      </h5>
                      <h6 className="text-base font-semibold text-gray-700 break-words">
                        {stat.obra}
                      </h6>
                    </div>

                    {/* Información adicional si existe */}
                    {(stat.movimientoPieza || stat.compasesEstudiados) && (
                      <div className="flex-1 text-sm text-gray-600 mb-3">
                        {stat.movimientoPieza && (
                          <div className="text-center">
                            <span className="text-xs font-medium text-gray-500">{stat.movimientoPieza}</span>
                          </div>
                        )}
                        {stat.compasesEstudiados && (
                          <div className="flex justify-between mt-1">
                            <span className="font-medium">Compases:</span>
                            <span className="text-right text-xs">{stat.compasesEstudiados}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Estadísticas principales */}
                    <div className="mt-auto pt-3 border-t border-green-200">
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{stat.totalSesiones}</div>
                          <div className="text-xs text-gray-600">Sesiones</div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{stat.tiempoTotalMinutos}</div>
                          <div className="text-xs text-gray-600">Min</div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{new Date(stat.ultimaSesion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</div>
                          <div className="text-xs text-gray-600">Última</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Sesiones */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">Sesiones Recientes</h3>
          </div>

          {sesiones.length === 0 ? (
            <div className="p-8 text-center bg-gray-50">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron sesiones de estudio</p>
            </div>
          ) : (
            <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {sesiones.map((sesion) => (
                <div key={sesion._id} className="bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm h-full flex flex-col min-h-[200px] transition-all duration-300 ease-in-out hover:shadow-md">
                  <div className="p-4 text-left flex-1 flex flex-col">
                    {/* Header: Compositor y Obra */}
                    <div className="mb-3">
                      <h5 className="text-lg font-bold tracking-tight text-gray-900 break-words mb-1">
                        {sesion.compositor}
                      </h5>
                      <h6 className="text-base font-semibold text-gray-700 break-words">
                        {sesion.obra}
                      </h6>
                    </div>

                    {/* Información de la sesión */}
                    <div className="flex-1 space-y-2 text-sm text-gray-600">
                      {/* Tiempo y Fecha */}
                      <div className="flex justify-between">
                        <span className="font-medium">Tiempo:</span>
                        <span>{formatearTiempo(sesion.tiempoTotalSegundos)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium">Fecha:</span>
                        <span>
                          {new Date(sesion.fechaInicio).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* BPM simplificado */}
                      <div className="flex justify-between">
                        <span className="font-medium">BPM:</span>
                        <span>
                          {(sesion.bpmInicial === 0 && sesion.bpmFinal === 0) || 
                           (sesion.bpmInicial === 120 && sesion.bpmFinal === 120 && !sesion.metronomomUsado) ? (
                            <span className="text-gray-500">Sin metrónomo</span>
                          ) : sesion.bpmInicial === sesion.bpmFinal ? (
                            `${sesion.bpmFinal}`
                          ) : (
                            `${sesion.bpmInicial} → ${sesion.bpmFinal}`
                          )}
                        </span>
                      </div>

                      {/* Movimiento y Compases si existen */}
                      {(sesion.movimientoPieza || sesion.compasesEstudiados) && (
                        <div className="pt-2 border-t border-indigo-200">
                          {sesion.movimientoPieza && (
                            <div className="text-center">
                              <span className="text-xs font-medium text-gray-500">{sesion.movimientoPieza}</span>
                            </div>
                          )}
                          {sesion.compasesEstudiados && (
                            <div className="flex justify-between mt-1">
                              <span className="font-medium">Compases:</span>
                              <span className="text-right text-xs">{sesion.compasesEstudiados}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comentarios si existen */}
                      {sesion.comentarios && (
                        <div className="pt-2 border-t border-indigo-200">
                          <span className="font-medium block mb-1">Comentarios:</span>
                          <p className="text-xs text-gray-500 bg-indigo-50 p-2 rounded">{sesion.comentarios}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer: Acciones */}
                    <div className="mt-4 pt-3 border-t border-indigo-200 flex justify-between items-center">
                      {sesion.compartidaConProfesor && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Compartida
                        </span>
                      )}
                      <div className="flex-1"></div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditarSesion(sesion)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-200 rounded-full transition-colors"
                          title="Editar sesión"
                          disabled={sesion.estado === 'activa'}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminarSesion(sesion._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-200 rounded-full transition-colors"
                          title="Eliminar sesión"
                          disabled={sesion.estado === 'activa'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de edición */}
        <ModalEditarSesion
          sesion={sesionEditando}
          isOpen={modalEditarAbierto}
          onClose={cerrarModalEditar}
          onSave={handleGuardarSesionEditada}
        />

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

export default HistorialSesiones;
