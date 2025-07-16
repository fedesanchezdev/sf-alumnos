import React, { useState, useEffect } from 'react';
import { usuariosService, clasesService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import FormularioUsuario from './FormularioUsuario';
import LoadingSpinner from './LoadingSpinner';

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteComplete, setConfirmDeleteComplete] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  
  const { isAdmin } = useAuth();

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await usuariosService.obtenerTodos();
      setUsuarios(response.data);
    } catch (error) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoUsuario = () => {
    setUsuarioEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setMostrarFormulario(true);
  };

  const handleEliminarUsuario = async (id) => {
    try {
      await usuariosService.eliminar(id);
      setUsuarios(usuarios.filter(u => u._id !== id));
      setConfirmDelete(null);
    } catch (error) {
      setError('Error al eliminar usuario');
    }
  };

  const handleCambiarEstadoUsuario = async (id, nuevoEstado) => {
    try {
      setLoadingActions(prev => ({ ...prev, [id]: true }));
      await usuariosService.cambiarEstado(id, nuevoEstado);
      setUsuarios(usuarios.map(u => 
        u._id === id ? { ...u, activo: nuevoEstado } : u
      ));
    } catch (error) {
      setError(`Error al ${nuevoEstado ? 'reactivar' : 'pausar'} usuario`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleEliminarUsuarioCompleto = async (id) => {
    try {
      setLoadingActions(prev => ({ ...prev, [id]: true }));
      const response = await usuariosService.eliminarCompleto(id);
      setUsuarios(usuarios.filter(u => u._id !== id));
      setConfirmDeleteComplete(null);
      
      // Mostrar estadísticas de eliminación
      if (response.data.estadisticas) {
        const stats = response.data.estadisticas;
        alert(`Usuario "${stats.usuario}" eliminado completamente.\n` +
              `Clases eliminadas: ${stats.clasesEliminadas}\n` +
              `Pagos eliminados: ${stats.pagosEliminados}`);
      }
    } catch (error) {
      setError('Error al eliminar usuario completo');
    } finally {
      setLoadingActions(prev => ({ ...prev, [id]: false }));
      setConfirmDeleteComplete(null);
    }
  };

  const handleFormularioSubmit = () => {
    setMostrarFormulario(false);
    setUsuarioEditando(null);
    cargarUsuarios();
  };

  const handleFormularioCancel = () => {
    setMostrarFormulario(false);
    setUsuarioEditando(null);
  };

  if (loading) {
    return (
      <LoadingSpinner 
        title="Cargando usuarios..."
        subtitle="Obteniendo la lista de usuarios del sistema"
        showRenderMessage={true}
        size="medium"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        {isAdmin() && (
          <button
            onClick={handleNuevoUsuario}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            Nuevo Usuario
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {usuarios.map((usuario) => (
            <li key={usuario._id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {usuario.nombre?.charAt(0)}{usuario.apellido?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {usuario.nombre} {usuario.apellido}
                      {usuario.activo === false && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Pausado
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {usuario.email}
                      {usuario.telefono && (
                        <span className="ml-3 text-green-600">
                          📱 {usuario.telefono}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.rol === 'administrador' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {usuario.rol}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/clases?usuario=${usuario._id}`}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Ver Clases
                  </Link>
                  {isAdmin() && (
                    <>
                      <button
                        onClick={() => handleEditarUsuario(usuario)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Editar
                      </button>
                      
                      {usuario.rol !== 'administrador' && (
                        <>
                          <button
                            onClick={() => handleCambiarEstadoUsuario(usuario._id, !usuario.activo)}
                            disabled={loadingActions[usuario._id]}
                            className={`text-sm font-medium ${
                              usuario.activo 
                                ? 'text-orange-600 hover:text-orange-900' 
                                : 'text-green-600 hover:text-green-900'
                            } ${loadingActions[usuario._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {loadingActions[usuario._id] 
                              ? 'Procesando...' 
                              : (usuario.activo ? 'Pausar' : 'Reactivar')
                            }
                          </button>
                          
                          <button
                            onClick={() => setConfirmDelete(usuario._id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                          
                          <button
                            onClick={() => setConfirmDeleteComplete(usuario._id)}
                            className="text-red-800 hover:text-red-900 text-sm font-bold"
                          >
                            Eliminar Todo
                          </button>
                        </>
                      )}
                      
                      {usuario.rol === 'administrador' && (
                        <button
                          onClick={() => setConfirmDelete(usuario._id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {usuarios.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay usuarios registrados</p>
        </div>
      )}

      {mostrarFormulario && (
        <FormularioUsuario
          usuario={usuarioEditando}
          onSubmit={handleFormularioSubmit}
          onCancel={handleFormularioCancel}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Eliminación
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-center space-x-2 pt-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEliminarUsuario(confirmDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteComplete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                ⚠️ Eliminación Completa
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-3">
                  <strong>¡ATENCIÓN!</strong> Esta acción eliminará:
                </p>
                <ul className="text-sm text-red-600 text-left list-disc list-inside space-y-1">
                  <li>El usuario completamente</li>
                  <li>Todos sus pagos</li>
                  <li>Todas sus clases</li>
                </ul>
                <p className="text-sm text-gray-500 mt-3">
                  <strong>Esta acción NO se puede deshacer.</strong>
                </p>
              </div>
              <div className="flex justify-center space-x-2 pt-4">
                <button
                  onClick={() => setConfirmDeleteComplete(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEliminarUsuarioCompleto(confirmDeleteComplete)}
                  disabled={loadingActions[confirmDeleteComplete]}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingActions[confirmDeleteComplete] ? 'Eliminando...' : 'Eliminar Todo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaUsuarios;
