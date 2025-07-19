import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Book, Calendar, TrendingUp, CheckCircle2, Settings, Play, CheckCircle, Pause, Clock } from 'lucide-react';
import estudioService from '../services/estudioService';

// Estilos CSS en línea para el slider personalizado
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

// Inyectar estilos si no existen
if (!document.getElementById('slider-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'slider-styles';
  styleSheet.textContent = sliderStyles;
  document.head.appendChild(styleSheet);
}

const EstudiosUsuario = ({ 
  usuarioId, 
  mostrarTitulo = true, 
  modoVisualizacion = 'details', // 'details' o 'cards'
  filtrarEstados = null, // array de estados a mostrar, null = todos
  esAdmin = false // indica si el usuario es administrador
}) => {
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [añosExpandidos, setAñosExpandidos] = useState({ '2025': true });
  const [mesesExpandidos, setMesesExpandidos] = useState({});
  const [estudiosFinalizando, setEstudiosFinalizando] = useState(new Set());
  const [progresosTemporales, setProgresosTemporales] = useState({});
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [estudioAFinalizar, setEstudioAFinalizar] = useState(null);
  const [fechaFinalizacion, setFechaFinalizacion] = useState('');

  useEffect(() => {
    if (usuarioId) {
      cargarEstudios();
    }
  }, [usuarioId, filtrarEstados]);

  const cargarEstudios = async () => {
    try {
      setLoading(true);
      const response = await estudioService.obtenerEstudios({ usuarioId });
      
      let estudiosFiltrados = response.estudios || [];
      
      // Filtrar por estados si se especifica
      if (filtrarEstados && filtrarEstados.length > 0) {
        estudiosFiltrados = estudiosFiltrados.filter(estudio => 
          filtrarEstados.includes(estudio.estado)
        );
      }
      
      setEstudios(estudiosFiltrados);
    } catch (error) {
      console.error('Error al cargar estudios:', error);
      setError('Error al cargar los estudios');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'en_progreso':
        return 'text-blue-600';
      case 'finalizado':
        return 'text-green-600';
      case 'pausado':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEstadoIcono = (estado) => {
    switch (estado) {
      case 'en_progreso':
        return <Play className="w-3 h-3" />;
      case 'finalizado':
        return <CheckCircle className="w-3 h-3" />;
      case 'pausado':
        return <Pause className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const agruparEstudiosPorFecha = (estudios) => {
    const grupos = {};
    
    estudios.forEach(estudio => {
      const fecha = new Date(estudio.fechaInicio);
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();
      const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long' });
      
      if (!grupos[año]) {
        grupos[año] = {};
      }
      
      if (!grupos[año][mes]) {
        grupos[año][mes] = {
          nombre: nombreMes,
          estudios: []
        };
      }
      
      grupos[año][mes].estudios.push(estudio);
    });
    
    return grupos;
  };

  const toggleAño = (año) => {
    setAñosExpandidos(prev => ({
      ...prev,
      [año]: !prev[año]
    }));
  };

  const toggleMes = (año, mes) => {
    const key = `${año}-${mes}`;
    setMesesExpandidos(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const abrirModalFinalizar = (estudio) => {
    setEstudioAFinalizar(estudio);
    // Establecer fecha de hoy como predeterminada
    const hoy = new Date().toISOString().split('T')[0];
    setFechaFinalizacion(hoy);
    setMostrarModalFinalizar(true);
  };

  const cerrarModalFinalizar = () => {
    setMostrarModalFinalizar(false);
    setEstudioAFinalizar(null);
    setFechaFinalizacion('');
  };

  const finalizarEstudio = async () => {
    if (!estudioAFinalizar || !fechaFinalizacion) return;
    
    try {
      setEstudiosFinalizando(prev => new Set([...prev, estudioAFinalizar._id]));
      
      const progreso = progresosTemporales[estudioAFinalizar._id] || estudioAFinalizar.porcentajeProgreso;
      
      await estudioService.actualizarEstudio(estudioAFinalizar._id, {
        estado: 'finalizado',
        porcentajeProgreso: progreso,
        fechaFinalizada: fechaFinalizacion
      });
      
      // Cerrar modal
      cerrarModalFinalizar();
      
      // Esperar 2 segundos antes de filtrar
      setTimeout(() => {
        setEstudios(prev => prev.filter(e => e._id !== estudioAFinalizar._id));
        setEstudiosFinalizando(prev => {
          const newSet = new Set(prev);
          newSet.delete(estudioAFinalizar._id);
          return newSet;
        });
        setProgresosTemporales(prev => {
          const newProgresos = { ...prev };
          delete newProgresos[estudioAFinalizar._id];
          return newProgresos;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error al finalizar estudio:', error);
      setEstudiosFinalizando(prev => {
        const newSet = new Set(prev);
        newSet.delete(estudioAFinalizar._id);
        return newSet;
      });
      alert('Error al finalizar el estudio: ' + (error.response?.data?.message || error.message));
    }
  };

  const actualizarProgreso = async (estudioId, nuevoProgreso) => {
    try {
      setProgresosTemporales(prev => ({
        ...prev,
        [estudioId]: nuevoProgreso
      }));
      
      // Debounce la actualización al backend
      clearTimeout(window.progressTimeout);
      window.progressTimeout = setTimeout(async () => {
        await estudioService.actualizarEstudio(estudioId, {
          porcentajeProgreso: nuevoProgreso
        });
        
        // Actualizar el estudio en el estado local
        setEstudios(prev => prev.map(e => 
          e._id === estudioId 
            ? { ...e, porcentajeProgreso: nuevoProgreso }
            : e
        ));
      }, 1000);
      
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (estudios.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        {mostrarTitulo && <h3 className="text-sm font-medium text-gray-700 mb-2">📚 Estudios</h3>}
        {modoVisualizacion === 'cards' ? 'No hay estudios activos' : 'No hay estudios registrados'}
      </div>
    );
  }

  // Vista en cards (para GestionClases)
  if (modoVisualizacion === 'cards') {
    return (
      <>
        <div className="space-y-3">
          {mostrarTitulo && (
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              📚 Estudios Activos ({estudios.length})
            </h3>
          )}
          
          <div className="space-y-2">
            {estudios.map(estudio => {
              const estaFinalizando = estudiosFinalizando.has(estudio._id);
              const progresoActual = progresosTemporales[estudio._id] !== undefined 
                ? progresosTemporales[estudio._id] 
                : estudio.porcentajeProgreso;
              
              // Formatear fecha de inicio como "15JUL"
              const formatearFechaCorta = (fecha) => {
                if (!fecha) return '';
                const date = new Date(fecha);
                const dia = date.getDate().toString().padStart(2, '0');
                const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                const mes = meses[date.getMonth()];
                return `${dia}${mes}`;
              };
              
              return (
                <div 
                  key={estudio._id} 
                  className={`bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 overflow-hidden ${
                    estaFinalizando ? 'bg-green-50 border-green-300 opacity-70' : 'hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  <div className="grid grid-cols-[auto_1fr_auto] text-sm">
                    {/* Columna izquierda: Fecha de inicio */}
                    <div className="flex flex-col justify-center items-center min-w-[60px] bg-gray-700 text-white py-1">
                      <span className="font-bold text-sm">
                        {formatearFechaCorta(estudio.fechaInicio)}
                      </span>
                    </div>
                    
                    {/* Columna central: Contenido principal */}
                    <div className="flex flex-col gap-1 px-3 py-1">
                      {/* Primera línea: Compositor y obra */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {estudio.compositor}
                        </span>
                        <span className="text-gray-600 truncate flex-1">
                          {estudio.obra}
                        </span>
                      </div>
                      
                      {/* Segunda línea: Progreso y estado */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${progresoActual}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-blue-600">
                            {progresoActual}%
                          </span>
                        </div>
                        
                        <span className={`flex items-center justify-center min-w-[30px] ${getEstadoColor(estudio.estado)}`}>
                          {getEstadoIcono(estudio.estado)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Columna derecha: Fecha de finalización o botones */}
                    <div className={`flex flex-col justify-center items-center min-w-[60px] py-1 ${
                      estudio.fechaFinalizada ? 'bg-gray-700 text-white' : 'bg-gray-700 text-white'
                    }`}>
                      {estudio.fechaFinalizada ? (
                        <span className="font-bold text-sm">
                          {formatearFechaCorta(estudio.fechaFinalizada)}
                        </span>
                      ) : (
                        <>
                          <span className="font-bold text-sm text-white">-:-</span>
                          {/* Solo mostrar botón de finalizar si es admin */}
                          {esAdmin && estudio.estado !== 'finalizado' && (
                            <button
                              onClick={() => abrirModalFinalizar(estudio)}
                              disabled={estaFinalizando}
                              className={`mt-1 p-1 rounded text-xs transition-all duration-200 ${
                                estaFinalizando
                                  ? 'bg-green-500 text-white cursor-not-allowed'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md'
                              }`}
                              title="Finalizar estudio"
                            >
                              {estaFinalizando ? '⏳' : '✓'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal de finalización */}
          {mostrarModalFinalizar && estudioAFinalizar && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4 text-gray-900">
                  🎯 Finalizar Estudio
                </h3>
                
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">
                    {estudioAFinalizar.compositor}
                  </h4>
                  <p className="text-blue-700 text-sm">
                    {estudioAFinalizar.obra}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Fecha de finalización
                  </label>
                  <input
                    type="date"
                    value={fechaFinalizacion}
                    onChange={(e) => setFechaFinalizacion(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Por defecto se usa la fecha de hoy. No se permiten fechas futuras.
                  </p>
                </div>

                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Atención:</strong> Una vez finalizado, el estudio se ocultará de la vista de estudios activos y se marcará como completado.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cerrarModalFinalizar}
                    disabled={estudioAFinalizar && estudiosFinalizando.has(estudioAFinalizar._id)}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={finalizarEstudio}
                    disabled={(estudioAFinalizar && estudiosFinalizando.has(estudioAFinalizar._id)) || !fechaFinalizacion}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {(estudioAFinalizar && estudiosFinalizando.has(estudioAFinalizar._id)) ? 'Finalizando...' : 'Finalizar Estudio'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Vista en details (para GestionEstudios)
  const estudiosAgrupados = agruparEstudiosPorFecha(estudios);
  const años = Object.keys(estudiosAgrupados).sort((a, b) => b - a);

  // Formatear fecha de inicio como "15JUL"
  const formatearFechaCorta = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const mes = meses[date.getMonth()];
    return `${dia}${mes}`;
  };

  return (
    <div className="space-y-2">
      {mostrarTitulo && (
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          📚 Estudios ({estudios.length})
        </h3>
      )}
      
      {años.map(año => (
        <details key={año} className="group" open={añosExpandidos[año]}>
          <summary 
            className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-800 py-1 px-2 bg-gray-50 rounded hover:bg-gray-100"
            onClick={(e) => {
              e.preventDefault();
              toggleAño(año);
            }}
          >
            <span className="flex items-center">
              {añosExpandidos[año] ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
              {año}
            </span>
            <span className="text-xs text-gray-500">
              {Object.values(estudiosAgrupados[año]).reduce((total, mes) => total + mes.estudios.length, 0)} estudios
            </span>
          </summary>
          
          <div className="ml-4 mt-1 space-y-1">
            {Object.entries(estudiosAgrupados[año])
              .sort(([a], [b]) => b - a)
              .map(([mesNum, mesData]) => (
              <details key={`${año}-${mesNum}`} className="group" open={mesesExpandidos[`${año}-${mesNum}`]}>
                <summary 
                  className="flex items-center justify-between cursor-pointer text-xs font-medium text-gray-700 py-1 px-2 bg-gray-25 rounded hover:bg-gray-50"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleMes(año, mesNum);
                  }}
                >
                  <span className="flex items-center capitalize">
                    {mesesExpandidos[`${año}-${mesNum}`] ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                    {mesData.nombre}
                  </span>
                  <span className="text-xs text-gray-500">
                    {mesData.estudios.length} estudios
                  </span>
                </summary>
                
                <div className="ml-4 mt-1 space-y-1">
                  {mesData.estudios.map(estudio => (
                    <div key={estudio._id} className="bg-white border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-xs">
                        {/* Fecha de inicio */}
                        <span className="font-semibold text-gray-700 min-w-[45px]">
                          {formatearFechaCorta(estudio.fechaInicio)}
                        </span>
                        
                        {/* Compositor */}
                        <span className="font-medium text-gray-900 min-w-[100px] truncate">
                          {estudio.compositor}
                        </span>
                        
                        {/* Obra */}
                        <span className="text-gray-600 flex-1 truncate">
                          {estudio.obra}
                        </span>
                        
                        {/* Progreso con barra corta */}
                        <div className="flex items-center gap-1 min-w-[60px]">
                          <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${estudio.porcentajeProgreso}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-blue-600 w-6">
                            {estudio.porcentajeProgreso}%
                          </span>
                        </div>
                        
                        {/* Estado */}
                        <span className={`flex items-center justify-center min-w-[30px] ${getEstadoColor(estudio.estado)}`}>
                          {getEstadoIcono(estudio.estado)}
                        </span>
                        
                        {/* Fecha de finalización (si existe) */}
                        {estudio.fechaFinalizada && (
                          <span className="font-semibold text-green-700 min-w-[45px]">
                            {formatearFechaCorta(estudio.fechaFinalizada)}
                          </span>
                        )}
                      </div>
                      
                      {/* Notas (si existen) - en línea separada pero compacta */}
                      {estudio.notas && (
                        <div className="mt-1 ml-[45px] text-xs text-gray-500 italic">
                          📝 {estudio.notas}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
};

export default EstudiosUsuario;
