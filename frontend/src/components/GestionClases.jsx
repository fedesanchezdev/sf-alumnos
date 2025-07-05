import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clasesService, usuariosService } from '../services/api';
import { formatearFecha, formatearFechaCorta, esHoy, esMañana } from '../utils/fechas';
import { useAuth } from '../context/AuthContext';
import ResumenClase from './ResumenClase';
import LoadingSpinner from './LoadingSpinner';

const ESTADOS_CLASES = {
  no_iniciada: {
    label: 'No iniciada',
    color: 'bg-gray-400 hover:bg-gray-500',
    textColor: 'text-white',
    icon: '⚪'
  },
  tomada: {
    label: 'Tomada',
    color: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-white',
    icon: '🟢'
  },
  ausente: {
    label: 'Ausente',
    color: 'bg-red-500 hover:bg-red-600',
    textColor: 'text-white',
    icon: '🔴'
  },
  reprogramar: {
    label: 'Reprogramar',
    color: 'bg-amber-500 hover:bg-amber-600',
    textColor: 'text-white',
    icon: '🟡'
  },
  recuperada: {
    label: 'Recuperada',
    color: 'bg-purple-500 hover:bg-purple-600',
    textColor: 'text-white',
    icon: '🟣'
  }
};

const ClaseCard = ({ clase, onEstadoChange, usuarioId }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showResumen, setShowResumen] = useState(false);
  const [notas, setNotas] = useState(clase.notas || '');
  const [fechaReprogramada, setFechaReprogramada] = useState('');

  const estadoActual = ESTADOS_CLASES[clase.estado] || ESTADOS_CLASES.no_iniciada;

  const handleEstadoClick = () => {
    setShowModal(true);
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    setIsUpdating(true);
    try {
      const data = {
        estado: nuevoEstado,
        notas: notas
      };

      // Si es reprogramar, incluir fecha
      if (nuevoEstado === 'reprogramar' && fechaReprogramada) {
        data.fechaReprogramada = fechaReprogramada;
      }

      await clasesService.actualizarEstado(clase._id, data);
      onEstadoChange(clase._id);
      setShowModal(false);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la clase');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className={`${estadoActual.color} ${estadoActual.textColor} p-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{estadoActual.icon}</span>
          <span className="text-sm font-semibold">{estadoActual.label}</span>
        </div>
        
        <div className="text-sm">
          <p className="font-bold mb-1">{formatearFecha(clase.fecha)}</p>
          
          {clase.pago && (
            <p className="opacity-90">
              Pago: ${clase.pago.monto?.toLocaleString()}
            </p>
          )}
          
          {clase.fechaReprogramada && (
            <p className="mt-2 text-xs opacity-80">
              Reprogramada para: {formatearFecha(clase.fechaReprogramada)}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleEstadoClick}
            className="flex-1 px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors"
          >
            Estado
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowResumen(true);
            }}
            className="flex-1 px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors"
          >
            📝 Resumen
          </button>
        </div>
      </div>

      {/* Modal para cambiar estado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              Cambiar estado de clase
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {formatearFecha(clase.fecha)}
            </p>

            <div className="grid grid-cols-1 gap-2 mb-4">
              {Object.entries(ESTADOS_CLASES).map(([key, estado]) => (
                <button
                  key={key}
                  onClick={() => handleCambiarEstado(key)}
                  disabled={isUpdating}
                  className={`${estado.color} ${estado.textColor} p-2 rounded text-sm font-semibold disabled:opacity-50 flex items-center gap-2`}
                >
                  <span>{estado.icon}</span>
                  {estado.label}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows="3"
                placeholder="Agregar notas sobre la clase..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de reprogramación (opcional)
              </label>
              <input
                type="date"
                value={fechaReprogramada}
                onChange={(e) => setFechaReprogramada(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Resumen de Clase */}
      {showResumen && (
        <ResumenClase
          claseId={clase._id}
          usuarioId={usuarioId}
          fecha={clase.fecha}
          onClose={() => setShowResumen(false)}
        />
      )}
    </>
  );
};

