import { useState, useEffect } from 'react';
import { partiturasService, resumenClaseService, usuariosService } from '../services/api';
import { formatearFechaCorta } from '../utils/fechas';
import { enviarWhatsApp, generarMensajeResumen } from '../utils/whatsapp';
import { logger } from '../utils/logger';

const ResumenClase = ({ claseId, usuarioId, fecha, onClose, onSave, resumenExistente, isStandalone = false }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partituras, setPartituras] = useState([]);
  const [compositores, setCompositores] = useState([]);
  const [usuario, setUsuario] = useState(null);
  
  const [formData, setFormData] = useState({
    obrasEstudiadas: [],
    objetivosProximaClase: ''
  });

  // Estado para el selector de nuevas obras
  const [nuevaObra, setNuevaObra] = useState({
    compositor: '',
    obra: '',
    movimientosCompases: '',
    comentarios: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [claseId, resumenExistente]);

  const cargarDatos = async () => {
    try {
      // Cargar partituras
      const partiurasResponse = await partiturasService.obtenerTodas();
      setPartituras(partiurasResponse.data);
      
      // Extraer compositores únicos
      const compositoresUnicos = [...new Set(partiurasResponse.data.map(p => p.compositor))].sort();
      setCompositores(compositoresUnicos);
      
      // Cargar información del usuario
      if (usuarioId) {
        try {
          const usuarioResponse = await usuariosService.obtenerPorId(usuarioId);
          setUsuario(usuarioResponse.data);
        } catch (error) {
          logger.error('Error al cargar usuario:', error);
        }
      }
      
      // Si hay resumen existente, usarlo directamente
      if (resumenExistente) {
        setFormData({
          obrasEstudiadas: resumenExistente.obrasEstudiadas || [],
          objetivosProximaClase: resumenExistente.objetivosProximaClase || ''
        });
      } else {
        // Si no hay resumen existente, intentar cargar desde la API
        const resumenResponse = await resumenClaseService.obtenerPorClase(claseId);
        if (resumenResponse.data && resumenResponse.data.obrasEstudiadas) {
          setFormData({
            obrasEstudiadas: resumenResponse.data.obrasEstudiadas || [],
            objetivosProximaClase: resumenResponse.data.objetivosProximaClase || ''
          });
        }
      }
    } catch (error) {
      logger.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getObrasDelCompositor = (compositor) => {
    return partituras.filter(p => p.compositor === compositor);
  };

  const agregarObra = () => {
    if (!nuevaObra.compositor || !nuevaObra.obra) {
      alert('Por favor completa compositor y obra');
      return;
    }

    logger.dev('Agregando obra:', { compositor: nuevaObra.compositor, obra: nuevaObra.obra });

    // Buscar si existe en la base de datos
    const partitura = partituras.find(p => 
      p.compositor === nuevaObra.compositor && p.obra === nuevaObra.obra
    );

    // Verificar si ya existe exactamente la misma obra con los mismos movimientos/compases
    const yaExisteExacto = formData.obrasEstudiadas.some(obra => 
      obra.compositor === nuevaObra.compositor && 
      obra.obra === nuevaObra.obra &&
      obra.movimientosCompases === nuevaObra.movimientosCompases
    );

    if (yaExisteExacto) {
      alert('Esta obra con los mismos movimientos/compases ya está agregada. Si quieres agregar diferentes movimientos, especifica movimientos distintos.');
      return;
    }

    const obraCompleta = {
      id: Date.now(), // ID temporal para React
      compositor: nuevaObra.compositor,
      obra: nuevaObra.obra,
      movimientosCompases: nuevaObra.movimientosCompases || '',
      comentarios: nuevaObra.comentarios || '',
      // Solo incluir partitura si existe en la DB
      ...(partitura && partitura._id ? { partitura: partitura._id } : {}),
      // Marcar si es manual (no está en DB)
      esManual: !partitura || !partitura._id
    };

    logger.dev('Obra completa a agregar:', obraCompleta);
    logger.dev(partitura ? 'Obra encontrada en DB' : 'Obra manual (no está en DB)');

    setFormData({
      ...formData,
      obrasEstudiadas: [...formData.obrasEstudiadas, obraCompleta]
    });

    // Limpiar solo movimientos y comentarios, mantener compositor y obra para facilitar agregar más movimientos
    setNuevaObra({
      ...nuevaObra,
      movimientosCompases: '',
      comentarios: ''
    });
  };

  const eliminarObra = (index) => {
    const nuevasObras = formData.obrasEstudiadas.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      obrasEstudiadas: nuevasObras
    });
  };

  const actualizarObra = (index, campo, valor) => {
    const nuevasObras = [...formData.obrasEstudiadas];
    nuevasObras[index] = {
      ...nuevasObras[index],
      [campo]: valor
    };
    setFormData({
      ...formData,
      obrasEstudiadas: nuevasObras
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (formData.obrasEstudiadas.length === 0) {
        alert('⚠️ No hay obras agregadas. Por favor, agrega al menos una obra.');
        setSaving(false);
        return;
      }

      const datosParaEnviar = {
        claseId: claseId,
        obrasEstudiadas: formData.obrasEstudiadas.map(obra => ({
          // Solo incluir partitura si existe (obra de la DB)
          ...(obra.partitura ? { partitura: obra.partitura } : {}),
          compositor: obra.compositor,
          obra: obra.obra,
          movimientosCompases: obra.movimientosCompases || '',
          comentarios: obra.comentarios || '',
          esManual: obra.esManual || false
        })),
        objetivosProximaClase: formData.objetivosProximaClase || ''
      };

      logger.sensitive('Datos enviados al backend:', datosParaEnviar);
      logger.dev('Obras de DB:', datosParaEnviar.obrasEstudiadas.filter(o => o.partitura).length);
      logger.dev('Obras manuales:', datosParaEnviar.obrasEstudiadas.filter(o => o.esManual).length);
      
      const response = await resumenClaseService.crearOActualizar(datosParaEnviar);
      logger.sensitive('Respuesta del backend:', response.data);
      
      logger.success('Resumen guardado exitosamente, llamando onSave...');
      if (onSave) {
        onSave();
      }
      
      alert('✅ Resumen de clase guardado exitosamente');
      onClose();
      
    } catch (error) {
      logger.error('Error al guardar resumen:', error);
      logger.sensitive('Respuesta del error:', error.response?.data);
      
      // Mostrar mensaje de error más específico
      let mensajeError = 'Error al guardar el resumen';
      if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
        
        // Si hay partituras no encontradas, mostrar detalles
        if (error.response.data.partiturasNoEncontradas) {
          logger.error('Partituras no encontradas:', error.response.data.partiturasNoEncontradas);
          mensajeError += `\n\nPartituras no válidas encontradas. Por favor, vuelve a seleccionar las obras.`;
        }
      }
      
      alert(`❌ ${mensajeError}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarYEnviarWhatsApp = async () => {
    try {
      setSaving(true);
      
      // Primero guardar
      const datosParaEnviar = {
        claseId: claseId,
        obrasEstudiadas: formData.obrasEstudiadas.map(obra => ({
          // Solo incluir partitura si existe (obra de la DB)
          ...(obra.partitura ? { partitura: obra.partitura } : {}),
          compositor: obra.compositor,
          obra: obra.obra,
          movimientosCompases: obra.movimientosCompases || '',
          comentarios: obra.comentarios || '',
          esManual: obra.esManual || false
        })),
        objetivosProximaClase: formData.objetivosProximaClase || ''
      };

      await resumenClaseService.crearOActualizar(datosParaEnviar);
      
      // Generar y enviar mensaje de WhatsApp usando utilidades
      const mensaje = generarMensajeResumen({
        fecha: formatearFechaCorta(fecha),
        obrasEstudiadas: formData.obrasEstudiadas,
        objetivosProximaClase: formData.objetivosProximaClase
      });
      
      // Enviar por WhatsApp con el teléfono del usuario si está disponible
      if (usuario?.telefono) {
        enviarWhatsApp(mensaje, usuario.telefono);
      } else {
        enviarWhatsApp(mensaje);
      }
      
      logger.success('Resumen guardado exitosamente (WhatsApp), llamando onSave...');
      if (onSave) {
        onSave();
      }
      
      alert('✅ Resumen guardado y WhatsApp abierto');
      onClose();
      
    } catch (error) {
      logger.error('Error al guardar y enviar por WhatsApp:', error);
      alert('❌ Error al procesar la acción');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`${isStandalone ? '' : 'fixed inset-0 bg-black bg-opacity-50'} flex items-center justify-center ${isStandalone ? 'p-6' : 'z-50'}`}>
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center">Cargando...</p>
        </div>
      </div>
    );
  }

  const containerClass = isStandalone 
    ? "bg-white rounded-lg w-full" 
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";

  const contentClass = isStandalone 
    ? "w-full" 
    : "bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        <div className="p-6">
          {!isStandalone && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                📚 Resumen de Clase
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Información de la clase */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Información de la Clase</h3>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-blue-700 font-medium">Fecha:</span>
                <span className="text-blue-900 ml-2">{formatearFechaCorta(fecha)}</span>
              </div>
              {usuario && (
                <div>
                  <span className="text-blue-700 font-medium">Alumno:</span>
                  <span className="text-blue-900 ml-2">{usuario.nombre} {usuario.apellido}</span>
                  {usuario.telefono && (
                    <span className="text-green-600 ml-2 text-xs">📱 WhatsApp disponible</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Obras Estudiadas */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎼 Obras Estudiadas</h3>
              
              {/* Formulario para agregar nueva obra */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3">Agregar Nueva Obra</h4>
                <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Opciones para agregar obras:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>📚 <strong>De la biblioteca:</strong> Selecciona de los menús desplegables</li>
                    <li>✏️ <strong>Manual:</strong> Escribe directamente compositor y obra (no requiere estar en la biblioteca)</li>
                    <li>🔄 <strong>Múltiples movimientos:</strong> Agrega el mismo compositor/obra con diferentes movimientos</li>
                  </ul>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selector de Compositor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compositor
                    </label>
                    <div className="space-y-2">
                      <select
                        value={nuevaObra.compositor}
                        onChange={(e) => setNuevaObra({
                          ...nuevaObra,
                          compositor: e.target.value,
                          obra: '' // Resetear obra al cambiar compositor
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Seleccionar de la biblioteca...</option>
                        {compositores.map(compositor => (
                          <option key={compositor} value={compositor}>
                            {compositor}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500 text-center">O</div>
                      <input
                        type="text"
                        value={nuevaObra.compositor}
                        onChange={(e) => setNuevaObra({
                          ...nuevaObra,
                          compositor: e.target.value,
                          obra: '' // Resetear obra al cambiar compositor
                        })}
                        placeholder="Escribir compositor manualmente..."
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Selector de Obra */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Obra
                    </label>
                    <div className="space-y-2">
                      {/* Mostrar selector solo si hay compositor seleccionado de la biblioteca */}
                      {nuevaObra.compositor && compositores.includes(nuevaObra.compositor) && (
                        <select
                          value={nuevaObra.obra}
                          onChange={(e) => setNuevaObra({
                            ...nuevaObra,
                            obra: e.target.value
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Seleccionar de la biblioteca...</option>
                          {getObrasDelCompositor(nuevaObra.compositor).map(partitura => (
                            <option key={partitura._id} value={partitura.obra}>
                              {partitura.obra}
                            </option>
                          ))}
                        </select>
                      )}
                      {nuevaObra.compositor && compositores.includes(nuevaObra.compositor) && (
                        <div className="text-xs text-gray-500 text-center">O</div>
                      )}
                      <input
                        type="text"
                        value={nuevaObra.obra}
                        onChange={(e) => setNuevaObra({
                          ...nuevaObra,
                          obra: e.target.value
                        })}
                        placeholder="Escribir obra manualmente..."
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Movimientos/Compases */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Movimientos o Compases
                  </label>
                  <input
                    type="text"
                    value={nuevaObra.movimientosCompases}
                    onChange={(e) => setNuevaObra({
                      ...nuevaObra,
                      movimientosCompases: e.target.value
                    })}
                    placeholder="Ej: 1er movimiento, compases 1-32, Andante..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Comentarios */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentarios
                  </label>
                  <textarea
                    value={nuevaObra.comentarios}
                    onChange={(e) => setNuevaObra({
                      ...nuevaObra,
                      comentarios: e.target.value
                    })}
                    placeholder="Qué se trabajó, dificultades encontradas, correcciones..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="2"
                  />
                </div>

                {/* Botones para agregar obra */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={agregarObra}
                    disabled={!nuevaObra.compositor || !nuevaObra.obra}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➕ Agregar Movimiento/Ejercicio
                  </button>
                  
                  {(nuevaObra.compositor || nuevaObra.obra) && (
                    <button
                      type="button"
                      onClick={() => setNuevaObra({
                        compositor: '',
                        obra: '',
                        movimientosCompases: '',
                        comentarios: ''
                      })}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      🔄 Nueva Obra
                    </button>
                  )}
                </div>
                
                {/* Ayuda para múltiples movimientos */}
                {nuevaObra.compositor && nuevaObra.obra && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Puedes agregar múltiples movimientos de la misma obra. 
                      Después de agregar un movimiento, el formulario mantiene la obra seleccionada 
                      para que puedas agregar fácilmente otro movimiento o ejercicio.
                    </p>
                  </div>
                )}
              </div>

              {/* Lista de obras agregadas */}
              <div className="space-y-3">
                {formData.obrasEstudiadas.map((obra, index) => {
                  // Verificar si hay otras obras del mismo compositor y título
                  const obrasIguales = formData.obrasEstudiadas.filter(o => 
                    o.compositor === obra.compositor && o.obra === obra.obra
                  );
                  const esMultiple = obrasIguales.length > 1;
                  const numeroMovimiento = obrasIguales.findIndex(o => o.id === obra.id) + 1;
                  
                  return (
                    <div key={obra.id || index} className={`border rounded-lg p-4 bg-white ${esMultiple ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            {obra.compositor}
                            {esMultiple && (
                              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                #{numeroMovimiento}
                              </span>
                            )}
                            {obra.esManual && (
                              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full" title="Obra agregada manualmente">
                                ✏️ Manual
                              </span>
                            )}
                            {!obra.esManual && obra.partitura && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full" title="Obra de la biblioteca">
                                📚 Biblioteca
                              </span>
                            )}
                          </h4>
                          <p className="text-gray-700">{obra.obra}</p>
                          {esMultiple && (
                            <p className="text-xs text-blue-600 mt-1">
                              📚 {obrasIguales.length} movimientos/ejercicios de esta obra
                            </p>
                          )}
                          {obra.esManual && (
                            <p className="text-xs text-orange-600 mt-1">
                              ℹ️ Obra agregada manualmente (no requiere estar en la biblioteca)
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarObra(index)}
                          className="text-red-600 hover:text-red-800 text-lg"
                          title="Eliminar este movimiento"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Campos editables */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Movimientos/Compases/Ejercicios
                          </label>
                          <input
                            type="text"
                            value={obra.movimientosCompases || ''}
                            onChange={(e) => actualizarObra(index, 'movimientosCompases', e.target.value)}
                            placeholder="Ej: Ejercicio 20, 1er movimiento, compases 1-32..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comentarios
                          </label>
                          <textarea
                            value={obra.comentarios || ''}
                            onChange={(e) => actualizarObra(index, 'comentarios', e.target.value)}
                            placeholder="Qué se trabajó, correcciones..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            rows="2"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}                {formData.obrasEstudiadas.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-lg">🎼</p>
                    <p>No hay obras agregadas</p>
                    <p className="text-sm">Usa el formulario arriba para agregar obras estudiadas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Próxima clase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Próxima Clase
              </label>
              <textarea
                value={formData.objetivosProximaClase}
                onChange={(e) => setFormData({
                  ...formData,
                  objetivosProximaClase: e.target.value
                })}
                placeholder="Qué trabajar la próxima clase, metas específicas..."
                className="w-full p-3 border border-gray-300 rounded-md"
                rows="3"
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
              {!isStandalone && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={handleGuardarYEnviarWhatsApp}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Procesando...' : (
                  <>
                    📱 Enviar por WhatsApp
                    {usuario?.telefono && (
                      <span className="text-xs bg-green-800 px-1.5 py-0.5 rounded">
                        Auto
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResumenClase;
