import React, { useState } from 'react';
import { Share2, X, Check, MessageCircle } from 'lucide-react';

const ModalCompartirSesion = ({ 
  isOpen, 
  onClose, 
  onCompartir, 
  datosResumen 
}) => {
  const [comentarioOpcional, setComentarioOpcional] = useState('');
  const [procesando, setProcesando] = useState(false);

  if (!isOpen) return null;

  const handleCompartir = async (compartir) => {
    if (procesando) return; // Evitar clics múltiples
    
    setProcesando(true);
    try {
      await onCompartir(compartir, comentarioOpcional);
      // No cerrar el modal inmediatamente, dejar que el componente padre lo maneje
    } catch (error) {
      console.error('Error al procesar decisión:', error);
    } finally {
      setProcesando(false);
    }
  };

  const formatearTiempo = (segundos) => {
    if (!segundos || isNaN(segundos) || segundos < 0) {
      return '00:00';
    }
    
    const segundosNum = Math.floor(Number(segundos));
    const horas = Math.floor(segundosNum / 3600);
    const minutos = Math.floor((segundosNum % 3600) / 60);
    const secs = segundosNum % 60;
    
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Sesión Finalizada
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resumen de la sesión */}
          {datosResumen && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Resumen de tu sesión:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">{datosResumen.compositor}</span> - {datosResumen.obra}
                </div>
                {(datosResumen.movimientoPieza || datosResumen.compasesEstudiados) && (
                  <div>
                    {datosResumen.movimientoPieza && <span>{datosResumen.movimientoPieza}</span>}
                    {datosResumen.movimientoPieza && datosResumen.compasesEstudiados && <span> • </span>}
                    {datosResumen.compasesEstudiados && <span>{datosResumen.compasesEstudiados}</span>}
                  </div>
                )}
                <div>
                  <span className="font-medium">Tiempo practicado:</span> {formatearTiempo(datosResumen.tiempoTotalSegundos)}
                </div>
                {datosResumen.metronomomUsado && (
                  <div>
                    <span className="font-medium">BPM:</span> {datosResumen.bpmInicial}
                    {datosResumen.bpmFinal !== datosResumen.bpmInicial && ` → ${datosResumen.bpmFinal}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pregunta principal */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">
              ¿Te gustaría compartir esta sesión con tu profesor?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Compartir tus sesiones ayuda a tu profesor a entender tu progreso y 
              brindarte mejor orientación. Siempre puedes elegir qué compartir y qué mantener privado.
            </p>
          </div>

          {/* Campo de comentario opcional */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Comentario para tu profesor (opcional)
            </label>
            <textarea
              value={comentarioOpcional}
              onChange={(e) => setComentarioOpcional(e.target.value)}
              placeholder="Ej: Tuve dificultades con los compases 12-16, me gustaría repasarlo en clase..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {comentarioOpcional.length}/500 caracteres
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleCompartir(true)}
              disabled={procesando}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir con profesor</span>
            </button>
            
            <button
              onClick={() => handleCompartir(false)}
              disabled={procesando}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Mantener privado</span>
            </button>
          </div>

          {/* Nota sobre privacidad */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Privacidad:</strong> Solo tú puedes decidir qué sesiones compartir. 
              Las sesiones privadas nunca serán visibles para tu profesor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCompartirSesion;
