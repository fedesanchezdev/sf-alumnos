import React, { useState, useEffect } from 'react';
import { MessageCircle, Music, Calendar, Clock, Eye, EyeOff } from 'lucide-react';
import { sesionEstudioService } from '../../services/sesionEstudioService';
import { toast } from 'react-hot-toast';

const MisComentariosProfesor = () => {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandidas, setExpandidas] = useState({});

  useEffect(() => {
    cargarSesionesConComentarios();
  }, []);

  const cargarSesionesConComentarios = async () => {
    try {
      setCargando(true);
      // Obtener sesiones del usuario que tengan comentarios del profesor
      const response = await sesionEstudioService.obtenerHistorial({
        page: 1,
        limit: 50 // Cargar más sesiones para encontrar las que tienen comentarios
      });
      
      if (response.success) {
        // Filtrar solo las que tienen comentarios del profesor
        const sesionesConComentarios = response.sesiones.filter(
          sesion => sesion.comentariosProfesor && sesion.comentariosProfesor.trim() !== ''
        );
        setSesiones(sesionesConComentarios);
      }
    } catch (error) {
      console.error('Error al cargar sesiones con comentarios:', error);
      toast.error('Error al cargar los comentarios del profesor');
    } finally {
      setCargando(false);
    }
  };

  const toggleExpandir = (sesionId) => {
    setExpandidas(prev => ({
      ...prev,
      [sesionId]: !prev[sesionId]
    }));
  };

  const formatearTiempo = (segundos) => {
    if (!segundos || isNaN(segundos) || segundos < 0) {
      return '00:00';
    }
    
    const segundosNum = Math.floor(Number(segundos));
    const horas = Math.floor(segundosNum / 3600);
    const minutos = Math.floor((segundosNum % 3600) / 60);
    const secs = segundosNum % 60;
    
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  if (cargando) {
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
          Comentarios del Profesor
        </h1>

        {sesiones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay comentarios del profesor
            </h3>
            <p className="text-gray-500">
              Cuando compartas sesiones de estudio y tu profesor las comente, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sesiones.map((sesion) => (
              <div key={sesion._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  {/* Header de la sesión */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {sesion.compositor} - {sesion.obra}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(sesion.fechaInicio).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatearTiempo(sesion.tiempoTotalSegundos)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpandir(sesion._id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                    >
                      {expandidas[sesion._id] ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>

                  {/* Comentario del profesor */}
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-green-800 mb-2">
                          Comentario del profesor:
                        </h4>
                        <p className="text-sm text-green-700 leading-relaxed">
                          {sesion.comentariosProfesor}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tu comentario original */}
                  {sesion.comentarios && (
                    <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">
                            Tu comentario original:
                          </h4>
                          <p className="text-sm text-blue-700 leading-relaxed">
                            {sesion.comentarios}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detalles expandidos */}
                  {expandidas[sesion._id] && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Detalles de la sesión:
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">BPM:</span>
                          <span className="ml-2">
                            {sesion.bpmInicial === sesion.bpmFinal 
                              ? `${sesion.bpmFinal}` 
                              : `${sesion.bpmInicial} → ${sesion.bpmFinal}`
                            }
                          </span>
                        </div>
                        
                        {sesion.movimientoPieza && (
                          <div>
                            <span className="font-medium">Movimiento:</span>
                            <span className="ml-2">{sesion.movimientoPieza}</span>
                          </div>
                        )}
                        
                        {sesion.compasesEstudiados && (
                          <div>
                            <span className="font-medium">Compases:</span>
                            <span className="ml-2">{sesion.compasesEstudiados}</span>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium">Compartida:</span>
                          <span className="ml-2">
                            {formatearFecha(sesion.fechaCompartida)}
                          </span>
                        </div>
                      </div>

                      {/* Historial de BPM */}
                      {sesion.cambiosMetronomo && sesion.cambiosMetronomo.length > 0 && (
                        <div className="mt-4">
                          <span className="text-sm font-medium text-gray-700">
                            Historial de BPM:
                          </span>
                          <div className="mt-2 space-y-1">
                            <div className="text-xs text-gray-600">
                              {sesion.bpmInicial} BPM 
                              <span className="text-gray-400 ml-1">
                                (desde 00:00 hasta {formatearTiempo(sesion.cambiosMetronomo[0]?.tiempoEstudioEnSegundos || 0)})
                              </span>
                            </div>
                            
                            {sesion.cambiosMetronomo.map((cambio, index) => {
                              const tiempoSegundos = cambio.tiempoEstudioEnSegundos || 0;
                              const siguienteCambio = sesion.cambiosMetronomo[index + 1];
                              const tiempoHasta = siguienteCambio 
                                ? siguienteCambio.tiempoEstudioEnSegundos 
                                : sesion.tiempoTotalSegundos;
                              
                              return (
                                <div key={index} className="text-xs text-gray-600">
                                  {cambio.bpm} BPM 
                                  <span className="text-gray-400 ml-1">
                                    (desde {formatearTiempo(tiempoSegundos)} hasta {formatearTiempo(tiempoHasta)})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MisComentariosProfesor;
