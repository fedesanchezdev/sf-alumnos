import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resumenClaseService, clasesService } from '../services/api';
import { formatearFecha, formatearFechaCorta } from '../utils/fechas';
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

const ResumenCard = ({ resumen }) => {
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
      
      enviarWhatsApp(mensaje);
      
    } catch (error) {
      console.error('Error al enviar por WhatsApp:', error);
      alert('❌ Error al procesar el envío por WhatsApp');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
      {/* Header - igual que admin */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            📚 Resumen de Clase
          </h4>
          <p className="text-sm text-gray-600">
            📅 {resumen.clase?.fecha ? formatearFechaCorta(resumen.clase.fecha) : 'Fecha no disponible'}
          </p>
        </div>
        {/* Sin botón eliminar para usuarios normales */}
      </div>

      {/* Obras Estudiadas - igual que admin */}
      {resumen.obrasEstudiadas && resumen.obrasEstudiadas.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            🎼 Obras Estudiadas ({resumen.obrasEstudiadas.length})
          </h5>
          <div className="space-y-2">
            {resumen.obrasEstudiadas.map((obra, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md">
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

      {/* Próxima Clase - igual que admin */}
      {resumen.objetivosProximaClase && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            🎯 Próxima Clase
          </h5>
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-gray-700">{resumen.objetivosProximaClase}</p>
          </div>
        </div>
      )}

      {/* Botón de acción - SOLO WhatsApp para usuarios normales */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={handleEnviarWhatsApp}
          disabled={enviando}
          className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {enviando ? 'Enviando...' : '📱 WhatsApp'}
        </button>
      </div>
    </div>
  );
};

const ClaseCard = ({ clase }) => {
  // Estados de clases - exactamente igual que la vista de admin
  const ESTADOS_CLASES = {
    no_iniciada: {
      label: 'No iniciada',
      color: 'bg-gray-400',
      textColor: 'text-white',
      icon: '⚪'
    },
    tomada: {
      label: 'Tomada',
      color: 'bg-green-500',
      textColor: 'text-white',
      icon: '🟢'
    },
    ausente: {
      label: 'Ausente',
      color: 'bg-red-500',
      textColor: 'text-white',
      icon: '🔴'
    },
    reprogramar: {
      label: 'Reprogramar',
      color: 'bg-amber-500',
      textColor: 'text-white',
      icon: '🟡'
    },
    recuperada: {
      label: 'Recuperada',
      color: 'bg-purple-500',
      textColor: 'text-white',
      icon: '🟣'
    },
    // Agregamos los estados adicionales que pueden aparecer
    realizada: {
      label: 'Realizada',
      color: 'bg-green-500',
      textColor: 'text-white',
      icon: '✅'
    },
    cancelada: {
      label: 'Cancelada',
      color: 'bg-red-500',
      textColor: 'text-white',
      icon: '❌'
    },
    pendiente: {
      label: 'Pendiente',
      color: 'bg-blue-500',
      textColor: 'text-white',
      icon: '⏰'
    }
  };

  const estadoActual = ESTADOS_CLASES[clase.estado] || ESTADOS_CLASES.no_iniciada;

  return (
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
        
        {clase.notas && (
          <p className="mt-2 text-xs bg-white bg-opacity-20 rounded px-2 py-1">
            📝 {clase.notas}
          </p>
        )}

        {/* Información adicional */}
        {clase.duracion && (
          <p className="mt-2 text-xs bg-white bg-opacity-20 rounded px-2 py-1">
            ⏱️ Duración: {clase.duracion} min
          </p>
        )}
      </div>

      {/* Para usuarios normales NO hay botones de acción, solo lectura */}
    </div>
  );
};

const MisClases = () => {
  const { usuario } = useAuth();
  const [resumenes, setResumenes] = useState([]);
  const [clases, setClases] = useState([]);
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
      setResumenes(resumenesValidos);
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
      const response = await clasesService.obtenerPorUsuario(usuario._id);
      // Mostrar todas las clases del usuario ordenadas por fecha descendente
      const todasLasClases = (response.data || [])
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setClases(todasLasClases);
    } catch (error) {
      console.error('Error al cargar clases:', error);
      setClases([]);
    } finally {
      setLoadingClases(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Mis Clases
      </h1>

      {/* Sección de Resúmenes de Clases */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">📚 Resúmenes de Clases</h2>
        
        {loadingResumenes ? (
          <LoadingSpinner 
            title="Cargando resúmenes..." 
            subtitle="Obteniendo tus resúmenes de clase"
          />
        ) : resumenes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumenes.map((resumen) => (
              <ResumenCard key={resumen._id} resumen={resumen} />
            ))}
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

      {/* Sección de Todas las Clases */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">📖 Mis Clases</h2>
        
        {loadingClases ? (
          <LoadingSpinner 
            title="Cargando clases..." 
            subtitle="Obteniendo tu historial de clases"
          />
        ) : clases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clases.map((clase) => (
              <ClaseCard key={clase._id} clase={clase} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay clases registradas
            </h3>
            <p className="text-gray-600">
              Tus clases programadas y su historial aparecerán aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisClases;
