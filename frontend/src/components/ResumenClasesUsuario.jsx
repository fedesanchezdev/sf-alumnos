import { useState, useEffect } from 'react';
import { resumenClaseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';

const ResumenClasesUsuario = () => {
  const { usuario } = useAuth();
  const [resumenes, setResumenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    if (usuario?._id) {
      cargarResumenes();
    }
  }, [usuario]);

  const cargarResumenes = async () => {
    try {
      setLoading(true);
      const response = await resumenClaseService.obtenerPorUsuario(usuario._id);
      // El backend devuelve { resumenes, total, pagina, totalPaginas }
      setResumenes(response.data?.resumenes || []);
    } catch (error) {
      logger.error('Error al cargar resúmenes:', error);
      setError('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const resumenesFiltrados = resumenes.filter(resumen => {
    const fechaCoincide = !filtroFecha || 
      new Date(resumen.clase?.fecha).toISOString().split('T')[0] >= filtroFecha;
    const estadoCoincide = !filtroEstado || resumen.clase?.estado === filtroEstado;
    return fechaCoincide && estadoCoincide;
  });

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      'completada': 'bg-green-100 text-green-800 border-green-200',
      'reprogramada': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelada': 'bg-red-100 text-red-800 border-red-200'
    };
    
    const textos = {
      'completada': 'Completada',
      'reprogramada': 'Reprogramada', 
      'cancelada': 'Cancelada'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${estilos[estado] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {textos[estado] || estado}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mis clases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mis Clases
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualiza el estado y resumen de tus clases
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desde fecha
          </label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos los estados</option>
            <option value="completada">Completada</option>
            <option value="reprogramada">Reprogramada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-2xl font-bold">
            {resumenes.length}
          </div>
          <div className="text-blue-800 text-sm font-medium">Total de clases</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-2xl font-bold">
            {resumenes.filter(r => r.clase?.estado === 'completada').length}
          </div>
          <div className="text-green-800 text-sm font-medium">Completadas</div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-600 text-2xl font-bold">
            {resumenes.filter(r => r.clase?.estado === 'reprogramada').length}
          </div>
          <div className="text-yellow-800 text-sm font-medium">Reprogramadas</div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 text-2xl font-bold">
            {resumenes.filter(r => r.clase?.estado === 'cancelada').length}
          </div>
          <div className="text-red-800 text-sm font-medium">Canceladas</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Lista de clases */}
      {resumenesFiltrados.length > 0 ? (
        <div className="space-y-6">
          {resumenesFiltrados.map((resumen) => (
            <div key={resumen._id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              {/* Header de la clase */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Clase del {formatearFecha(resumen.clase?.fecha)}
                  </h3>
                  {resumen.clase?.notas && (
                    <p className="text-sm text-gray-600">
                      Notas: {resumen.clase.notas}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {getEstadoBadge(resumen.clase?.estado)}
                </div>
              </div>

              {/* Contenido del resumen */}
              <div className="space-y-4">
                {/* Obras estudiadas */}
                {resumen.obrasEstudiadas && resumen.obrasEstudiadas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Obras estudiadas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {resumen.obrasEstudiadas.map((obra, index) => (
                        <span 
                          key={index}
                          className="inline-flex px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded"
                        >
                          {obra.partitura?.compositor} - {obra.partitura?.obra}
                          {obra.comentarios && ` (${obra.comentarios})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comentarios generales */}
                {resumen.comentariosGenerales && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Comentarios de la clase:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                      {resumen.comentariosGenerales}
                    </p>
                  </div>
                )}

                {/* Objetivos próxima clase */}
                {resumen.objetivosProximaClase && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Objetivos para la próxima clase:</h4>
                    <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                      {resumen.objetivosProximaClase}
                    </p>
                  </div>
                )}

                {/* Fecha de creación del resumen */}
                <div className="text-xs text-gray-500 mt-4">
                  📅 Resumen creado: {formatearFecha(resumen.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron clases
          </h3>
          <p className="text-gray-500">
            {filtroFecha || filtroEstado ? 
              'Intenta ajustar los filtros de búsqueda.' : 
              'Aún no tienes clases registradas.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ResumenClasesUsuario;
