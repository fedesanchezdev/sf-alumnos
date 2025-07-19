import { useState } from 'react';
import { formatearFechaCorta } from '../utils/fechas';
import { resumenClaseService } from '../services/api';
import { enviarWhatsApp, generarMensajeResumen } from '../utils/whatsapp';
import { logger } from '../utils/logger';

const ResumenClaseCard = ({ resumen, onEdit, onDelete }) => {
  const [enviando, setEnviando] = useState(false);

  // Validar que resumen y clase existan
  if (!resumen || !resumen.clase) {
    logger.warn('ResumenClaseCard: resumen o clase es null/undefined', resumen);
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
      
      // Enviar con teléfono del usuario del resumen si está disponible
      if (resumen.usuario?.telefono) {
        enviarWhatsApp(mensaje, resumen.usuario.telefono);
      } else {
        enviarWhatsApp(mensaje);
      }
      
    } catch (error) {
      logger.error('Error al enviar por WhatsApp:', error);
      alert('❌ Error al procesar el envío por WhatsApp');
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este resumen?')) {
      try {
        await resumenClaseService.eliminar(resumen._id);
        onDelete(resumen._id);
        alert('✅ Resumen eliminado exitosamente');
      } catch (error) {
        logger.error('Error al eliminar resumen:', error);
        alert('❌ Error al eliminar el resumen');
      }
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
        <button
          onClick={handleEliminar}
          className="text-red-500 hover:text-red-700 text-sm"
          title="Eliminar resumen"
        >
          🗑️
        </button>
      </div>

      {/* Obras */}
      {resumen.obrasEstudiadas && resumen.obrasEstudiadas.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2 text-left">
            🎼 Obras ({resumen.obrasEstudiadas.length})
          </h5>
          <div className="space-y-2">
            {(() => {
              // Agrupar obras por compositor y título
              const obrasAgrupadas = resumen.obrasEstudiadas.reduce((grupos, obra, index) => {
                const clave = `${obra.compositor}-${obra.obra}`;
                if (!grupos[clave]) {
                  grupos[clave] = {
                    compositor: obra.compositor,
                    obra: obra.obra,
                    movimientos: []
                  };
                }
                grupos[clave].movimientos.push(obra);
                return grupos;
              }, {});

              return Object.values(obrasAgrupadas).map((grupo, grupoIndex) => (
                <div key={grupoIndex} className="bg-gray-50 p-3 rounded-md text-left">
                  {/* Compositor y obra una sola vez */}
                  <div className="font-medium text-gray-800 mb-2">
                    {grupo.compositor} - {grupo.obra}
                    {grupo.movimientos.length > 1 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        {grupo.movimientos.length} partes
                      </span>
                    )}
                  </div>
                  
                  {/* Movimientos del grupo */}
                  <div className="space-y-1">
                    {grupo.movimientos.map((movimiento, movIndex) => (
                      <div key={movIndex} className="text-sm">
                        {movimiento.movimientosCompases && (
                          <div className="text-blue-600">
                            📍 {movimiento.movimientosCompases}
                          </div>
                        )}
                        {movimiento.comentarios && (
                          <div className="text-gray-600 mt-1">
                            💬 {movimiento.comentarios}
                          </div>
                        )}
                        {/* Separador entre movimientos si hay más de uno */}
                        {grupo.movimientos.length > 1 && movIndex < grupo.movimientos.length - 1 && (
                          <div className="border-b border-gray-200 my-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
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

      {/* Botones de acción */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={() => onEdit(resumen)}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ✏️ Editar
        </button>
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

export default ResumenClaseCard;
