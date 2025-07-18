import React, { useState, useEffect } from 'react';
import { Book, Calendar, CheckCircle, Clock, Trophy } from 'lucide-react';
import estudioService from '../services/estudioService';
import { formatearFechaCorta } from '../utils/fechas';

const MisEstudios = () => {
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    cargarEstudios();
  }, [filtroEstado]);

  const cargarEstudios = async () => {
    try {
      setLoading(true);
      const filtros = {};
      
      if (filtroEstado !== 'todos') {
        filtros.estado = filtroEstado;
      }
      
      const data = await estudioService.obtenerEstudios(filtros);
      setEstudios(data.estudios || []);
    } catch (error) {
      console.error('Error al cargar estudios:', error);
      setError('Error al cargar los estudios');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800';
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      case 'pausado':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'en_progreso':
        return <Clock className="w-4 h-4" />;
      case 'finalizado':
        return <CheckCircle className="w-4 h-4" />;
      case 'pausado':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Book className="w-4 h-4" />;
    }
  };

  const formatearFecha = (fecha) => {
    return formatearFechaCorta(fecha);
  };

  const getProgresoColor = (porcentaje) => {
    if (porcentaje >= 80) return 'bg-green-500';
    if (porcentaje >= 60) return 'bg-blue-500';
    if (porcentaje >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Book className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Mis Estudios</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los estudios</option>
            <option value="en_progreso">En progreso</option>
            <option value="finalizado">Finalizados</option>
            <option value="pausado">Pausados</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {estudios.length === 0 ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes estudios asignados
          </h3>
          <p className="text-gray-500">
            Tu profesor te asignará obras musicales para estudiar.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {estudios.map((estudio) => (
            <div
              key={estudio._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {estudio.obra}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {estudio.compositor}
                    </p>
                  </div>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(estudio.estado)}`}>
                    {getEstadoIcon(estudio.estado)}
                    <span className="capitalize">
                      {estudio.estado.replace('_', ' ')}
                    </span>
                  </span>
                </div>

                {/* Progreso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progreso
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {estudio.porcentajeProgreso}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgresoColor(estudio.porcentajeProgreso)}`}
                      style={{ width: `${estudio.porcentajeProgreso}%` }}
                    ></div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Inicio:</span>
                    <span className="text-gray-900 font-medium">
                      {formatearFecha(estudio.fechaInicio)}
                    </span>
                  </div>
                  
                  {estudio.fechaFinalizacionSugerida && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Meta:</span>
                      <span className="text-gray-900 font-medium">
                        {formatearFecha(estudio.fechaFinalizacionSugerida)}
                      </span>
                    </div>
                  )}
                  
                  {estudio.fechaFinalizada && (
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Finalizado:</span>
                      <span className="text-green-600 font-medium">
                        {formatearFecha(estudio.fechaFinalizada)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Partitura */}
                {estudio.partitura && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Partitura:</span> {estudio.partitura.titulo}
                    </p>
                  </div>
                )}

                {/* Notas */}
                {estudio.notas && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notas:</span> {estudio.notas}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      {estudios.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {estudios.filter(e => e.estado === 'en_progreso').length}
            </div>
            <div className="text-sm text-blue-800">En progreso</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {estudios.filter(e => e.estado === 'finalizado').length}
            </div>
            <div className="text-sm text-green-800">Finalizados</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {estudios.length > 0 ? Math.round(estudios.reduce((acc, e) => acc + e.porcentajeProgreso, 0) / estudios.length) : 0}%
            </div>
            <div className="text-sm text-purple-800">Progreso promedio</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisEstudios;
