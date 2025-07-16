import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resumenClaseService, clasesService } from '../services/api';
import { formatearFecha, formatearFechaCorta, formatearFechaAmericanaEspañol } from '../utils/fechas';
import { enviarWhatsApp, generarMensajeResumen } from '../utils/whatsapp';

const LoadingSpinner = ({ title, subtitle, size = "normal" }) => {
  const spinnerSize = size === "small" ? "h-6 w-6" : "h-8 w-8";
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full ${spinnerSize} border-b-2 border-blue-600`}></div>
      <p className="mt-3 text-gray-600 font-medium">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

const ResumenCard = ({ resumen, usuario }) => {
  const [enviando, setEnviando] = useState(false);

  // Validar que resumen y clase existan
  if (!resumen || !resumen.clase) {
    console.warn('ResumenCard: resumen o clase es null/undefined', resumen);
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-md">
        <p className="text-red-600">⚠️ Error: Datos de resumen incompletos</p>
      </div>
    );
  }

  const handleEnviarWhatsApp = async () => {
    try {
      setEnviando(true);
      
      // Generar y enviar mensaje usando utilidades
      const mensaje = generarMensajeResumen({
        fecha: resumen.clase?.fecha ? formatearFechaCorta(resumen.clase.fecha) : 'Fecha no disponible',
        obrasEstudiadas: resumen.obrasEstudiadas || [],
        objetivosProximaClase: resumen.objetivosProximaClase || ''
      });
      
      // Enviar con teléfono del usuario si está disponible
      if (usuario?.telefono) {
        enviarWhatsApp(mensaje, usuario.telefono);
      } else {
        enviarWhatsApp(mensaje);
      }
      
    } catch (error) {
      console.error('Error al enviar por WhatsApp:', error);
      alert('❌ Error al procesar el envío por WhatsApp');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-600 font-bold">
            📅 {resumen.clase?.fecha ? formatearFechaCorta(resumen.clase.fecha) : 'Fecha no disponible'}
          </p>
        </div>
      </div>

      {/* Obras */}
      {resumen.obrasEstudiadas && resumen.obrasEstudiadas.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2 text-left">
            🎼 Obras ({resumen.obrasEstudiadas.length})
          </h5>
          <div className="space-y-2">
            {resumen.obrasEstudiadas.map((obra, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md text-left">
                <div className="font-medium text-gray-800">
                  {obra.compositor} - {obra.obra}
                </div>
                {obra.movimientosCompases && (
                  <div className="text-sm text-blue-600 mt-1">
                    📍 {obra.movimientosCompases}
                  </div>
                )}
                {obra.comentarios && (
                  <div className="text-sm text-gray-600 mt-1">
                    💬 {obra.comentarios}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próxima Clase */}
      {resumen.objetivosProximaClase && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2 text-left">
            🎯 Próxima Clase
          </h5>
          <div className="bg-green-50 p-3 rounded-md text-left">
            <p className="text-sm text-gray-700">{resumen.objetivosProximaClase}</p>
          </div>
        </div>
      )}

      {/* Botón de WhatsApp */}
      <div className="pt-3 border-t border-gray-200">
        <button
          onClick={handleEnviarWhatsApp}
          disabled={enviando}
          className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {enviando ? 'Enviando...' : '📱 WhatsApp'}
        </button>
      </div>
    </div>
  );
};

const ClaseCard = ({ clase }) => {
  // Estados de clases con colores más definidos para el formato vertical
  const ESTADOS_CLASES = {
    no_iniciada: {
      label: 'No iniciada',
      color: 'bg-gray-50',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200',
      footerColor: 'bg-gray-100',
      icon: '⏳'
    },
    tomada: {
      label: 'Tomada',
      color: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      footerColor: 'bg-green-100',
      icon: '✅'
    },
    ausente: {
      label: 'Ausente',
      color: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      footerColor: 'bg-red-100',
      icon: '❌'
    },
    reprogramar: {
      label: 'Reprogramada',
      color: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      footerColor: 'bg-amber-100',
      icon: '🔄'
    },
    recuperada: {
      label: 'Recuperada',
      color: 'bg-purple-50',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200',
      footerColor: 'bg-purple-100',
      icon: '🔁'
    },
    realizada: {
      label: 'Realizada',
      color: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      footerColor: 'bg-green-100',
      icon: '✅'
    },
    cancelada: {
      label: 'Cancelada',
      color: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      footerColor: 'bg-red-100',
      icon: '🚫'
    },
    pendiente: {
      label: 'Pendiente',
      color: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      footerColor: 'bg-blue-100',
      icon: '⏰'
    }
  };

  const estadoActual = ESTADOS_CLASES[clase.estado] || ESTADOS_CLASES.no_iniciada;
  
  // Extraer información de fecha
  const fechaClase = new Date(clase.fecha);
  const mes = fechaClase.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
  const dia = fechaClase.getDate();

  return (
    <div className={`${estadoActual.color} ${estadoActual.borderColor} border rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow min-h-[80px] sm:min-h-[90px]`}>
      {/* Header: Mes */}
      <div className={`${estadoActual.footerColor} px-1 py-0.5 text-center border-b ${estadoActual.borderColor}`}>
        <h4 className={`text-xs font-bold ${estadoActual.textColor} tracking-wide`}>
          {mes.slice(0, 3)}
        </h4>
      </div>

      {/* Body: Día grande y comentarios */}
      <div className="px-1 py-1 text-center flex-1 flex flex-col justify-center">
        {/* Número del día grande */}
        <div className={`text-sm sm:text-base lg:text-lg font-bold ${estadoActual.textColor} mb-0.5`}>
          {dia}
        </div>

        {/* Comentarios */}
        <div className="space-y-0.5 text-xs">
          {/* Fecha de reprogramación */}
          {clase.fechaReprogramada && (
            <div className={`${estadoActual.textColor} opacity-80`}>
              <p className="text-xs">
                {new Date(clase.fechaReprogramada).getDate()}/{new Date(clase.fechaReprogramada).getMonth() + 1}
              </p>
            </div>
          )}
          
          {/* Notas adicionales - Solo mostrar si hay espacio */}
          {clase.notas && !clase.fechaReprogramada && (
            <div className={`${estadoActual.textColor} opacity-80`}>
              <p className="text-xs leading-tight italic line-clamp-1">
                "{clase.notas.slice(0, 20)}..."
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Estado */}
      <div className={`${estadoActual.footerColor} px-1 py-0.5 text-center border-t ${estadoActual.borderColor} mt-auto`}>
        <div className="flex items-center justify-center space-x-0.5">
          <span className="text-xs">{estadoActual.icon}</span>
          <span className={`text-xs font-medium ${estadoActual.textColor}`}>
            {estadoActual.label.slice(0, 8)}
          </span>
        </div>
      </div>
    </div>
  );
};

const MisClases = () => {
  const { usuario } = useAuth();
  const [resumenes, setResumenes] = useState([]);
  const [clases, setClases] = useState({
    ultimoPago: [],
    historial: []
  });
  const [loadingResumenes, setLoadingResumenes] = useState(true);
  const [loadingClases, setLoadingClases] = useState(true);

  useEffect(() => {
    if (usuario?._id) {
      cargarResumenes();
      cargarClases();
    }
  }, [usuario]);

  const cargarResumenes = async () => {
    try {
      setLoadingResumenes(true);
      const response = await resumenClaseService.obtenerPorUsuario(usuario._id);
      const resumenesValidos = (response.data.resumenes || []).filter(resumen => 
        resumen && resumen.clase && resumen.clase.fecha
      );
      // Ordenar por fecha descendente (más reciente primero)
      const resumenesOrdenados = resumenesValidos.sort((a, b) => 
        new Date(b.clase.fecha) - new Date(a.clase.fecha)
      );
      setResumenes(resumenesOrdenados);
    } catch (error) {
      console.error('Error al cargar resúmenes:', error);
      setResumenes([]);
    } finally {
      setLoadingResumenes(false);
    }
  };

  const cargarClases = async () => {
    try {
      setLoadingClases(true);
      const response = await clasesService.obtenerSeparadas(usuario._id);
      
      // Función para ordenar clases: no iniciadas primero, luego tomadas, luego por fecha
      const ordenarClases = (clasesArray) => {
        return clasesArray.sort((a, b) => {
          // Prioridad por estado: no_iniciada > tomada > otros estados
          const prioridadEstado = (estado) => {
            switch (estado) {
              case 'no_iniciada': return 1;
              case 'tomada': return 2;
              default: return 3;
            }
          };
          
          const prioridadA = prioridadEstado(a.estado);
          const prioridadB = prioridadEstado(b.estado);
          
          if (prioridadA !== prioridadB) {
            return prioridadA - prioridadB;
          }
          
          // Si tienen el mismo estado, ordenar por fecha (más reciente primero)
          return new Date(b.fecha) - new Date(a.fecha);
        });
      };

      const clasesData = response.data || { clasesUltimoPago: [], historialClases: [] };
      
      setClases({
        ultimoPago: ordenarClases(clasesData.clasesUltimoPago || []),
        historial: ordenarClases(clasesData.historialClases || [])
      });
    } catch (error) {
      console.error('Error al cargar clases:', error);
      setClases({ ultimoPago: [], historial: [] });
    } finally {
      setLoadingClases(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        Mis Clases
      </h1>

      {/* Sección de Todas las Clases */}
      <div className="mb-12">
        
        {loadingClases ? (
          <LoadingSpinner 
            title="Cargando clases..." 
            subtitle="Obteniendo tus clases programadas"
          />
        ) : (clases.ultimoPago.length > 0 || clases.historial.length > 0) ? (
          <div className="space-y-6">
            {/* Clases del último pago */}
            {clases.ultimoPago.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  Clases del último pago ({clases.ultimoPago.length})
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-1.5 sm:gap-2">
                  {clases.ultimoPago.map((clase) => (
                    <ClaseCard
                      key={clase._id}
                      clase={clase}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Historial de clases */}
            {clases.historial.length > 0 && (
              <details className="bg-white rounded-lg border border-gray-200 [&[open]>summary>span>svg]:rotate-90">
                <summary className="p-3 sm:p-6 cursor-pointer hover:bg-gray-50 rounded-t-lg list-none">
                  <span className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-4 h-4 mr-3 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Historial de clases ({clases.historial.length})
                  </span>
                </summary>
                <div className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-1.5 sm:gap-2">
                    {clases.historial.map((clase) => (
                      <ClaseCard
                        key={clase._id}
                        clase={clase}
                      />
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay clases programadas
            </h3>
            <p className="text-gray-600">
              Tus próximas clases aparecerán aquí una vez que sean programadas.
            </p>
          </div>
        )}
      </div>

      {/* Sección de Resúmenes de Clases */}
      <div className="mb-12">
        
        {loadingResumenes ? (
          <LoadingSpinner 
            title="Cargando resúmenes..." 
            subtitle="Obteniendo tus resúmenes de clase"
          />
        ) : resumenes.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              Resúmenes de clases ({resumenes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-none">
              {resumenes.map((resumen) => (
                <div key={resumen._id} className="max-w-sm">
                  <ResumenCard resumen={resumen} usuario={usuario} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay resúmenes de clases
            </h3>
            <p className="text-gray-600">
              Los resúmenes de tus clases aparecerán aquí una vez que el profesor los complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisClases;
