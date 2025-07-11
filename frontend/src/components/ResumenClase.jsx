import { useState, useEffect } from 'react';
import { partiturasService, resumenClaseService } from '../services/api';
import { formatearFechaCorta } from '../utils/fechas';
import { enviarWhatsApp, generarMensajeResumen } from '../utils/whatsapp';

const ResumenClase = ({ claseId, usuarioId, fecha, onClose, onSave, resumenExistente }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partituras, setPartituras] = useState([]);
  const [compositores, setCompositores] = useState([]);
  
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
      const partiurasResponse = await partiturasService.obtenerTodas();
      setPartituras(partiurasResponse.data);
      
      // Extraer compositores únicos
      const compositoresUnicos = [...new Set(partiurasResponse.data.map(p => p.compositor))].sort();
      setCompositores(compositoresUnicos);
      
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
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getObrasDelCompositor = (compositor) => {
    return partituras.filter(p => p.compositor === compositor);
  };

  const agregarObra = () => {
    if (!nuevaObra.compositor || !nuevaObra.obra) {
      alert('Por favor selecciona compositor y obra');
      return;
    }

    console.log('Buscando partitura:', { compositor: nuevaObra.compositor, obra: nuevaObra.obra });
    console.log('Partituras disponibles:', partituras.map(p => ({ id: p._id, compositor: p.compositor, obra: p.obra })));

    const partitura = partituras.find(p => 
      p.compositor === nuevaObra.compositor && p.obra === nuevaObra.obra
    );

    if (!partitura) {
      alert('⚠️ Obra no encontrada en la base de datos. Por favor verifica la selección.');
      console.error('Partitura no encontrada para:', { compositor: nuevaObra.compositor, obra: nuevaObra.obra });
      return;
    }

    if (!partitura._id) {
      alert('⚠️ Error: La partitura no tiene ID válido');
      console.error('Partitura sin ID:', partitura);
      return;
    }

    console.log('Partitura encontrada:', partitura);

    const yaExiste = formData.obrasEstudiadas.some(obra => 
      obra.compositor === nuevaObra.compositor && obra.obra === nuevaObra.obra
    );

    if (yaExiste) {
      alert('Esta obra ya está agregada');
      return;
    }

    const obraCompleta = {
      id: Date.now(), // ID temporal para React
      partitura: partitura._id,
      compositor: nuevaObra.compositor,
      obra: nuevaObra.obra,
      movimientosCompases: nuevaObra.movimientosCompases,
      comentarios: nuevaObra.comentarios
    };

    console.log('Obra completa agregada:', obraCompleta);

    setFormData({
      ...formData,
      obrasEstudiadas: [...formData.obrasEstudiadas, obraCompleta]
    });

    // Limpiar formulario
    setNuevaObra({
      compositor: '',
      obra: '',
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
      const datosParaEnviar = {
        claseId: claseId,
        obrasEstudiadas: formData.obrasEstudiadas
          .filter(obra => obra.partitura) // Solo incluir obras con partitura válida
          .map(obra => ({
            partitura: obra.partitura,
            compositor: obra.compositor,
            obra: obra.obra,
            movimientosCompases: obra.movimientosCompases,
            comentarios: obra.comentarios
          })),
        objetivosProximaClase: formData.objetivosProximaClase
      };

      console.log('Datos enviados al backend:', datosParaEnviar);
      
      // Verificar que todas las obras tienen partitura válida
      const obrasSinPartitura = formData.obrasEstudiadas.filter(obra => !obra.partitura);
      if (obrasSinPartitura.length > 0) {
        console.warn('Obras sin partitura encontradas:', obrasSinPartitura);
        alert(`⚠️ Hay ${obrasSinPartitura.length} obra(s) sin partitura válida que serán omitidas. Por favor, verifica las obras seleccionadas.`);
      }

      await resumenClaseService.crearOActualizar(datosParaEnviar);
      
      console.log('💾 Resumen guardado exitosamente, llamando onSave...');
      if (onSave) {
        onSave();
      }
      
      alert('✅ Resumen de clase guardado exitosamente');
      onClose();
      
    } catch (error) {
      console.error('Error al guardar resumen:', error);
      alert('❌ Error al guardar el resumen');
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
        obrasEstudiadas: formData.obrasEstudiadas
          .filter(obra => obra.partitura) // Solo incluir obras con partitura válida
          .map(obra => ({
            partitura: obra.partitura,
            compositor: obra.compositor,
            obra: obra.obra,
            movimientosCompases: obra.movimientosCompases,
            comentarios: obra.comentarios
          })),
        objetivosProximaClase: formData.objetivosProximaClase
      };

      await resumenClaseService.crearOActualizar(datosParaEnviar);
      
      // Generar y enviar mensaje de WhatsApp usando utilidades
      const mensaje = generarMensajeResumen({
        fecha: formatearFechaCorta(fecha),
        obrasEstudiadas: formData.obrasEstudiadas,
        objetivosProximaClase: formData.objetivosProximaClase
      });
      
      console.log('Mensaje generado:', mensaje);
      enviarWhatsApp(mensaje);
      
      console.log('💾 Resumen guardado exitosamente (WhatsApp), llamando onSave...');
      if (onSave) {
        onSave();
      }
      
      alert('✅ Resumen guardado y WhatsApp abierto');
      onClose();
      
    } catch (error) {
      console.error('Error al guardar y enviar por WhatsApp:', error);
      alert('❌ Error al procesar la acción');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
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

          {/* Información de la clase */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Información de la Clase</h3>
            <div className="text-sm">
              <div>
                <span className="text-blue-700 font-medium">Fecha:</span>
                <span className="text-blue-900 ml-2">{formatearFechaCorta(fecha)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Obras Estudiadas */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎼 Obras Estudiadas</h3>
              
              {/* Formulario para agregar nueva obra */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3">Agregar Nueva Obra</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selector de Compositor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compositor
                    </label>
                    <select
                      value={nuevaObra.compositor}
                      onChange={(e) => setNuevaObra({
                        ...nuevaObra,
                        compositor: e.target.value,
                        obra: '' // Resetear obra al cambiar compositor
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seleccionar compositor...</option>
                      {compositores.map(compositor => (
                        <option key={compositor} value={compositor}>
                          {compositor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de Obra */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Obra
                    </label>
                    <select
                      value={nuevaObra.obra}
                      onChange={(e) => setNuevaObra({
                        ...nuevaObra,
                        obra: e.target.value
                      })}
                      disabled={!nuevaObra.compositor}
                      className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                    >
                      <option value="">Seleccionar obra...</option>
                      {nuevaObra.compositor && getObrasDelCompositor(nuevaObra.compositor).map(partitura => (
                        <option key={partitura._id} value={partitura.obra}>
                          {partitura.obra}
                        </option>
                      ))}
                    </select>
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

                {/* Botón agregar obra */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={agregarObra}
                    disabled={!nuevaObra.compositor || !nuevaObra.obra}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➕ Agregar Obra
                  </button>
                </div>
              </div>

              {/* Lista de obras agregadas */}
              <div className="space-y-3">
                {formData.obrasEstudiadas.map((obra, index) => (
                  <div key={obra.id || index} className="border border-gray-300 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {obra.compositor}
                        </h4>
                        <p className="text-gray-700">{obra.obra}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarObra(index)}
                        className="text-red-600 hover:text-red-800 text-lg"
                        title="Eliminar obra"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Campos editables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Movimientos/Compases
                        </label>
                        <input
                          type="text"
                          value={obra.movimientosCompases || ''}
                          onChange={(e) => actualizarObra(index, 'movimientosCompases', e.target.value)}
                          placeholder="Ej: 1er movimiento, compases 1-32..."
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
                ))}

                {formData.obrasEstudiadas.length === 0 && (
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
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
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
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Procesando...' : '📱 Enviar por WhatsApp'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResumenClase;
