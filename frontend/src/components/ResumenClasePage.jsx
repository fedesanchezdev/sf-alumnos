import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResumenClase from './ResumenClase';
import { logger } from '../utils/logger';
import { formatearFechaCorta } from '../utils/fechas';

const ResumenClasePage = () => {
  const { claseId } = useParams();
  const [searchParams] = useSearchParams();
  const { usuario, isAdmin } = useAuth();
  
  const usuarioId = searchParams.get('usuarioId');
  const fecha = searchParams.get('fecha');
  const isNewTab = searchParams.get('newTab') === 'true';

  logger.debug('ResumenClasePage - Parámetros recibidos', {
    claseId,
    usuarioId,
    fecha,
    isNewTab,
    usuario,
    url: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search
  });
  logger.dev('Componente ResumenClasePage renderizándose correctamente');

  const [saved, setSaved] = useState(false);

  // Agregar efecto para debugging
  useEffect(() => {
    logger.dev('ResumenClasePage useEffect - verificando parámetros');
    logger.dev('Todos los parámetros necesarios presentes:', !!claseId && !!usuarioId);
    if (!claseId) logger.error('claseId faltante');
    if (!usuarioId) logger.error('usuarioId faltante');
    if (!usuario) logger.error('usuario no autenticado');
  }, [claseId, usuarioId, usuario]);

  // Verificar que el usuario sea admin
  logger.debug('ResumenClasePage - Verificación de permisos', {
    usuario,
    rol: usuario?.rol,
    isAdmin: isAdmin()
  });

  if (!usuario) {
    logger.dev('ResumenClasePage - Usuario no cargado aún');
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-blue-600 mb-2">Cargando...</h2>
          <p className="text-gray-600">Verificando autenticación...</p>
          <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!isAdmin()) {
    logger.warn('ResumenClasePage - Usuario no autorizado. Rol actual:', usuario.rol);
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
          <p className="text-sm text-gray-500 mt-2">Rol actual: {usuario.rol}</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    setSaved(true);
    
    // Notificar a otras pestañas que se guardó un resumen
    const event = {
      type: 'resumen_guardado',
      claseId: claseId,
      usuarioId: usuarioId,
      timestamp: Date.now()
    };
    
    // Usar localStorage para comunicación entre pestañas
    localStorage.setItem('resumen_update_event', JSON.stringify(event));
    
    // Limpiar el evento después de un momento
    setTimeout(() => {
      localStorage.removeItem('resumen_update_event');
    }, 1000);
    
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header fijo */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📝 Resumen de Clase
            </h1>
            {fecha && (
              <p className="text-sm text-gray-600 mt-1">
                📅 {formatearFechaCorta(fecha)}
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            {saved && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-md text-sm">
                ✅ Guardado correctamente
              </div>
            )}
            
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <ResumenClase
            claseId={claseId}
            usuarioId={usuarioId}
            fecha={fecha}
            onClose={handleClose}
            onSave={handleSave}
            isStandalone={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ResumenClasePage;
