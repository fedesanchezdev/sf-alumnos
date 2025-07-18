import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Book, Calendar, TrendingUp, CheckCircle2, Settings } from 'lucide-react';
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
  filtrarEstados = null // array de estados a mostrar, null = todos
}) => {
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [añosExpandidos, setAñosExpandidos] = useState({ '2025': true });
  const [mesesExpandidos, setMesesExpandidos] = useState({});
  const [estudiosFinalizando, setEstudiosFinalizando] = useState(new Set());
  const [progresosTemporales, setProgresosTemporales] = useState({});

  useEffect(() => {
    if (usuarioId) {
      cargarEstudios();
    }
  }, [usuarioId]);

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
        return 'text-blue-600 bg-blue-100';
      case 'finalizado':
        return 'text-green-600 bg-green-100';
      case 'pausado':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'en_progreso':
        return 'En progreso';
      case 'finalizado':
        return 'Finalizado';
      case 'pausado':
        return 'Pausado';
      default:
        return estado;
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

  const finalizarEstudio = async (estudio) => {
    try {
      setEstudiosFinalizando(prev => new Set([...prev, estudio._id]));
      
      const progreso = progresosTemporales[estudio._id] || estudio.porcentajeProgreso;
      
      await estudioService.actualizarEstudio(estudio._id, {
        estado: 'finalizado',
        porcentajeProgreso: progreso
      });
      
      // Esperar 2 segundos antes de filtrar
      setTimeout(() => {
        setEstudios(prev => prev.filter(e => e._id !== estudio._id));
        setEstudiosFinalizando(prev => {
          const newSet = new Set(prev);
          newSet.delete(estudio._id);
          return newSet;
        });
        setProgresosTemporales(prev => {
          const newProgresos = { ...prev };
          delete newProgresos[estudio._id];
          return newProgresos;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error al finalizar estudio:', error);
      setEstudiosFinalizando(prev => {
        const newSet = new Set(prev);
        newSet.delete(estudio._id);
        return newSet;
      });
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
      <div className="space-y-3">
        {mostrarTitulo && (
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            📚 Estudios Activos ({estudios.length})
          </h3>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estudios.map(estudio => {
            const estaFinalizando = estudiosFinalizando.has(estudio._id);
            const progresoActual = progresosTemporales[estudio._id] !== undefined 
              ? progresosTemporales[estudio._id] 
              : estudio.porcentajeProgreso;
            
            return (
              <div 
                key={estudio._id} 
                className={`bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 rounded-lg p-4 shadow-sm transition-all duration-300 ${
                  estaFinalizando ? 'bg-green-50 border-green-300 scale-95 opacity-70' : 'hover:shadow-md hover:border-gray-400'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {estudio.compositor}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                      {estudio.obra}
                    </p>
                  </div>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(estudio.estado)}`}>
                    {getEstadoTexto(estudio.estado)}
                  </span>
                </div>
                
                {/* Slider de progreso */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600 flex items-center">
                      <Settings className="w-3 h-3 mr-1" />
                      Logro
                    </label>
                    <span className="text-xs font-semibold text-blue-600">
                      {progresoActual}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progresoActual}
                    onChange={(e) => actualizarProgreso(estudio._id, parseInt(e.target.value))}
                    disabled={estaFinalizando}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progresoActual}%, #e5e7eb ${progresoActual}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{formatearFecha(estudio.fechaInicio)}</span>
                  </div>
                </div>
                
                {estudio.notas && (
                  <div className="mb-3 text-xs text-gray-500 bg-gray-100 rounded p-2">
                    {estudio.notas.length > 50 ? `${estudio.notas.substring(0, 50)}...` : estudio.notas}
                  </div>
                )}
                
                {/* Botón de finalizar */}
                <button
                  onClick={() => finalizarEstudio(estudio)}
                  disabled={estaFinalizando}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center ${
                    estaFinalizando
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md active:scale-95'
                  }`}
                >
                  {estaFinalizando ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Finalizar Estudio
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vista en details (para GestionEstudios)
  const estudiosAgrupados = agruparEstudiosPorFecha(estudios);
  const años = Object.keys(estudiosAgrupados).sort((a, b) => b - a);

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
                    <div key={estudio._id} className="text-xs bg-white border border-gray-200 rounded p-2 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900">
                          {estudio.compositor} - {estudio.obra}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(estudio.estado)}`}>
                          {getEstadoTexto(estudio.estado)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-gray-600">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatearFecha(estudio.fechaInicio)}
                          </span>
                          {estudio.fechaFinalizada && (
                            <span className="flex items-center">
                              → {formatearFecha(estudio.fechaFinalizada)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          <span className="font-medium">{estudio.porcentajeProgreso}%</span>
                        </div>
                      </div>
                      
                      {estudio.notas && (
                        <div className="mt-1 text-gray-500 text-xs">
                          {estudio.notas}
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
