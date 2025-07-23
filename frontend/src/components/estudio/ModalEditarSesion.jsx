import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { sesionEstudioService } from '../../services/sesionEstudioService';
import { toast } from 'react-hot-toast';

const ModalEditarSesion = ({ sesion, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    compositor: '',
    obra: '',
    movimientoPieza: '',
    compasesEstudiados: '',
    comentarios: ''
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (sesion && isOpen) {
      setFormData({
        compositor: sesion.compositor || '',
        obra: sesion.obra || '',
        movimientoPieza: sesion.movimientoPieza || '',
        compasesEstudiados: sesion.compasesEstudiados || '',
        comentarios: sesion.comentarios || ''
      });
    }
  }, [sesion, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const response = await sesionEstudioService.editarSesion(sesion._id, formData);
      
      if (response.success) {
        toast.success('Sesión actualizada exitosamente');
        onSave(response.sesion);
        onClose();
      } else {
        toast.error(response.message || 'Error al actualizar la sesión');
      }
    } catch (error) {
      console.error('Error al guardar sesión:', error);
      toast.error('Error al actualizar la sesión');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Editar Sesión</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Compositor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compositor
            </label>
            <input
              type="text"
              name="compositor"
              value={formData.compositor}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Obra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Obra
            </label>
            <input
              type="text"
              name="obra"
              value={formData.obra}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Movimiento/Pieza */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movimiento/Pieza
            </label>
            <input
              type="text"
              name="movimientoPieza"
              value={formData.movimientoPieza}
              onChange={handleInputChange}
              placeholder="Ej: I. Allegro, Pieza No. 1"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Compases */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compases Estudiados
            </label>
            <input
              type="text"
              name="compasesEstudiados"
              value={formData.compasesEstudiados}
              onChange={handleInputChange}
              placeholder="Ej: 1-16, 25-32"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios
            </label>
            <textarea
              name="comentarios"
              value={formData.comentarios}
              onChange={handleInputChange}
              rows={3}
              placeholder="Notas sobre la sesión, dificultades, logros..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarSesion;