const GestionClases = ({ usuarioSeleccionado }) => {
  const { usuario: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [clasesUltimoPago, setClasesUltimoPago] = useState([]);
  const [historialClases, setHistorialClases] = useState([]);
  const [ultimoPago, setUltimoPago] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(usuarioSeleccionado || searchParams.get('usuario') || '');
  const [resumen, setResumen] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [estudiantesPorDia, setEstudiantesPorDia] = useState([]);
  const [mostrarEstudiantesPorDia, setMostrarEstudiantesPorDia] = useState(true);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  const [clasesOrdenadas, setClasesOrdenadas] = useState([]);

  const esAdmin = currentUser?.rol === 'administrador';

  // Funciones para manejar localStorage del orden de clases
  const getLocalStorageKey = (usuarioId) => `clases_orden_${usuarioId}`;
  
  const guardarOrdenEnLocalStorage = (usuarioId, orden) => {
    try {
      const key = getLocalStorageKey(usuarioId);
      localStorage.setItem(key, JSON.stringify(orden));
    } catch (error) {
      console.error('Error al guardar orden en localStorage:', error);
    }
  };
  
  const obtenerOrdenDeLocalStorage = (usuarioId) => {
    try {
      const key = getLocalStorageKey(usuarioId);
      const ordenGuardado = localStorage.getItem(key);
      return ordenGuardado ? JSON.parse(ordenGuardado) : null;
    } catch (error) {
      console.error('Error al obtener orden de localStorage:', error);
      return null;
    }
  };

  // Obtener usuarios para el selector
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await usuariosService.obtenerTodos();
        setUsuarios(response.data);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };

    fetchUsuarios();
  }, []);

  // Actualizar usuario cuando cambien los searchParams
  useEffect(() => {
    const usuarioFromUrl = searchParams.get('usuario');
    if (usuarioFromUrl && usuarioFromUrl !== usuarioActual) {
      setUsuarioActual(usuarioFromUrl);
    }
  }, [searchParams]);

  // Cargar clases cuando cambia el usuario seleccionado
  useEffect(() => {
    if (usuarioActual) {
      // Limpiar el orden anterior al cambiar de usuario
      setClasesOrdenadas([]);
      cargarClases();
    }
  }, [usuarioActual]);

  // Actualizar orden de clases cuando cambian las clases del último pago
  useEffect(() => {
    if (clasesUltimoPago.length > 0 && usuarioActual) {
      // Intentar obtener orden guardado de localStorage
      const ordenGuardado = obtenerOrdenDeLocalStorage(usuarioActual);
      
      setClasesOrdenadas(prevClases => {
        if (prevClases.length === 0) {
          // Primera carga: usar orden guardado o crear orden inicial
          if (ordenGuardado && ordenGuardado.length > 0) {
            // Recrear el orden usando los IDs guardados, pero con los datos actualizados
            const clasesOrdenadas = [];
            const clasesDisponibles = [...clasesUltimoPago];
            
            // Primero agregar las clases en el orden guardado
            ordenGuardado.forEach(claseId => {
              const claseEncontrada = clasesDisponibles.find(c => c._id === claseId);
              if (claseEncontrada) {
                clasesOrdenadas.push(claseEncontrada);
                // Remover de disponibles para evitar duplicados
                const index = clasesDisponibles.findIndex(c => c._id === claseId);
                clasesDisponibles.splice(index, 1);
              }
            });
            
            // Agregar cualquier clase nueva que no esté en el orden guardado
            clasesDisponibles.forEach(claseNueva => {
              clasesOrdenadas.push(claseNueva);
            });
            
            return clasesOrdenadas;
          } else {
            // No hay orden guardado: ordenar por fecha y guardar
            const clasesOrdenadasPorFecha = [...clasesUltimoPago].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            const ordenIds = clasesOrdenadasPorFecha.map(c => c._id);
            guardarOrdenEnLocalStorage(usuarioActual, ordenIds);
            return clasesOrdenadasPorFecha;
          }
        } else {
          // Actualización: mantener el orden pero actualizar los datos de las clases
          return prevClases.map(claseOrdenada => {
            const claseActualizada = clasesUltimoPago.find(c => c._id === claseOrdenada._id);
            return claseActualizada || claseOrdenada;
          }).filter(clase => clasesUltimoPago.some(c => c._id === clase._id));
        }
      });
    } else {
      setClasesOrdenadas([]);
    }
  }, [clasesUltimoPago, usuarioActual]);

  // Cargar estudiantes por día cuando se monta el componente (solo admin)
  useEffect(() => {
    if (esAdmin) {
      cargarEstudiantesPorDia();
    }
  }, [esAdmin]);

  // Calcular resumen cuando cambian las clases del último pago
  useEffect(() => {
    cargarResumen();
  }, [clasesUltimoPago]);

  const cargarClases = async () => {
    if (!usuarioActual) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await clasesService.obtenerSeparadas(usuarioActual);
      setClasesUltimoPago(response.data.clasesUltimoPago);
      setHistorialClases(response.data.historialClases);
      setUltimoPago(response.data.ultimoPago);
    } catch (error) {
      setError('Error al cargar las clases');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarResumen = async () => {
    if (!usuarioActual) return;
    
    try {
      // Calcular resumen solo para las clases del último pago
      const resumenCalculado = clasesUltimoPago.reduce((acc, clase) => {
        acc[clase.estado] = (acc[clase.estado] || 0) + 1;
        return acc;
      }, {});
      
      // Asegurar que todos los estados estén presentes
      const resumenCompleto = {
        no_iniciada: 0,
        tomada: 0,
        ausente: 0,
        reprogramar: 0,
        recuperada: 0,
        ...resumenCalculado
      };
      
      setResumen(resumenCompleto);
    } catch (error) {
      console.error('Error al calcular resumen:', error);
    }
  };

  const cargarEstudiantesPorDia = async () => {
    setLoadingEstudiantes(true);
    try {
      const response = await clasesService.obtenerEstudiantesPorDia();
      setEstudiantesPorDia(response.data);
    } catch (error) {
      console.error('Error al cargar estudiantes por día:', error);
    } finally {
      setLoadingEstudiantes(false);
    }
  };

  const handleEstadoChange = (claseId) => {
    // Primero recargar los datos del servidor
    cargarClases().then(() => {
      // Después de recargar, mover la clase modificada al final y guardar en localStorage
      setClasesOrdenadas(prevClases => {
        const clasesActualizadas = [...prevClases];
        const indiceClase = clasesActualizadas.findIndex(clase => clase._id === claseId);
        
        if (indiceClase !== -1) {
          // Remover la clase de su posición actual
          const [claseModificada] = clasesActualizadas.splice(indiceClase, 1);
          // Agregarla al final
          clasesActualizadas.push(claseModificada);
          
          // Guardar el nuevo orden en localStorage
          if (usuarioActual) {
            const nuevoOrden = clasesActualizadas.map(c => c._id);
            guardarOrdenEnLocalStorage(usuarioActual, nuevoOrden);
          }
        }
        
        return clasesActualizadas;
      });
    });
    
    cargarResumen();
  };

  const resetearOrden = () => {
    if (usuarioActual && clasesUltimoPago.length > 0) {
      // Ordenar por fecha nuevamente
      const clasesOrdenadasPorFecha = [...clasesUltimoPago].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setClasesOrdenadas(clasesOrdenadasPorFecha);
      
      // Guardar el nuevo orden en localStorage
      const nuevoOrden = clasesOrdenadasPorFecha.map(c => c._id);
      guardarOrdenEnLocalStorage(usuarioActual, nuevoOrden);
    }
  };

  const usuarioSeleccionadoData = usuarios.find(u => u._id === usuarioActual);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Gestión de Clases
      </h1>

      {/* Estudiantes por día (solo admin) - Vista principal */}
      {esAdmin && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              📅 Estudiantes con Clases Pagadas por Día
            </h2>
            <p className="text-gray-600 mb-4">
              Haz clic en cualquier estudiante para gestionar sus clases específicas
            </p>
            
            <button
              onClick={() => setMostrarEstudiantesPorDia(!mostrarEstudiantesPorDia)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg 
                className={`w-5 h-5 transform transition-transform ${mostrarEstudiantesPorDia ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {mostrarEstudiantesPorDia ? 'Ocultar vista por días' : 'Mostrar vista por días'}
            </button>
          </div>
          
          {mostrarEstudiantesPorDia && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              {loadingEstudiantes ? (
                <LoadingSpinner 
                  title="Cargando estudiantes..."
                  subtitle="Agrupando por días de la semana"
                  size="small"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {estudiantesPorDia
                    .filter(diaData => diaData.dia !== '1') // Excluir domingo (1)
                    .map((diaData) => (
                    <div key={diaData.dia} className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                        {diaData.nombreDia}
                      </h4>
                      <div className="text-xs text-gray-600 mb-2">
                        {diaData.estudiantes.length} estudiante{diaData.estudiantes.length !== 1 ? 's' : ''}
                      </div>
                      {diaData.estudiantes.length > 0 ? (
                        <div className="space-y-2">
                          {diaData.estudiantes.map((estudiante) => (
                            <div 
                              key={estudiante._id} 
                              className="p-2 bg-blue-50 rounded text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => setUsuarioActual(estudiante._id)}
                            >
                              <div className="font-medium text-blue-900 mb-1">
                                {estudiante.nombre} {estudiante.apellido}
                              </div>
                              {estudiante.ultimoPago.descripcion && (
                                <div className="text-gray-600 text-xs">
                                  {estudiante.ultimoPago.descripcion}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          Sin estudiantes
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selector manual de usuario (solo si no hay estudiante seleccionado desde la vista por días) */}
      {!usuarioActual && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            🔍 Búsqueda Manual de Usuario
          </h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Usuario Específico
              </label>
              <select
                value={usuarioActual}
                onChange={(e) => setUsuarioActual(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar usuario...</option>
                {usuarios.map((usuario) => (
                  <option key={usuario._id} value={usuario._id}>
                    {usuario.nombre} {usuario.apellido} ({usuario.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {usuarioActual && (
        <>
          {/* Botón para volver a la vista general */}
          <div className="mb-4">
            <button
              onClick={() => setUsuarioActual('')}
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a la vista general
            </button>
          </div>

          {/* Información del usuario y resumen en un contenedor */}
          {usuarioSeleccionadoData && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
              {/* Layout Desktop: 3 columnas */}
              <div className="hidden md:grid md:grid-cols-12 md:gap-6 md:items-center">
                {/* Izquierda: Nombre (4 columnas) */}
                <div className="col-span-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    👤 {usuarioSeleccionadoData.nombre} {usuarioSeleccionadoData.apellido}
                  </h2>
                </div>
                
                {/* Medio: Último pago (4 columnas) */}
                <div className="col-span-4">
                  {ultimoPago && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-700">
                        Último Pago - ${ultimoPago.monto?.toLocaleString()}
                      </h3>
                      {ultimoPago.descripcion && (
                        <p className="text-green-600 text-sm">{ultimoPago.descripcion}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Derecha: Cards de resumen (4 columnas) */}
                <div className="col-span-4">
                  {Object.keys(resumen).length > 0 && (
                    <div className="grid grid-cols-5 gap-1">
                      {Object.entries(ESTADOS_CLASES).map(([key, estado]) => (
                        <div key={key} className="bg-gray-50 p-1 rounded text-center border">
                          <div className="flex flex-col items-center">
                            <span className="text-xs mb-0.5">{estado.icon}</span>
                            <span className="text-xs font-medium text-gray-600 mb-0.5 leading-tight">{estado.label}</span>
                            <p className="text-sm font-bold text-gray-800">
                              {resumen[key] || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Layout Mobile: Vertical */}
              <div className="md:hidden">
                {/* Arriba: Nombre y último pago */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    👤 {usuarioSeleccionadoData.nombre} {usuarioSeleccionadoData.apellido}
                  </h2>
                  {ultimoPago && (
                    <div>
                      <h3 className="text-base font-semibold text-green-700">
                        Último Pago - ${ultimoPago.monto?.toLocaleString()}
                      </h3>
                      {ultimoPago.descripcion && (
                        <p className="text-green-600 text-sm">{ultimoPago.descripcion}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Abajo: Cards de resumen */}
                {Object.keys(resumen).length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(ESTADOS_CLASES).map(([key, estado]) => (
                      <div key={key} className="bg-gray-50 p-2 rounded text-center border">
                        <div className="flex flex-col items-center">
                          <span className="text-sm mb-1">{estado.icon}</span>
                          <span className="text-xs font-medium text-gray-600 mb-1 leading-tight">{estado.label}</span>
                          <p className="text-base font-bold text-gray-800">
                            {resumen[key] || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clases del último pago */}
          {loading ? (
            <LoadingSpinner 
              title="Cargando clases..."
              subtitle="Obteniendo información de las clases"
              showRenderMessage={true}
              size="small"
            />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={cargarClases}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          ) : !ultimoPago ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay pagos registrados para este usuario.</p>
            </div>
          ) : clasesUltimoPago.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay clases programadas para el último pago.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {clasesUltimoPago.length} Clases Actuales
                  </h3>
                  <button
                    onClick={resetearOrden}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Resetear orden a cronológico"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resetear orden
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {clasesOrdenadas.map((clase) => (
                    <ClaseCard
                      key={clase._id}
                      clase={clase}
                      usuarioId={usuarioActual}
                      onEstadoChange={handleEstadoChange}
                    />
                  ))}
                </div>
              </div>

              {/* Historial de clases (colapsable) */}
              {historialClases.length > 0 && (
                <div className="mt-8">
                  <details 
                    className="bg-gray-50 rounded-lg overflow-hidden"
                    open={mostrarHistorial}
                    onToggle={(e) => setMostrarHistorial(e.target.open)}
                  >
                    <summary className="cursor-pointer p-4 bg-gray-100 hover:bg-gray-200 transition-colors">
                      <h3 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
                        📋 Historial de Clases ({historialClases.length})
                        <span className="text-sm font-normal text-gray-600">
                          (Pagos anteriores)
                        </span>
                      </h3>
                    </summary>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {historialClases.map((clase) => (
                          <ClaseCard
                            key={clase._id}
                            clase={clase}
                            usuarioId={usuarioActual}
                            onEstadoChange={handleEstadoChange}
                          />
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GestionClases;
