import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import estudioService from '../services/estudioService';
import { usuariosService } from '../services/api';

const ModalEstudio = ({ 
  mostrar, 
  onCerrar, 
  onGuardado, 
  estudioEditando = null, 
  usuarioPreseleccionado = null 
}) => {
  const [formData, setFormData] = useState({
    usuario: '',
    compositor: '',
    obra: '',
    fechaInicio: '',
    fechaFinalizada: '',
    porcentajeProgreso: 0,
    estado: 'en_progreso',
    notas: ''
  });

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mostrar) {
      cargarDatos();
    }
  }, [mostrar]);

  useEffect(() => {
    if (usuarioPreseleccionado) {
      setFormData(prev => ({ ...prev, usuario: usuarioPreseleccionado }));
    }
  }, [usuarioPreseleccionado]);

  useEffect(() => {
    if (estudioEditando) {
      setFormData({
        usuario: estudioEditando.usuario._id,
        compositor: estudioEditando.compositor,
        obra: estudioEditando.obra,
        fechaInicio: estudioEditando.fechaInicio ? estudioEditando.fechaInicio.split('T')[0] : '',
        fechaFinalizada: estudioEditando.fechaFinalizada ? estudioEditando.fechaFinalizada.split('T')[0] : '',
        porcentajeProgreso: estudioEditando.porcentajeProgreso,
        estado: estudioEditando.estado,
        notas: estudioEditando.notas || ''
      });
    } else {
      setFormData({
        usuario: usuarioPreseleccionado || '',
        compositor: '',
        obra: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFinalizada: '',
        porcentajeProgreso: 0,
        estado: 'en_progreso',
        notas: ''
      });
    }
  }, [estudioEditando, usuarioPreseleccionado]);

  const cargarDatos = async () => {
    try {
      const usuariosData = await usuariosService.obtenerTodos();
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    }
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const datosEstudio = {
        usuarioId: formData.usuario,
        compositor: formData.compositor,
        obra: formData.obra,
        fechaInicio: formData.fechaInicio,
        fechaFinalizada: formData.fechaFinalizada || null,
        porcentajeProgreso: parseInt(formData.porcentajeProgreso) || 0,
        estado: formData.estado,
        notas: formData.notas || ''
      };

      if (estudioEditando) {
        await estudioService.actualizarEstudio(estudioEditando._id, datosEstudio);
      } else {
        await estudioService.crearEstudio(datosEstudio);
      }

      onGuardado();
      onCerrar();
    } catch (error) {
      console.error('Error al guardar estudio:', error);
      setError(error.response?.data?.message || 'Error al guardar el estudio');
    } finally {
      setLoading(false);
    }
  };

  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {estudioEditando ? 'Editar Estudio' : 'Nuevo Estudio'}
          </h2>
          <button
            onClick={onCerrar}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={manejarSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estudiante *
              </label>
              <select
                value={formData.usuario}
                onChange={(e) => setFormData({...formData, usuario: e.target.value})}
                required
                disabled={!!usuarioPreseleccionado}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Seleccionar estudiante</option>
                {usuarios
                  .filter(user => user.rol === 'usuario')
                  .map(user => (
                    <option key={user._id} value={user._id}>
                      {user.nombre} {user.apellido}
                    </option>
                  ))}
              </select>
              {usuarioPreseleccionado && (
                <p className="text-xs text-gray-500 mt-1">
                  Usuario preseleccionado desde gestión de clases
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compositor *
              </label>
              <input
                type="text"
                value={formData.compositor}
                onChange={(e) => setFormData({...formData, compositor: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obra *
              </label>
              <input
                type="text"
                value={formData.obra}
                onChange={(e) => setFormData({...formData, obra: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logro (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.porcentajeProgreso}
                onChange={(e) => setFormData({...formData, porcentajeProgreso: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de finalización real
              </label>
              <input
                type="date"
                value={formData.fechaFinalizada}
                onChange={(e) => setFormData({...formData, fechaFinalizada: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={formData.estado !== 'finalizado'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo se puede establecer cuando el estado es "Finalizado"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => {
                  const nuevoEstado = e.target.value;
                  setFormData({
                    ...formData, 
                    estado: nuevoEstado,
                    fechaFinalizada: nuevoEstado === 'finalizado' && !formData.fechaFinalizada 
                      ? new Date().toISOString().split('T')[0] 
                      : nuevoEstado === 'finalizado' 
                        ? formData.fechaFinalizada 
                        : ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en_progreso">En progreso</option>
                <option value="finalizado">Finalizado</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas adicionales
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({...formData, notas: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observaciones, técnicas específicas, objetivos..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (estudioEditando ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEstudio;
