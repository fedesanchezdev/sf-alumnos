import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clasesService, usuariosService, resumenClaseService } from '../services/api';
import { formatearFecha, formatearFechaCorta, esHoy, esMañana, fechaLocalAUTC } from '../utils/fechas';
import { useAuth } from '../context/AuthContext';
import ResumenClase from './ResumenClase';
import ResumenClaseCard from './ResumenClaseCard';
import LoadingSpinner from './LoadingSpinner';
import { logger } from '../utils/logger';

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

const ClaseCard = ({ clase, onEstadoChange, usuarioId, onResumenGuardado }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showResumen, setShowResumen] = useState(false);
  const [showEditNotas, setShowEditNotas] = useState(false);
  const [notas, setNotas] = useState(clase.notas || '');
  const [notasTemp, setNotasTemp] = useState(clase.notas || '');
  const [fechaReprogramada, setFechaReprogramada] = useState(
    clase.fechaReprogramada ? new Date(clase.fechaReprogramada).toISOString().split('T')[0] : ''
  );

  // Actualizar notas cuando cambie la clase
  useEffect(() => {
    setNotas(clase.notas || '');
    setNotasTemp(clase.notas || '');
  }, [clase.notas]);

  const estadoActual = ESTADOS_CLASES[clase.estado] || ESTADOS_CLASES.no_iniciada;

  const handleEstadoClick = () => {
    setShowModal(true);
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    // Validar que si es reprogramar, se haya seleccionado una fecha
    if (nuevoEstado === 'reprogramar' && !fechaReprogramada) {
      alert('Por favor selecciona una fecha para reprogramar la clase');
      return;
    }

    setIsUpdating(true);
    try {
      const data = {
        estado: nuevoEstado,
        notas: notas
      };

      // Si es reprogramar, incluir fecha
      if (nuevoEstado === 'reprogramar' && fechaReprogramada) {
        // Usar fechaLocalAUTC para enviar la fecha correctamente al backend
        data.fechaReprogramada = fechaLocalAUTC(fechaReprogramada);
      }

      await clasesService.actualizarEstado(clase._id, data);
      onEstadoChange(clase._id);
      setShowModal(false);
    } catch (error) {
      logger.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la clase');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeshacerReprogramacion = async () => {
    if (!confirm('¿Estás seguro de que quieres deshacer la reprogramación? La clase volverá a estado "No iniciada" y se eliminará la fecha reprogramada.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const data = {
        estado: 'no_iniciada',
        notas: notas,
        fechaReprogramada: null // Eliminar la fecha reprogramada
      };

      await clasesService.actualizarEstado(clase._id, data);
      onEstadoChange(clase._id);
      setShowModal(false);
    } catch (error) {
      logger.error('Error al deshacer reprogramación:', error);
      alert('Error al deshacer la reprogramación');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActualizarNotas = async () => {
    setIsUpdating(true);
    try {
      const data = {
        estado: clase.estado,
        notas: notasTemp
      };

      if (clase.fechaReprogramada) {
        data.fechaReprogramada = clase.fechaReprogramada;
      }

      await clasesService.actualizarEstado(clase._id, data);
      
      setNotas(notasTemp);
      onEstadoChange(clase._id);
      setShowEditNotas(false);
      
    } catch (error) {
      logger.error('Error al actualizar notas:', error);
      alert('Error al actualizar las notas: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditarNotas = () => {
    setNotasTemp(notas); // Cargar las notas actuales en el estado temporal
    setShowEditNotas(true);
  };

  const handleEliminarNotas = async () => {
    const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar las notas de esta clase?');
    if (!confirmDelete) {
      return;
    }
    
    setIsUpdating(true);
    try {
      const data = {
        estado: clase.estado,
        notas: ''
      };

      if (clase.fechaReprogramada) {
        data.fechaReprogramada = clase.fechaReprogramada;
      }

      await clasesService.actualizarEstado(clase._id, data);
      
      // Actualizar estado local
      setNotas('');
      setNotasTemp('');
      setShowEditNotas(false);
      
      // Refrescar la vista
      onEstadoChange(clase._id);
      
    } catch (error) {
      logger.error('Error al eliminar notas:', error);
      alert('Error al eliminar las notas: ' + (error.message || 'Error desconocido'));
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
          <p className="font-bold mb-1">{formatearFechaCorta(clase.fecha)}</p>
          
          {clase.pago && (
            <p className="opacity-90">
              Pago: ${clase.pago.monto?.toLocaleString()}
            </p>
          )}
          
          {clase.fechaReprogramada && (
            <p className="mt-2 text-xs bg-white bg-opacity-30 rounded px-2 py-1">
              📅 Reprogramada para: {formatearFechaCorta(clase.fechaReprogramada)}
            </p>
          )}
          
          {notas && (
            <p className="mt-2 text-xs bg-white bg-opacity-20 rounded px-2 py-1">
              📝 {notas}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="mt-3 flex gap-1">
          <button
            onClick={handleEstadoClick}
            className="flex-1 px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors"
          >
            Estado
          </button>
          
          {notas && (
            <button
              onClick={handleEditarNotas}
              className="px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors"
              title="Editar notas"
            >
              ✏️
            </button>
          )}
          
          <a
            href={`/alumnos/admin/resumen-clase/${clase._id}?usuarioId=${usuarioId}&fecha=${encodeURIComponent(clase.fecha)}&newTab=true`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              // Verificar que tengamos usuarioId
              if (!usuarioId) {
                e.preventDefault();
                alert('Error: No se puede abrir el resumen. Usuario no seleccionado.');
                return;
              }
              logger.debug('Abriendo resumen via enlace', {
                usuarioId,
                claseId: clase._id,
                url: `/alumnos/admin/resumen-clase/${clase._id}?usuarioId=${usuarioId}&fecha=${encodeURIComponent(clase.fecha)}&newTab=true`
              });
            }}
            className="flex-1 px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors text-center inline-block"
          >
            📝 Resumen
          </a>
        </div>
      </div>

      {/* Modal para cambiar estado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              Cambiar estado de clase
            </h3>
            
            <p className="text-sm text-gray-600 mb-2">
              📅 Fecha original: {formatearFechaCorta(clase.fecha)}
            </p>
            
            {clase.fechaReprogramada && (
              <p className="text-sm text-amber-600 mb-4 bg-amber-50 p-2 rounded">
                🔄 Reprogramada para: {formatearFechaCorta(clase.fechaReprogramada)}
              </p>
            )}

            <div className="grid grid-cols-1 gap-2 mb-4">
              {/* Mostrar opción de deshacer reprogramación si corresponde */}
              {clase.estado === 'reprogramar' && clase.fechaReprogramada && (
                <button
                  onClick={() => handleDeshacerReprogramacion()}
                  disabled={isUpdating}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm font-semibold disabled:opacity-50 flex items-center gap-2 border-2 border-gray-400"
                >
                  <span>↩️</span>
                  Deshacer reprogramación
                </button>
              )}
              
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
                Fecha de reprogramación
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Solo necesaria si seleccionas "Reprogramar". Deja vacío para otros estados.
              </p>
              <input
                type="date"
                value={fechaReprogramada}
                onChange={(e) => setFechaReprogramada(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
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
          onSave={() => {
            // Recargar resúmenes después de guardar
            if (onResumenGuardado) {
              onResumenGuardado();
            }
          }}
        />
      )}

      {/* Modal para editar notas */}
      {showEditNotas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              Editar notas de la clase
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              📅 Fecha: {formatearFechaCorta(clase.fecha)}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={notasTemp}
                onChange={(e) => setNotasTemp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Agregar notas sobre la clase..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowEditNotas(false);
                  setNotasTemp(notas); // Revertir cambios
                }}
                disabled={isUpdating}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              
              {notas && (
                <button
                  onClick={handleEliminarNotas}
                  disabled={isUpdating}
                  className="px-4 py-2 text-red-600 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50"
                  title="Eliminar notas"
                >
                  🗑️
                </button>
              )}
              
              <button
                onClick={handleActualizarNotas}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdating ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
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
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  const [clasesOrdenadas, setClasesOrdenadas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState(null); // null = mostrar todas
  const [resumenes, setResumenes] = useState([]); // Resúmenes de clase del usuario
  const [loadingResumenes, setLoadingResumenes] = useState(false);
  const [resumenEditando, setResumenEditando] = useState(null); // Para editar resumen existente

  const esAdmin = currentUser?.rol === 'administrador';

  // Funciones para manejar localStorage del orden de clases
  const getLocalStorageKey = (usuarioId) => `clases_orden_${usuarioId}`;
  
  const guardarOrdenEnLocalStorage = (usuarioId, orden) => {
    try {
      const key = getLocalStorageKey(usuarioId);
      localStorage.setItem(key, JSON.stringify(orden));
    } catch (error) {
      logger.error('Error al guardar orden en localStorage:', error);
    }
  };
  
  const obtenerOrdenDeLocalStorage = (usuarioId) => {
    try {
      const key = getLocalStorageKey(usuarioId);
      const ordenGuardado = localStorage.getItem(key);
      return ordenGuardado ? JSON.parse(ordenGuardado) : null;
    } catch (error) {
      logger.error('Error al obtener orden de localStorage:', error);
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
        logger.error('Error al obtener usuarios:', error);
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
      // Limpiar el orden anterior y filtro al cambiar de usuario
      setClasesOrdenadas([]);
      setFiltroEstado(null); // Limpiar filtro al cambiar de usuario
      cargarClases();
      // Cargar resúmenes con un pequeño delay para evitar llamadas excesivas
      setTimeout(() => {
        cargarResumenes();
      }, 150);
    } else {
      // Si no hay usuario seleccionado, limpiar todo
      setClasesOrdenadas([]);
      setClasesUltimoPago([]);
      setHistorialClases([]);
      setUltimoPago(null);
      setFiltroEstado(null); // Limpiar filtro también
      setResumenes([]);
    }
  }, [usuarioActual]);

  // Actualizar orden de clases cuando cambian las clases del último pago
  useEffect(() => {
    if (clasesUltimoPago.length > 0 && usuarioActual) {
      // Intentar obtener orden guardado de localStorage
      const ordenGuardado = obtenerOrdenDeLocalStorage(usuarioActual);
      
      setClasesOrdenadas(prevClases => {
        // Siempre crear un nuevo orden basado en las clases actuales
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

  // Calcular resumen cuando cambian las clases
  useEffect(() => {
    cargarResumen();
  }, [clasesUltimoPago, historialClases]);

  // Escuchar eventos de actualización de resumen desde otras pestañas
  useEffect(() => {
    let ultimoEventoTimestamp = 0; // Para evitar eventos duplicados
    
    const handleStorageChange = (e) => {
      if (e.key === 'resumen_update_event' && e.newValue) {
        try {
          const event = JSON.parse(e.newValue);
          
          // Evitar procesar el mismo evento múltiples veces
          if (event.timestamp && event.timestamp <= ultimoEventoTimestamp) {
            return;
          }
          
          logger.dev('📝 Evento de resumen detectado:', event);
          ultimoEventoTimestamp = event.timestamp;
          
          // Verificar si el evento es para el usuario actual
          if (event.type === 'resumen_guardado' && event.usuarioId === usuarioActual) {
            logger.info('🔄 Recargando resúmenes por actualización desde nueva pestaña...');
            // Recargar resúmenes del usuario actual con un delay más largo para evitar spam
            setTimeout(() => {
              cargarResumenes();
            }, 300);
          }
        } catch (error) {
          logger.error('Error al procesar evento de resumen:', error);
        }
      }
    };

    // Agregar listener para cambios en localStorage
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [usuarioActual]); // Dependencia en usuarioActual para reaccionar cuando cambie

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
      logger.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarResumenes = async () => {
    if (!usuarioActual) {
      setResumenes([]);
      return;
    }
    
    // Evitar llamadas simultáneas
    if (loadingResumenes) {
      logger.dev('⏳ Ya se están cargando resúmenes, saltando...');
      return;
    }
    
    logger.dev('🔄 Cargando resúmenes para usuario:', usuarioActual);
    setLoadingResumenes(true);
    try {
      const response = await resumenClaseService.obtenerPorUsuario(usuarioActual);
      logger.sensitive('📝 Respuesta de resúmenes:', response.data);
      
      // Filtrar resúmenes que tengan datos válidos de clase
      const resumenesValidos = (response.data.resumenes || []).filter(resumen => 
        resumen && resumen.clase && resumen.clase.fecha
      );
      
      logger.dev('✅ Resúmenes válidos:', resumenesValidos.length, 'de', (response.data.resumenes || []).length);
      
      if (resumenesValidos.length !== (response.data.resumenes || []).length) {
        logger.warn('⚠️ Se filtraron resúmenes con datos incompletos de clase');
      }
      
      setResumenes(resumenesValidos);
    } catch (error) {
      logger.error('❌ Error al cargar resúmenes:', error);
      setResumenes([]);
    } finally {
      setLoadingResumenes(false);
    }
  };

  const cargarResumen = () => {
    if (!usuarioActual) {
      setResumen({
        no_iniciada: 0,
        tomada: 0,
        ausente: 0,
        reprogramar: 0,
        recuperada: 0
      });
      return;
    }
    
    try {
      // Combinar todas las clases: último pago + historial
      const todasLasClases = [...clasesUltimoPago, ...historialClases];
      
      if (todasLasClases.length === 0) {
        setResumen({
          no_iniciada: 0,
          tomada: 0,
          ausente: 0,
          reprogramar: 0,
          recuperada: 0
        });
        return;
      }
      
      // Calcular resumen para todas las clases del usuario
      const resumenCalculado = todasLasClases.reduce((acc, clase) => {
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
      logger.error('Error al calcular resumen:', error);
    }
  };

  const cargarEstudiantesPorDia = async () => {
    setLoadingEstudiantes(true);
    try {
      const response = await clasesService.obtenerEstudiantesPorDia();
      setEstudiantesPorDia(response.data);
    } catch (error) {
      logger.error('Error al cargar estudiantes por día:', error);
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
      
      // Nota: cargarResumen() se ejecutará automáticamente por el useEffect de clasesUltimoPago
    });
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

  const handleFiltroEstado = (estado) => {
    // Si se clickea el mismo estado, quitar el filtro
    if (filtroEstado === estado) {
      setFiltroEstado(null);
    } else {
      setFiltroEstado(estado);
    }
  };

  // Función para filtrar clases basándose en el estado seleccionado
  const filtrarClases = (clases) => {
    if (!filtroEstado) return clases;
    return clases.filter(clase => clase.estado === filtroEstado);
  };

  // Funciones para manejar los resúmenes
  const handleEditarResumen = (resumen) => {
    setResumenEditando(resumen);
  };

  const handleEliminarResumen = (resumenId) => {
    setResumenes(prev => prev.filter(r => r._id !== resumenId));
  };

  const handleResumenGuardado = () => {
    logger.info('💾 Resumen guardado, recargando lista de resúmenes...');
    // Recargar resúmenes después de guardar con un pequeño delay para evitar spam
    setTimeout(() => {
      cargarResumenes();
    }, 200);
    setResumenEditando(null);
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
          <div className="bg-gray-50 rounded-lg p-4">
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
                            <div className="font-medium text-blue-900">
                              {estudiante.nombre}
                            </div>
                          </div>
                        ))}                        </div>
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
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <p className="text-xs text-gray-500">
                          📊 Resumen Total (Todas las clases)
                        </p>
                        {filtroEstado && (
                          <button
                            onClick={() => setFiltroEstado(null)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 px-2 py-1 rounded"
                            title="Limpiar filtro"
                          >
                            ✕ Limpiar filtro
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {Object.entries(ESTADOS_CLASES).map(([key, estado]) => {
                          const estaFiltrado = filtroEstado === key;
                          const tieneClases = (resumen[key] || 0) > 0;
                          
                          return (
                            <div 
                              key={key} 
                              className={`
                                p-1 rounded text-center border transition-all duration-200 cursor-pointer
                                ${estaFiltrado 
                                  ? `${estado.color} ${estado.textColor} ring-2 ring-offset-1 ring-blue-500 shadow-md` 
                                  : tieneClases 
                                    ? 'bg-gray-50 hover:bg-gray-100 hover:shadow-md transform hover:scale-105' 
                                    : 'bg-gray-50 opacity-60'
                                }
                                ${!tieneClases ? 'cursor-not-allowed' : ''}
                              `}
                              title={`${estado.label}: ${resumen[key] || 0} clase${(resumen[key] || 0) !== 1 ? 's' : ''}${tieneClases ? ' - Click para filtrar' : ''}`}
                              onClick={() => tieneClases && handleFiltroEstado(key)}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-xs mb-0.5">{estado.icon}</span>
                                <span className={`text-xs font-medium mb-0.5 leading-tight ${estaFiltrado ? 'text-white' : 'text-gray-600'}`}>
                                  {estado.label}
                                </span>
                                <p className={`text-sm font-bold ${estaFiltrado ? 'text-white' : 'text-gray-800'}`}>
                                  {resumen[key] || 0}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <p className="text-xs text-gray-500">
                        📊 Resumen Total (Todas las clases)
                      </p>
                      {filtroEstado && (
                        <button
                          onClick={() => setFiltroEstado(null)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 px-2 py-1 rounded"
                          title="Limpiar filtro"
                        >
                          ✕ Limpiar filtro
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(ESTADOS_CLASES).map(([key, estado]) => {
                        const estaFiltrado = filtroEstado === key;
                        const tieneClases = (resumen[key] || 0) > 0;
                        
                        return (
                          <div 
                            key={key} 
                            className={`
                              p-2 rounded text-center border transition-all duration-200 cursor-pointer
                              ${estaFiltrado 
                                ? `${estado.color} ${estado.textColor} ring-2 ring-offset-1 ring-blue-500 shadow-md` 
                                : tieneClases 
                                  ? 'bg-gray-50 hover:bg-gray-100 hover:shadow-md transform hover:scale-105' 
                                  : 'bg-gray-50 opacity-60'
                              }
                              ${!tieneClases ? 'cursor-not-allowed' : ''}
                            `}
                            title={`${estado.label}: ${resumen[key] || 0} clase${(resumen[key] || 0) !== 1 ? 's' : ''}${tieneClases ? ' - Click para filtrar' : ''}`}
                            onClick={() => tieneClases && handleFiltroEstado(key)}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-sm mb-1">{estado.icon}</span>
                              <span className={`text-xs font-medium mb-1 leading-tight ${estaFiltrado ? 'text-white' : 'text-gray-600'}`}>
                                {estado.label}
                              </span>
                              <p className={`text-base font-bold ${estaFiltrado ? 'text-white' : 'text-gray-800'}`}>
                                {resumen[key] || 0}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resúmenes de clase guardados */}
          {resumenes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📚 Resúmenes de Clase Guardados ({resumenes.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumenes.map((resumen) => (
                  <ResumenClaseCard
                    key={resumen._id}
                    resumen={resumen}
                    onEdit={handleEditarResumen}
                    onDelete={handleEliminarResumen}
                  />
                ))}
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
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {filtroEstado ? 
                        `${filtrarClases(clasesUltimoPago).length} Clases Filtradas` :
                        `${clasesUltimoPago.length} Clases Actuales`
                      }
                    </h3>
                    <p className="text-sm text-gray-600">
                      {filtroEstado ? (
                        <>
                          Mostrando solo: <span className="font-medium text-blue-600">
                            {ESTADOS_CLASES[filtroEstado]?.label}
                          </span> • Total de clases: {clasesUltimoPago.length + historialClases.length}
                        </>
                      ) : (
                        <>
                          Pago actual • Total de clases: {clasesUltimoPago.length + historialClases.length}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {filtroEstado && (
                      <button
                        onClick={() => setFiltroEstado(null)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        title="Limpiar filtro"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Limpiar filtro
                      </button>
                    )}
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
                </div>
                
                {/* Mostrar mensaje si el filtro no devuelve resultados */}
                {filtroEstado && filtrarClases(clasesUltimoPago).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No hay clases con estado "{ESTADOS_CLASES[filtroEstado]?.label}" en el pago actual.
                    </p>
                    <button
                      onClick={() => setFiltroEstado(null)}
                      className="mt-2 px-4 py-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      Ver todas las clases
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtrarClases(clasesOrdenadas.length > 0 ? clasesOrdenadas : clasesUltimoPago).map((clase) => (
                      <ClaseCard
                        key={clase._id}
                        clase={clase}
                        usuarioId={usuarioActual}
                        onEstadoChange={handleEstadoChange}
                        onResumenGuardado={cargarResumenes}
                      />
                    ))}
                  </div>
                )}
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
                        📋 Historial de Clases 
                        {filtroEstado ? (
                          <span className="text-sm font-normal text-gray-600">
                            ({filtrarClases(historialClases).length} de {historialClases.length} - {ESTADOS_CLASES[filtroEstado]?.label})
                          </span>
                        ) : (
                          <span className="text-sm font-normal text-gray-600">
                            ({historialClases.length})
                          </span>
                        )}
                        <span className="text-sm font-normal text-gray-600">
                          (Pagos anteriores - incluidas en el resumen total)
                        </span>
                      </h3>
                    </summary>
                    <div className="p-4">
                      {filtroEstado && filtrarClases(historialClases).length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-gray-600">
                            No hay clases con estado "{ESTADOS_CLASES[filtroEstado]?.label}" en el historial.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filtrarClases(historialClases).map((clase) => (
                            <ClaseCard
                              key={clase._id}
                              clase={clase}
                              usuarioId={usuarioActual}
                              onEstadoChange={handleEstadoChange}
                              onResumenGuardado={cargarResumenes}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal para editar resumen existente */}
      {resumenEditando && (
        <ResumenClase
          claseId={resumenEditando.clase._id}
          usuarioId={usuarioActual}
          fecha={resumenEditando.clase.fecha}
          resumenExistente={resumenEditando}
          onClose={() => setResumenEditando(null)}
          onSave={handleResumenGuardado}
        />
      )}
    </div>
  );
};

export default GestionClases;
