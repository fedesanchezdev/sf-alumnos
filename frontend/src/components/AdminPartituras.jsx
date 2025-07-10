import { useState, useEffect } from 'react';
import { partiturasService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminPartituras = () => {
  const { usuario } = useAuth();
  const [partituras, setPartituras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPartitura, setEditingPartitura] = useState(null);
  
  // Formulario state
  const [formData, setFormData] = useState({
    compositor: '',
    obra: '',
    partituraCello: '',
    partituraPiano: '',
    movimientos: []
  });

  useEffect(() => {
    cargarPartituras();
  }, []);

  const cargarPartituras = async () => {
    try {
      setLoading(true);
      const response = await partiturasService.obtenerTodas();
      setPartituras(response.data || []);
    } catch (error) {
      setError('Error al cargar partituras: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      compositor: '',
      obra: '',
      partituraCello: '',
      partituraPiano: '',
      movimientos: []
    });
    setEditingPartitura(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const iniciarEdicion = (partitura) => {
    setFormData({
      compositor: partitura.compositor || '',
      obra: partitura.obra || '',
      partituraCello: partitura.partituraCello || '',
      partituraPiano: partitura.partituraPiano || '',
      movimientos: (partitura.movimientos || []).map(mov => ({
        nombre: mov.nombre || '',
        subtitulo: mov.subtitulo || mov.descripcion || mov.duracion || '',
        audios: (mov.audios || []).map(audio => ({
          nombre: audio.nombre || '',
          url: audio.url || ''
        }))
      }))
    });
    setEditingPartitura(partitura);
    setShowForm(true);
  };

  const agregarMovimiento = () => {
    setFormData(prev => ({
      ...prev,
      movimientos: [...prev.movimientos, {
        nombre: '',
        subtitulo: '',
        audios: []
      }]
    }));
  };

  const actualizarMovimiento = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      movimientos: prev.movimientos.map((mov, i) => 
        i === index ? { ...mov, [field]: value } : mov
      )
    }));
  };

  const eliminarMovimiento = (index) => {
    setFormData(prev => ({
      ...prev,
      movimientos: prev.movimientos.filter((_, i) => i !== index)
    }));
  };

  const agregarAudio = (movimientoIndex) => {
    setFormData(prev => ({
      ...prev,
      movimientos: prev.movimientos.map((mov, i) => 
        i === movimientoIndex 
          ? { ...mov, audios: [...(mov.audios || []), { nombre: '', url: '' }] }
          : mov
      )
    }));
  };

  const actualizarAudio = (movimientoIndex, audioIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      movimientos: prev.movimientos.map((mov, i) => 
        i === movimientoIndex 
          ? {
              ...mov,
              audios: (mov.audios || []).map((audio, j) => 
                j === audioIndex ? { ...audio, [field]: value } : audio
              )
            }
          : mov
      )
    }));
  };

  const eliminarAudio = (movimientoIndex, audioIndex) => {
    setFormData(prev => ({
      ...prev,
      movimientos: prev.movimientos.map((mov, i) => 
        i === movimientoIndex 
          ? { ...mov, audios: (mov.audios || []).filter((_, j) => j !== audioIndex) }
          : mov
      )
    }));
  };

  const guardarPartitura = async (e) => {
    e.preventDefault();
    
    if (!formData.compositor.trim() || !formData.obra.trim() || !formData.partituraCello.trim()) {
      setError('Los campos Compositor, Obra y Partitura de Violoncello son obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Debug: Verificar estructura que se envía al backend
      console.log('=== DEBUG: Enviando partitura al backend ===');
      console.log('FormData completo:', formData);
      if (formData.movimientos.length > 0) {
        console.log('Primer movimiento estructura:', {
          nombre: formData.movimientos[0].nombre,
          subtitulo: formData.movimientos[0].subtitulo,
          audios: formData.movimientos[0].audios,
          cantidadAudios: formData.movimientos[0].audios?.length || 0
        });
      }
      
      if (editingPartitura) {
        await partiturasService.actualizar(editingPartitura._id, formData);
        setSuccess('Partitura actualizada exitosamente');
      } else {
        await partiturasService.crear(formData);
        setSuccess('Partitura creada exitosamente');
      }
      
      await cargarPartituras();
      limpiarFormulario();
    } catch (error) {
      setError('Error al guardar partitura: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const eliminarPartitura = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta partitura?')) {
      return;
    }

    try {
      setLoading(true);
      await partiturasService.eliminar(id);
      setSuccess('Partitura eliminada exitosamente');
      await cargarPartituras();
    } catch (error) {
      setError('Error al eliminar partitura: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showForm) {
    return (
      <LoadingSpinner 
        title="Cargando gestión de partituras..."
        subtitle="Obteniendo datos del sistema"
        showRenderMessage={true}
        size="large"
      />
    );
  }

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Partituras
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administrar partituras del sistema
          </p>
        </div>
        
        {!showForm && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:outline-none focus:ring-blue-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Partitura
            </button>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
          <span className="font-medium">Éxito:</span> {success}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingPartitura ? 'Editar Partitura' : 'Nueva Partitura'}
            </h2>
            <button
              onClick={limpiarFormulario}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={guardarPartitura} className="space-y-6">
            {/* Datos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compositor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.compositor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, compositor: e.target.value }))}
                  className="block w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Ej: Bach, J.S."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Obra *
                </label>
                <input
                  type="text"
                  required
                  value={formData.obra || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, obra: e.target.value }))}
                  className="block w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Ej: Bach for the Cello - Álbum"
                />
              </div>
            </div>

            {/* Enlaces a partituras */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enlace Partitura Violoncello *
                </label>
                <input
                  type="url"
                  required
                  value={formData.partituraCello || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, partituraCello: e.target.value }))}
                  className="block w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enlace Partitura Piano/Otros (opcional)
                </label>
                <input
                  type="url"
                  value={formData.partituraPiano || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, partituraPiano: e.target.value }))}
                  className="block w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>

            {/* Movimientos */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Movimientos
                </h3>
                <button
                  type="button"
                  onClick={agregarMovimiento}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:ring-2 focus:outline-none focus:ring-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Movimiento
                </button>
              </div>

              {formData.movimientos.map((movimiento, movIndex) => (
                <div key={movIndex} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Movimiento {movIndex + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => eliminarMovimiento(movIndex)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Movimiento
                      </label>
                      <input
                        type="text"
                        value={movimiento.nombre || ''}
                        onChange={(e) => actualizarMovimiento(movIndex, 'nombre', e.target.value)}
                        className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Ej: March in G"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subtítulo (cuenta/tempo)
                      </label>
                      <input
                        type="text"
                        value={movimiento.subtitulo || ''}
                        onChange={(e) => actualizarMovimiento(movIndex, 'subtitulo', e.target.value)}
                        className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Ej: La cuenta es de 4 negras"
                      />
                    </div>
                  </div>

                  {/* Audios del movimiento */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Audios (velocidades)
                      </label>
                      <button
                        type="button"
                        onClick={() => agregarAudio(movIndex)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 focus:ring-2 focus:outline-none focus:ring-green-300 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar Audio
                      </button>
                    </div>

                    {(movimiento.audios || []).map((audio, audioIndex) => (
                      <div key={audioIndex} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={audio.nombre || ''}
                          onChange={(e) => actualizarAudio(movIndex, audioIndex, 'nombre', e.target.value)}
                          className="w-20 p-2 text-sm text-gray-900 border border-gray-300 rounded bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          placeholder="60"
                        />
                        <input
                          type="url"
                          value={audio.url || ''}
                          onChange={(e) => actualizarAudio(movIndex, audioIndex, 'url', e.target.value)}
                          className="flex-1 p-2 text-sm text-gray-900 border border-gray-300 rounded bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          placeholder="https://app.box.com/..."
                        />
                        <button
                          type="button"
                          onClick={() => eliminarAudio(movIndex, audioIndex)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Botones del formulario */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={limpiarFormulario}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:outline-none focus:ring-blue-300 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:outline-none focus:ring-blue-300 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : (editingPartitura ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de partituras existentes */}
      {!showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Partituras Existentes ({partituras.length})
            </h2>
          </div>

          {partituras.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay partituras
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Comienza creando tu primera partitura.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {partituras.map((partitura) => (
                <div key={partitura._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    {/* Datos alineados a la izquierda */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {partitura.compositor}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {partitura.obra}
                      </p>
                      <div className="text-sm text-gray-500 dark:text-gray-400 space-x-4">
                        <span>Movimientos: {partitura.movimientos?.length || 0}</span>
                        <span>Total audios: {partitura.movimientos?.reduce((acc, mov) => acc + (mov.audios?.length || 0), 0) || 0}</span>
                      </div>
                    </div>
                    
                    {/* Botones alineados a la derecha en una sola línea */}
                    <div className="flex items-center space-x-3 ml-6">
                      <button
                        onClick={() => iniciarEdicion(partitura)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:ring-2 focus:outline-none focus:ring-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      
                      <button
                        onClick={() => eliminarPartitura(partitura._id)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:ring-2 focus:outline-none focus:ring-red-300 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPartituras;
