import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { partiturasService, usuariosService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const GestionPartituras = () => {
  const { usuario } = useAuth();
  const [partituras, setPartituras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [partiturasFiltradas, setPartiturasFiltradas] = useState([]);
  const [favoritos, setFavoritos] = useState(new Set());
  const [mostrarSoloFavoritos, setMostrarSoloFavoritos] = useState(false);
  const gridRef = useRef(null);

  // Función para igualar alturas de cards en la misma fila
  const equalizarAlturas = () => {
    if (!gridRef.current) return;
    
    const cards = Array.from(gridRef.current.querySelectorAll('.partitura-card'));
    if (cards.length === 0) return;

    // Resetear alturas
    cards.forEach(card => {
      card.style.height = 'auto';
    });

    // Agrupar cards por fila
    const filas = [];
    let filaActual = [];
    let offsetTopActual = null;

    cards.forEach(card => {
      const offsetTop = card.offsetTop;
      if (offsetTopActual === null || offsetTop === offsetTopActual) {
        filaActual.push(card);
        offsetTopActual = offsetTop;
      } else {
        filas.push(filaActual);
        filaActual = [card];
        offsetTopActual = offsetTop;
      }
    });
    
    if (filaActual.length > 0) {
      filas.push(filaActual);
    }

    // Igualar alturas dentro de cada fila
    filas.forEach(fila => {
      const alturaMaxima = Math.max(...fila.map(card => card.offsetHeight));
      fila.forEach(card => {
        card.style.height = `${alturaMaxima}px`;
      });
    });
  };

  // Efecto para igualar alturas cuando cambia el contenido
  useEffect(() => {
    const timer = setTimeout(() => {
      equalizarAlturas();
    }, 100);
    return () => clearTimeout(timer);
  }, [partiturasFiltradas]);

  // Manejar cambios en el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      const timer = setTimeout(() => {
        equalizarAlturas();
      }, 100);
      return () => clearTimeout(timer);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    cargarPartituras();
  }, []);

  useEffect(() => {
    // Filtrar partituras según búsqueda y favoritos
    let filtradas = partituras;
    
    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = normalizarTexto(busqueda);
      filtradas = filtradas.filter(p => 
        normalizarTexto(p.compositor).includes(termino) ||
        normalizarTexto(p.obra).includes(termino) ||
        p.movimientos?.some(m => m.nombre && normalizarTexto(m.nombre).includes(termino))
      );
    }
    
    // Filtro por favoritos
    if (mostrarSoloFavoritos) {
      filtradas = filtradas.filter(p => favoritos.has(p._id));
    }
    
    setPartiturasFiltradas(filtradas);
  }, [busqueda, partituras, favoritos, mostrarSoloFavoritos]);

  const cargarPartituras = async () => {
    try {
      setLoading(true);
      const response = await partiturasService.obtenerTodas();
      const datos = response.data || [];
      
      setPartituras(datos);
      setPartiturasFiltradas(datos);
      
      if (datos.length === 0) {
        setError('No se encontraron partituras en la base de datos');
      }
    } catch (error) {
      setError('Error al cargar partituras: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async (partituraId) => {
    if (!usuario?._id) {
      console.error('Usuario no autenticado');
      return;
    }

    // Optimistic UI: actualizar inmediatamente el estado local
    const esFavoritoActual = favoritos.has(partituraId);
    
    if (esFavoritoActual) {
      setFavoritos(prev => {
        const newFavoritos = new Set(prev);
        newFavoritos.delete(partituraId);
        return newFavoritos;
      });
    } else {
      setFavoritos(prev => new Set([...prev, partituraId]));
    }

    try {
      await usuariosService.alternarFavorito(usuario._id, partituraId);
      // La UI ya se actualizó, no necesitamos hacer nada más aquí
    } catch (error) {
      console.error('Error al alternar favorito:', error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      });
      
      // Revertir el cambio optimista en caso de error
      if (esFavoritoActual) {
        setFavoritos(prev => new Set([...prev, partituraId]));
      } else {
        setFavoritos(prev => {
          const newFavoritos = new Set(prev);
          newFavoritos.delete(partituraId);
          return newFavoritos;
        });
      }
      
      setError('Error al actualizar favorito. Inténtalo de nuevo.');
    }
  };

  const cargarFavoritos = async () => {
    if (!usuario?._id) {
      return;
    }

    try {
      const response = await usuariosService.obtenerFavoritos(usuario._id);
      const favoritosIds = response.data.map(partitura => partitura._id || partitura);
      setFavoritos(new Set(favoritosIds));
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      });
      // Fallback a localStorage si hay error
      try {
        const favoritosGuardados = localStorage.getItem(`favoritos-partituras-${usuario._id}`);
        if (favoritosGuardados) {
          setFavoritos(new Set(JSON.parse(favoritosGuardados)));
        }
      } catch (localError) {
        console.error('Error al cargar favoritos desde localStorage:', localError);
      }
    }
  };

  // Cargar favoritos al montar el componente o cuando cambie el usuario
  useEffect(() => {
    cargarFavoritos();
  }, [usuario]);

  // Función para normalizar texto (quitar acentos)
  const normalizarTexto = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const PartituraCard = ({ partitura }) => {
    const esFavorito = favoritos.has(partitura._id);
    
    const handleDetailsToggle = () => {
      // Usar setTimeout para esperar a que el DOM se actualice
      setTimeout(() => {
        equalizarAlturas();
      }, 50);
    };
    
    return (
      <div className="bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 h-full flex flex-col w-full sm:min-w-[350px] lg:min-w-[380px] min-h-[130px] partitura-card transition-all duration-300 ease-in-out">
        <div className="p-3 sm:p-4 text-left flex-1 flex flex-col">
          {/* Header con botón de favorito */}
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <h5 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex-1 mr-2 break-words">
              {partitura.compositor}
            </h5>
            <button
              onClick={() => toggleFavorito(partitura._id)}
              className={`p-1 rounded-full transition-colors flex-shrink-0 ${
                esFavorito 
                  ? 'text-amber-500 hover:text-amber-600' 
                  : 'text-slate-400 hover:text-amber-500'
              }`}
              title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill={esFavorito ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
          <p className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-400 break-words">
            {partitura.obra}
          </p>
          
          {/* Contenido expandible - se mantiene en la parte inferior */}
          <div className="mt-auto space-y-2">
            {/* Sección de partituras expandible */}
            {(partitura.partituraCello || partitura.partituraPiano) && (
              <details name="detalles" className="mb-2" onToggle={handleDetailsToggle}>
                <summary className="py-2 px-3 bg-indigo-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors font-medium text-gray-900 dark:text-white">
                  Partituras
                </summary>
                
                <div className="mt-1 space-y-2">
                  {partitura.partituraCello && (
                    <a
                      href={partitura.partituraCello}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between py-2 px-3 text-gray-900 dark:text-gray-300 hover:bg-indigo-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    >
                      <span className="text-sm font-medium">Violoncello</span>
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  )}
                  
                  {partitura.partituraPiano && (
                    <a
                      href={partitura.partituraPiano}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between py-2 px-3 text-gray-900 dark:text-gray-300 hover:bg-indigo-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    >
                      <span className="text-sm font-medium">Piano/Otro</span>
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  )}
                </div>
              </details>
            )}

            {/* Sección expandible de acompañamientos */}
            {partitura.movimientos && partitura.movimientos.length > 0 && (
              <details name="detalles" onToggle={handleDetailsToggle}>
                <summary className="py-2 px-3 bg-indigo-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors font-medium text-gray-900 dark:text-white">
                  Acompañamientos ({partitura.movimientos.length})
                </summary>
                
                <div className="mt-1 space-y-1">
                  {partitura.movimientos.map((movimiento, index) => (
                    <details key={index} name="movimientos" className="ml-4" onToggle={handleDetailsToggle}>
                      <summary className="py-2 px-3 bg-indigo-100 dark:bg-gray-600 rounded-md cursor-pointer hover:bg-indigo-200 dark:hover:bg-gray-500 transition-colors text-medium text-gray-800 dark:text-gray-200">
                        {movimiento.nombre}
                      </summary>
                      
                      {/* Subtítulo del tempo */}
                      {(movimiento.subtitulo || movimiento.descripcion || movimiento.duracion) && (
                        <p className="mt-1 mb-2 text-sm text-gray-600 dark:text-gray-400 px-3">
                          {movimiento.subtitulo || movimiento.descripcion || movimiento.duracion}
                        </p>
                      )}
                      
                      {/* Acompañamientos */}
                      {movimiento.audios && movimiento.audios.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2 px-3">
                          {movimiento.audios.map((audio, audioIndex) => (
                            <a
                              key={audioIndex}
                              href={audio.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-9 h-9 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 focus:ring-2 focus:outline-none focus:ring-indigo-300 transition-colors"
                            >
                              {audio.nombre}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic px-3">
                          {movimiento.descripcion || movimiento.duracion ? 
                            'Movimiento configurado (estructura heredada)' : 
                            'No hay acompañamientos disponibles'
                          }
                        </p>
                      )}
                    </details>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner 
        title="Cargando partituras..."
        subtitle="Obteniendo la colección de partituras musicales"
        showRenderMessage={true}
        size="large"
      />
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Partituras
          </h1>
        </div>
        
        {usuario?.isAdmin && (
          <div className="flex justify-center">
            <Link
              to="/admin-partituras"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:outline-none focus:ring-indigo-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Administrar Partituras
            </Link>
          </div>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6 flex justify-center">
        <div className="relative max-w-lg w-full">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Buscar por compositor, obra o movimiento..."
          />
        </div>
      </div>

      {/* Controles de filtrado */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMostrarSoloFavoritos(false)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              !mostrarSoloFavoritos
                ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l-7 7-7-7m14 18l-7-7-7 7" />
            </svg>
            Todas las partituras ({partituras.length})
          </button>
          
          <button
            onClick={() => setMostrarSoloFavoritos(true)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              mostrarSoloFavoritos
                ? 'bg-amber-400 text-amber-900 border-amber-400 hover:bg-amber-500'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill={mostrarSoloFavoritos ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Solo favoritas ({favoritos.size})
          </button>
          
          {/* Indicador de resultados */}
          <div className="flex items-center px-3 py-2 text-sm text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-gray-700 rounded-lg">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
            Mostrando: {partiturasFiltradas.length}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Grid de partituras */}
      {partiturasFiltradas.length > 0 ? (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4 sm:gap-6 items-start justify-center">
          {partiturasFiltradas.map((partitura) => (
            <PartituraCard key={partitura._id} partitura={partitura} />
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron partituras
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {busqueda ? 
              'Intenta con diferentes términos de búsqueda.' : 
              'No hay partituras disponibles en este momento.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default GestionPartituras;
