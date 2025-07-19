import { useState, useEffect } from 'react';
import { pagosService, usuariosService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const formatearFecha = (fecha) => {
  const fechaObj = new Date(fecha);
  fechaObj.setMinutes(fechaObj.getMinutes() + fechaObj.getTimezoneOffset());
  
  return fechaObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const GestionPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [tipoCreacion, setTipoCreacion] = useState('periodo'); // 'periodo' o 'individual'
  const [fechasIndividuales, setFechasIndividuales] = useState(['']);
  
  const [formData, setFormData] = useState({
    usuarioId: '',
    monto: '',
    fechaInicio: '',
    fechaFin: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [pagosResponse, usuariosResponse] = await Promise.all([
        pagosService.obtenerTodos(),
        usuariosService.obtenerTodos()
      ]);
      
      setPagos(pagosResponse.data);
      setUsuarios(usuariosResponse.data);
    } catch (error) {
      setError('Error al cargar los datos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const pagoData = {
        ...formData
      };

      // Si es creación por clases individuales, agregar las fechas
      if (tipoCreacion === 'individual') {
        const fechasValidas = fechasIndividuales.filter(fecha => fecha.trim() !== '');
        if (fechasValidas.length === 0) {
          alert('Debe agregar al menos una fecha de clase');
          return;
        }
        pagoData.fechasClases = fechasValidas;
        // Para clases individuales, no necesitamos fechaInicio/fechaFin
        delete pagoData.fechaInicio;
        delete pagoData.fechaFin;
      }

      if (editingPago) {
        await pagosService.actualizar(editingPago._id, pagoData);
      } else {
        await pagosService.crear(pagoData);
      }
      
      await cargarDatos();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar pago:', error);
      alert('Error al guardar el pago');
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      try {
        await pagosService.eliminar(id);
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar pago:', error);
        alert('Error al eliminar el pago');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      usuarioId: '',
      monto: '',
      fechaInicio: '',
      fechaFin: '',
      descripcion: ''
    });
    setEditingPago(null);
    setTipoCreacion('periodo');
    setFechasIndividuales(['']);
  };

  const handleEdit = (pago) => {
    setEditingPago(pago);
    setFormData({
      usuarioId: pago.usuario._id,
      monto: pago.monto,
      fechaInicio: pago.fechaInicio.split('T')[0],
      fechaFin: pago.fechaFin.split('T')[0],
      descripcion: pago.descripcion || ''
    });
    setShowModal(true);
  };

  const calcularDuracion = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin - inicio;
    const semanas = Math.ceil(diferencia / (1000 * 60 * 60 * 24 * 7));
    return semanas;
  };

  const agregarFechaIndividual = () => {
    setFechasIndividuales([...fechasIndividuales, '']);
  };

  const eliminarFechaIndividual = (index) => {
    const nuevasFechas = fechasIndividuales.filter((_, i) => i !== index);
    setFechasIndividuales(nuevasFechas.length > 0 ? nuevasFechas : ['']);
  };

  const actualizarFechaIndividual = (index, fecha) => {
    const nuevasFechas = [...fechasIndividuales];
    nuevasFechas[index] = fecha;
    setFechasIndividuales(nuevasFechas);
  };

  if (loading) {
    return (
      <LoadingSpinner 
        title="Cargando pagos..."
        subtitle="Obteniendo información de pagos del sistema"
        showRenderMessage={true}
        size="medium"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          💰 Gestión de Pagos
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          ➕ Nuevo Pago
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Lista de pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pagos.map((pago) => (
          <div key={pago._id} className="bg-white rounded-lg shadow-md border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {pago.usuario.nombre} {pago.usuario.apellido}
                </h3>
                <p className="text-sm text-gray-600">{pago.usuario.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(pago)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleEliminar(pago._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Monto:</span>
                <span className="font-bold text-green-600">
                  ${pago.monto.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Período:</span>
                <span className="text-sm">
                  {formatearFecha(pago.fechaInicio)} - {formatearFecha(pago.fechaFin)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Duración:</span>
                <span className="text-sm">
                  ~{calcularDuracion(pago.fechaInicio, pago.fechaFin)} semanas
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de pago:</span>
                <span className="text-sm">
                  {formatearFecha(pago.fechaPago)}
                </span>
              </div>

              {pago.descripcion && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">{pago.descripcion}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {pagos.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No hay pagos registrados</p>
          <p className="text-gray-500 text-sm mt-2">
            Crea el primer pago para comenzar a gestionar las clases
          </p>
        </div>
      )}

      {/* Modal para crear/editar pago */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {editingPago ? 'Editar Pago' : 'Nuevo Pago'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <select
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({...formData, usuarioId: e.target.value})}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario._id} value={usuario._id}>
                      {usuario.nombre} {usuario.apellido} ({usuario.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto ($)
                </label>
                <input
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
                  required
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="56200"
                />
              </div>

              {!editingPago && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de programación de clases
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="periodo"
                        checked={tipoCreacion === 'periodo'}
                        onChange={(e) => setTipoCreacion(e.target.value)}
                        className="mr-2"
                      />
                      Por período (semanal)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="individual"
                        checked={tipoCreacion === 'individual'}
                        onChange={(e) => setTipoCreacion(e.target.value)}
                        className="mr-2"
                      />
                      Clases individuales
                    </label>
                  </div>
                </div>
              )}

              {tipoCreacion === 'periodo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de inicio
                    </label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                      required={tipoCreacion === 'periodo'}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de fin
                    </label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                      required={tipoCreacion === 'periodo'}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}

              {tipoCreacion === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fechas de clases
                  </label>
                  {fechasIndividuales.map((fecha, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => actualizarFechaIndividual(index, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                        required
                      />
                      {fechasIndividuales.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarFechaIndividual(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={agregarFechaIndividual}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-400 hover:text-blue-600"
                  >
                    ➕ Agregar otra fecha
                  </button>
                </div>
              )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Descripción del pago..."
                />
              </div>

              {/* Fechas individuales */}
              {tipoCreacion === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fechas de clases individuales
                  </label>
                  <div className="space-y-2">
                    {fechasIndividuales.map((fecha, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="date"
                          value={fecha}
                          onChange={(e) => actualizarFechaIndividual(index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarFechaIndividual(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={agregarFechaIndividual}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Agregar otra fecha
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingPago ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPagos;
