import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, MessageCircle, Music, X } from 'lucide-react';
import { notificacionService } from '../../services/notificacionService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    cargarNotificaciones();
    cargarContadorNoLeidas();
    
    // Actualizar contador cada 30 segundos
    const intervalo = setInterval(cargarContadorNoLeidas, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      const response = await notificacionService.obtenerNotificaciones(20);
      if (response.success) {
        setNotificaciones(response.notificaciones);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarContadorNoLeidas = async () => {
    try {
      const response = await notificacionService.contarNoLeidas();
      if (response.success) {
        setNoLeidas(response.count);
      }
    } catch (error) {
      console.error('Error al contar notificaciones:', error);
    }
  };

  const marcarComoLeida = async (notificacionId) => {
    try {
      await notificacionService.marcarComoLeida(notificacionId);
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => 
          notif._id === notificacionId 
            ? { ...notif, leida: true, fechaLeida: new Date() }
            : notif
        )
      );
      
      // Actualizar contador
      cargarContadorNoLeidas();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      toast.error('Error al marcar notificación como leída');
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await notificacionService.marcarTodasComoLeidas();
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => ({ 
          ...notif, 
          leida: true, 
          fechaLeida: new Date() 
        }))
      );
      
      setNoLeidas(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      toast.error('Error al marcar notificaciones como leídas');
    }
  };

  const manejarClicNotificacion = async (notificacion) => {
    // Marcar como leída si no está leída
    if (!notificacion.leida) {
      await marcarComoLeida(notificacion._id);
    }

    // Cerrar el panel
    setMostrarPanel(false);

    // Navegar según el tipo de notificación
    if (notificacion.tipo === 'sesion_compartida') {
      navigate('/sesiones-compartidas');
    } else if (notificacion.tipo === 'comentario_profesor') {
      navigate('/mis-comentarios-profesor');
    }
  };

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diferencia = ahora - fechaNotif;
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'sesion_compartida':
        return <Music className="w-4 h-4" />;
      case 'comentario_profesor':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getColorTipo = (tipo) => {
    switch (tipo) {
      case 'sesion_compartida':
        return 'text-blue-500 bg-blue-50';
      case 'comentario_profesor':
        return 'text-green-500 bg-green-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
      >
        <Bell size={20} />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {mostrarPanel && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setMostrarPanel(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Notificaciones</h3>
              <div className="flex items-center space-x-2">
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasComoLeidas}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <CheckCheck size={12} />
                    <span>Marcar todas</span>
                  </button>
                )}
                <button
                  onClick={() => setMostrarPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-96 overflow-y-auto">
              {cargando ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificaciones.map((notificacion) => (
                    <div
                      key={notificacion._id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notificacion.leida ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => manejarClicNotificacion(notificacion)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getColorTipo(notificacion.tipo)}`}>
                          {getIconoTipo(notificacion.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notificacion.leida ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notificacion.titulo}
                            </p>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">
                                {formatearFecha(notificacion.fechaCreacion)}
                              </span>
                              {!notificacion.leida && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notificacion.mensaje}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notificaciones.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  onClick={() => {
                    setMostrarPanel(false);
                    navigate('/sesiones-compartidas');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver sesiones compartidas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notificaciones;
