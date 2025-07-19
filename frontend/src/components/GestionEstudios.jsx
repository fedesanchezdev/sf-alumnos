import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Book, User, Calendar, CheckCircle, Search } from 'lucide-react';
import estudioService from '../services/estudioService';
import { usuariosService } from '../services/api';
import partituraService from '../services/partituraService';
import { formatearFechaCorta } from '../utils/fechas';
import ModalEstudio from './ModalEstudio';

const GestionEstudios = () => {
  const [estudios, setEstudios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [partituras, setPartituras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [estudioEditando, setEstudioEditando] = useState(null);
  const [filtros, setFiltros] = useState({
    usuarioId: '',
    estado: '',
    busqueda: ''
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarEstudios();
  }, [filtros]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [estudiosData, usuariosData, partiturasData] = await Promise.all([
        estudioService.obtenerEstudios(),
        usuariosService.obtenerTodos(),
        partituraService.obtenerPartituras()
      ]);

      setEstudios(estudiosData.estudios || []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData.data || []);
      setPartituras(partiturasData.partituras || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstudios = async () => {
    try {
      const filtrosLimpios = {};
      if (filtros.usuarioId) filtrosLimpios.usuarioId = filtros.usuarioId;
      if (filtros.estado) filtrosLimpios.estado = filtros.estado;
      
      const data = await estudioService.obtenerEstudios(filtrosLimpios);
      let estudiosFiltrados = data.estudios || [];
      
      // Filtro de búsqueda local
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        estudiosFiltrados = estudiosFiltrados.filter(estudio =>
          estudio.compositor.toLowerCase().includes(busqueda) ||
          estudio.obra.toLowerCase().includes(busqueda) ||
          (estudio.usuario?.nombre?.toLowerCase().includes(busqueda))
        );
      }
      
      setEstudios(estudiosFiltrados);
    } catch (error) {
      console.error('Error al cargar estudios:', error);
      setError('Error al cargar los estudios');
    }
  };

  const abrirModal = (estudio = null) => {
    setEstudioEditando(estudio);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEstudioEditando(null);
    setError('');
  };

  const manejarGuardado = () => {
    cargarEstudios();
  };

  const eliminarEstudio = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este estudio?')) {
      return;
    }

    try {
      await estudioService.eliminarEstudio(id);
      await cargarEstudios();
    } catch (error) {
      console.error('Error al eliminar estudio:', error);
      setError('Error al eliminar el estudio');
    }
  };

  const finalizarEstudio = async (id) => {
    try {
      await estudioService.finalizarEstudio(id);
      await cargarEstudios();
    } catch (error) {
      console.error('Error al finalizar estudio:', error);
      setError('Error al finalizar el estudio');
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

  // Usar la utilidad de fechas corregida para evitar problemas de zona horaria
  const formatearFecha = (fecha) => {
    return formatearFechaCorta(fecha);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Book className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Estudios</h1>
        </div>
        
        <button
          onClick={() => abrirModal()}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Estudio</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                placeholder="Compositor, obra o estudiante..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estudiante
            </label>
            <select
              value={filtros.usuarioId}
              onChange={(e) => setFiltros({...filtros, usuarioId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estudiantes</option>
              {usuarios
                .filter(user => user.rol === 'usuario')
                .map(user => (
                  <option key={user._id} value={user._id}>
                    {user.nombre} {user.apellido}
                  </option>
                ))
              }
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="en_progreso">En progreso</option>
              <option value="finalizado">Finalizado</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFiltros({ usuarioId: '', estado: '', busqueda: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Lista de estudios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {estudios.length === 0 ? (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay estudios
            </h3>
            <p className="text-gray-500">
              Comienza creando el primer estudio para tus estudiantes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Obra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estudios.map((estudio) => (
                  <tr key={estudio._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {estudio.usuario?.nombre} {estudio.usuario?.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            {estudio.usuario?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {estudio.obra}
                        </div>
                        <div className="text-sm text-gray-500">
                          {estudio.compositor}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${estudio.porcentajeProgreso}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {estudio.porcentajeProgreso}%
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(estudio.estado)}`}>
                        {estudio.estado.replace('_', ' ')}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>Inicio: {formatearFecha(estudio.fechaInicio)}</div>
                        {estudio.fechaFinalizacionSugerida && (
                          <div>Meta: {formatearFecha(estudio.fechaFinalizacionSugerida)}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {estudio.estado === 'en_progreso' && (
                        <button
                          onClick={() => finalizarEstudio(estudio._id)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Finalizar estudio"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => abrirModal(estudio)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Editar estudio"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => eliminarEstudio(estudio._id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Eliminar estudio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalEstudio 
        mostrar={mostrarModal}
        onCerrar={cerrarModal}
        onGuardado={manejarGuardado}
        estudioEditando={estudioEditando}
      />
    </div>
  );
};

export default GestionEstudios;
