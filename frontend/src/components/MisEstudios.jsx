import React, { useState, useEffect } from 'react';
import { Book, User } from 'lucide-react';
import EstudiosUsuario from './EstudiosUsuario';
import authService from '../services/authService';

const MisEstudios = () => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      setLoading(true);
      const user = authService.getUsuario();
      setUsuario(user);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    } finally {
      setLoading(false);
    }
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

      {usuario && (
        <EstudiosUsuario 
          key={`estudios-${usuario._id}-${filtroEstado}`}
          usuarioId={usuario._id}
          mostrarTitulo={false}
          modoVisualizacion="cards"
          filtrarEstados={filtroEstado === 'todos' ? null : [filtroEstado]}
          esAdmin={false}
        />
      )}
    </div>
  );
};

export default MisEstudios;
