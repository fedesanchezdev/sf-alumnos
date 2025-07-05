import { useState, useEffect } from 'react';
import { partiturasService, resumenClaseService } from '../services/api';
import { formatearFechaCorta } from '../utils/fechas';

const ResumenClase = ({ claseId, usuarioId, fecha, onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partituras, setPartituras] = useState([]);
  const [resumenExistente, setResumenExistente] = useState(null);
  const [busquedaPartitura, setBusquedaPartitura] = useState('');
  const [partiturasFiltradas, setPartiturasFiltradas] = useState([]);
  
  const [formData, setFormData] = useState({
    obrasEstudiadas: [],
    comentariosGenerales: '',
    objetivosProximaClase: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [claseId]);

  useEffect(() => {
    // Filtrar partituras según búsqueda
    console.log('Filtrando partituras:', { busquedaPartitura, totalPartituras: partituras.length });
    if (busquedaPartitura.trim()) {
      const termino = busquedaPartitura.toLowerCase();
      const filtradas = partituras.filter(p => 
        p.compositor.toLowerCase().includes(termino) ||
        p.obra.toLowerCase().includes(termino) ||
        p.movimientos?.some(m => m.nombre.toLowerCase().includes(termino))
      );
      console.log('Partituras filtradas:', filtradas.length);
      setPartiturasFiltradas(filtradas);
    } else {
      setPartiturasFiltradas(partituras);
    }
  }, [busquedaPartitura, partituras]);

  const cargarDatos = async () => {
    try {
      console.log('Cargando datos de partituras...');
      const [partiurasResponse, resumenResponse] = await Promise.all([
        partiturasService.obtenerTodas(),
        resumenClaseService.obtenerPorClase(claseId)
      ]);

      console.log('Partituras recibidas:', partiurasResponse.data);
      setPartituras(partiurasResponse.data);
      
      if (resumenResponse.data && resumenResponse.data.obrasEstudiadas) {
        setResumenExistente(resumenResponse.data);
        setFormData({
          obrasEstudiadas: resumenResponse.data.obrasEstudiadas || [],
          comentariosGenerales: resumenResponse.data.comentariosGenerales || '',
          objetivosProximaClase: resumenResponse.data.objetivosProximaClase || ''
        });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarObra = (partitura) => {
    const yaExiste = formData.obrasEstudiadas.some(obra => obra.partitura === partitura._id);
    if (yaExiste) {
      alert('Esta obra ya está agregada');
      return;
    }

    const nuevaObra = {
      partitura: partitura._id,
      partituraInfo: partitura, // Para mostrar en la UI
      movimientosEstudiados: [],
      comentarios: ''
    };

    setFormData({
      ...formData,
      obrasEstudiadas: [...formData.obrasEstudiadas, nuevaObra]
    });
    setBusquedaPartitura('');
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

  const toggleMovimiento = (obraIndex, movimiento) => {
    const obra = formData.obrasEstudiadas[obraIndex];
    const movimientosActuales = obra.movimientosEstudiados || [];
    
    const movimientoExiste = movimientosActuales.find(m => m.movimientoId === movimiento._id);
    
    let nuevosMovimientos;
    if (movimientoExiste) {
      // Quitar movimiento
      nuevosMovimientos = movimientosActuales.filter(m => m.movimientoId !== movimiento._id);
    } else {
      // Agregar movimiento
      nuevosMovimientos = [...movimientosActuales, {
        movimientoId: movimiento._id,
        nombre: movimiento.nombre,
        comentarios: ''
      }];
    }

    actualizarObra(obraIndex, 'movimientosEstudiados', nuevosMovimientos);
  };

  const actualizarComentarioMovimiento = (obraIndex, movimientoId, comentarios) => {
    const obra = formData.obrasEstudiadas[obraIndex];
    const nuevosMovimientos = obra.movimientosEstudiados.map(m => 
      m.movimientoId === movimientoId ? { ...m, comentarios } : m
    );
    actualizarObra(obraIndex, 'movimientosEstudiados', nuevosMovimientos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Preparar datos para enviar al backend
      const datosParaEnviar = {
        claseId: claseId,
        obrasEstudiadas: formData.obrasEstudiadas.map(obra => ({
          partitura: obra.partitura,
          movimientosEstudiados: obra.movimientosEstudiados || [],
          comentarios: obra.comentarios || ''
        })),
        comentariosGenerales: formData.comentariosGenerales,
        objetivosProximaClase: formData.objetivosProximaClase
      };

      await resumenClaseService.crearOActualizar(datosParaEnviar);
      
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Estudiante:</span>
                <p className="text-blue-900">ID: {usuarioId}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Fecha:</span>
                <p className="text-blue-900">{formatearFechaCorta(fecha)}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Clase:</span>
                <p className="text-blue-900">ID: {claseId}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agregar obras */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎼 Obras Estudiadas</h3>
              
              {/* Búsqueda de partituras */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar y agregar obra:
                </label>
                <input
                  type="text"
                  value={busquedaPartitura}
                  onChange={(e) => setBusquedaPartitura(e.target.value)}
                  placeholder="Buscar por compositor, obra o movimiento..."
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                
                {/* Mostrar información de debug */}
                <div className="mt-1 text-xs text-gray-500">
                  Partituras cargadas: {partituras.length} | Filtradas: {partiturasFiltradas.length}
                </div>
                
                {/* Resultados de búsqueda */}
                {busquedaPartitura && partiturasFiltradas.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                    {partiturasFiltradas.slice(0, 10).map((partitura) => (
                      <button
                        key={partitura._id}
                        type="button"
                        onClick={() => agregarObra(partitura)}
                        className="w-full text-left p-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{partitura.compositor}</div>
                        <div className="text-sm text-gray-600">{partitura.obra}</div>
                        {partitura.movimientos?.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {partitura.movimientos.length} movimiento(s)
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Mostrar todas las partituras si no hay búsqueda */}
                {!busquedaPartitura && partituras.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Obras disponibles (escribe para buscar):</p>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                      {partituras.slice(0, 10).map((partitura) => (
                        <button
                          key={partitura._id}
                          type="button"
                          onClick={() => agregarObra(partitura)}
                          className="w-full text-left p-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{partitura.compositor}</div>
                          <div className="text-sm text-gray-600">{partitura.obra}</div>
                          {partitura.movimientos?.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {partitura.movimientos.length} movimiento(s)
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Obras agregadas */}
              <div className="space-y-4">
                {formData.obrasEstudiadas.map((obra, obraIndex) => (
                  <div key={obraIndex} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {obra.partituraInfo?.compositor}
                        </h4>
                        <p className="text-gray-700">{obra.partituraInfo?.obra}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarObra(obraIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Movimientos disponibles */}
                    {obra.partituraInfo?.movimientos?.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Movimientos/Partes estudiadas:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {obra.partituraInfo.movimientos.map((movimiento) => {
                            const estaSeleccionado = obra.movimientosEstudiados?.some(
                              m => m.movimientoId === movimiento._id
                            );
                            return (
                              <label key={movimiento._id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={estaSeleccionado}
                                  onChange={() => toggleMovimiento(obraIndex, movimiento)}
                                  className="mr-2"
                                />
                                <span className="text-sm">{movimiento.nombre}</span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Comentarios por movimiento */}
                        {obra.movimientosEstudiados?.map((movimiento) => (
                          <div key={movimiento.movimientoId} className="mt-2">
                            <label className="block text-xs font-medium text-gray-600">
                              Comentarios - {movimiento.nombre}:
                            </label>
                            <textarea
                              value={movimiento.comentarios || ''}
                              onChange={(e) => actualizarComentarioMovimiento(
                                obraIndex, 
                                movimiento.movimientoId, 
                                e.target.value
                              )}
                              placeholder="Qué trabajar, correcciones, etc..."
                              className="w-full p-2 text-sm border border-gray-300 rounded-md"
                              rows="2"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comentarios generales de la obra */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comentarios generales de la obra:
                      </label>
                      <textarea
                        value={obra.comentarios || ''}
                        onChange={(e) => actualizarObra(obraIndex, 'comentarios', e.target.value)}
                        placeholder="Comentarios generales sobre esta obra..."
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows="2"
                      />
                    </div>
                  </div>
                ))}

                {formData.obrasEstudiadas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay obras agregadas</p>
                    <p className="text-sm">Usa el buscador arriba para agregar obras estudiadas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comentarios generales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Comentarios Generales de la Clase
              </label>
              <textarea
                value={formData.comentariosGenerales}
                onChange={(e) => setFormData({
                  ...formData,
                  comentariosGenerales: e.target.value
                })}
                placeholder="Observaciones generales, progreso, dificultades encontradas..."
                className="w-full p-3 border border-gray-300 rounded-md"
                rows="4"
              />
            </div>

            {/* Objetivos próxima clase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Objetivos para la Próxima Clase
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
            <div className="flex justify-end gap-3 pt-6 border-t">
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
                {saving ? 'Guardando...' : (resumenExistente ? 'Actualizar' : 'Guardar')} Resumen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResumenClase;
