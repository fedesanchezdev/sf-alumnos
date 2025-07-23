import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { sesionEstudioService } from '../../services/sesionEstudioService';
import partituraService from '../../services/partituraService';
import { toast } from 'react-hot-toast';
import ModalCompartirSesion from './ModalCompartirSesion';

const SesionEstudio = () => {
  // Estados principales
  const [sesionActiva, setSesionActiva] = useState(null);
  const [timerEstado, setTimerEstado] = useState('detenido'); // 'detenido', 'corriendo', 'pausado'
  const [tiempoSegundos, setTiempoSegundos] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [metronomoActivo, setMetronomoActivo] = useState(false);
  
  // Estados del formulario
  const [compositor, setCompositor] = useState('');
  const [obra, setObra] = useState('');
  const [movimientoPieza, setMovimientoPieza] = useState('');
  const [compasesEstudiados, setCompasesEstudiados] = useState('');
  const [comentarios, setComentarios] = useState('');
  
  // Estados para nuevos elementos
  const [nuevoCompositor, setNuevoCompositor] = useState('');
  const [nuevaObra, setNuevaObra] = useState('');
  
  // Estados para selectores
  const [partiturasDisponibles, setPartiturasDisponibles] = useState([]);
  const [compositoresUnicos, setCompositoresUnicos] = useState([]);
  const [obrasDelCompositor, setObrasDelCompositor] = useState([]);
  
  // Estados para el modal de compartir
  const [modalCompartirAbierto, setModalCompartirAbierto] = useState(false);
  const [sesionParaCompartir, setSesionParaCompartir] = useState(null);
  
  // Referencias
  const intervalTimer = useRef(null);
  const intervalMetronomo = useRef(null);
  const audioContext = useRef(null);
  const bpmAnterior = useRef(120);
  const timeoutBpm = useRef(null);
  const fechaPausa = useRef(null);

  // Efectos
  useEffect(() => {
    cargarSesionActiva();
    cargarPartiturasDisponibles();
    inicializarAudioContext();
    
    return () => {
      if (intervalTimer.current) clearInterval(intervalTimer.current);
      if (intervalMetronomo.current) clearInterval(intervalMetronomo.current);
      if (timeoutBpm.current) clearTimeout(timeoutBpm.current);
    };
  }, []);

  // Efecto para prevenir que la página se duerma durante sesiones activas
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && timerEstado === 'corriendo') {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('🔒 Wake Lock activado - La pantalla no se apagará durante la sesión');
        }
      } catch (error) {
        console.log('Wake Lock no disponible o falló:', error);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release();
          wakeLock = null;
          console.log('🔓 Wake Lock liberado');
        } catch (error) {
          console.log('Error al liberar Wake Lock:', error);
        }
      }
    };

    // Solicitar wake lock cuando inicia sesión
    if (timerEstado === 'corriendo') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Manejar cuando la página se vuelve visible después de estar oculta
    const handleVisibilityChange = () => {
      if (!document.hidden && timerEstado === 'corriendo') {
        // Cuando la página vuelve a ser visible y hay sesión activa
        console.log('👁️ Página visible - Sesión continúa activa');
        // Re-solicitar wake lock si se perdió
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [timerEstado]); // Solo depende del estado del timer

  useEffect(() => {
    // Extraer compositores únicos cuando cambien las partituras disponibles
    const compositores = [...new Set(partiturasDisponibles.map(p => p.compositor))];
    setCompositoresUnicos(compositores);
  }, [partiturasDisponibles]);

  useEffect(() => {
    // Filtrar obras del compositor seleccionado
    if (compositor) {
      const obras = partiturasDisponibles
        .filter(p => p.compositor === compositor)
        .map(p => p.obra || p.titulo); // Usar 'obra' como principal, 'titulo' como fallback
      setObrasDelCompositor([...new Set(obras)]);
    } else {
      setObrasDelCompositor([]);
    }
  }, [compositor, partiturasDisponibles]);

  // Funciones de carga
  const cargarSesionActiva = async () => {
    try {
      const response = await sesionEstudioService.obtenerSesionActiva();
      if (response.success && response.sesion) {
        const sesion = response.sesion;
        setSesionActiva(sesion);
        setCompositor(sesion.compositor);
        setObra(sesion.obra);
        setMovimientoPieza(sesion.movimientoPieza || '');
        setCompasesEstudiados(sesion.compasesEstudiados || '');
        setComentarios(sesion.comentarios || '');
        setBpm(sesion.bpmFinal || sesion.bpmInicial || 120);
        
        // Si la sesión está activa, calcular tiempo transcurrido
        if (sesion.estado === 'activa') {
          const tiempoTranscurrido = Math.floor((new Date() - new Date(sesion.fechaInicio)) / 1000);
          setTiempoSegundos(tiempoTranscurrido);
          setTimerEstado('corriendo');
          iniciarTimer();
        } else if (sesion.estado === 'pausada') {
          setTiempoSegundos(sesion.tiempoTotalSegundos || 0);
          setTimerEstado('pausado');
        }
      }
    } catch (error) {
      console.error('Error al cargar sesión activa:', error);
    }
  };

  const cargarPartiturasDisponibles = async () => {
    try {
      const response = await partituraService.obtenerPartituras();
      
      // Manejar diferentes formatos de respuesta
      let partituras = [];
      if (response && response.success && response.partituras) {
        // Formato con success
        partituras = response.partituras;
      } else if (Array.isArray(response)) {
        // Formato directo (array)
        partituras = response;
      } else if (response && Array.isArray(response.data)) {
        // Formato con data
        partituras = response.data;
      }
      
      if (partituras && partituras.length > 0) {
        setPartiturasDisponibles(partituras);
        return;
      }
      
      throw new Error('No se encontraron partituras');
      
    } catch (error) {
      console.error('Error al cargar partituras desde API:', error);
      // Datos de ejemplo como respaldo
      const partiturasEjemplo = [
        { compositor: 'Johann Sebastian Bach', obra: 'Invención No. 1 en Do Mayor', dificultad: 'Intermedio' },
        { compositor: 'Johann Sebastian Bach', obra: 'Invención No. 4 en Re menor', dificultad: 'Intermedio' },
        { compositor: 'Johann Sebastian Bach', obra: 'Concierto para Violín en La menor', dificultad: 'Avanzado' },
        { compositor: 'Wolfgang Amadeus Mozart', obra: 'Sonata No. 11 en La Mayor', dificultad: 'Avanzado' },
        { compositor: 'Wolfgang Amadeus Mozart', obra: 'Concierto para Violín No. 3', dificultad: 'Avanzado' },
        { compositor: 'Ludwig van Beethoven', obra: 'Sonata para Violín No. 9 "Kreutzer"', dificultad: 'Muy Avanzado' },
        { compositor: 'Ludwig van Beethoven', obra: 'Concierto para Violín en Re Mayor', dificultad: 'Muy Avanzado' },
        { compositor: 'Antonio Vivaldi', obra: 'Las Cuatro Estaciones - Primavera', dificultad: 'Intermedio' },
        { compositor: 'Antonio Vivaldi', obra: 'Concierto en Sol menor RV 315', dificultad: 'Avanzado' },
        { compositor: 'Frédéric Chopin', obra: 'Nocturno en Mi bemol Mayor', dificultad: 'Intermedio' },
        { compositor: 'Frédéric Chopin', obra: 'Balada No. 1 en Sol menor', dificultad: 'Muy Avanzado' },
        { compositor: 'Niccolo Paganini', obra: 'Capricho No. 24', dificultad: 'Muy Avanzado' },
        { compositor: 'Johannes Brahms', obra: 'Sonata para Violín No. 1', dificultad: 'Avanzado' },
        { compositor: 'Pyotr Ilyich Tchaikovsky', obra: 'Concierto para Violín en Re Mayor', dificultad: 'Muy Avanzado' },
        { compositor: 'Felix Mendelssohn', obra: 'Concierto para Violín en Mi menor', dificultad: 'Avanzado' }
      ];
      setPartiturasDisponibles(partiturasEjemplo);
    }
  };

  // Audio Context para metrónomo
  const inicializarAudioContext = () => {
    try {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API no disponible:', error);
    }
  };

  const reproducirClick = () => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + 0.1);
  };

  // Funciones del timer
  const iniciarTimer = () => {
    if (intervalTimer.current) clearInterval(intervalTimer.current);
    
    // Usar setInterval con manejo de errores para background
    intervalTimer.current = setInterval(() => {
      try {
        setTiempoSegundos(prev => {
          const nuevoTiempo = prev + 1;
          // Log cada minuto para debug
          if (nuevoTiempo % 60 === 0) {
            console.log(`⏱️ Timer: ${Math.floor(nuevoTiempo / 60)} minutos transcurridos`);
          }
          return nuevoTiempo;
        });
      } catch (error) {
        console.error('Error en timer:', error);
      }
    }, 1000);
    
    console.log('▶️ Timer iniciado');
  };

  const detenerTimer = () => {
    if (intervalTimer.current) {
      clearInterval(intervalTimer.current);
      intervalTimer.current = null;
      console.log('⏹️ Timer detenido');
    }
  };

  // Funciones del metrónomo
  const toggleMetronomo = () => {
    if (metronomoActivo) {
      detenerMetronomo();
    } else {
      iniciarMetronomo();
    }
  };

  const iniciarMetronomo = async () => {
    if (!audioContext.current) {
      toast.error('Audio no disponible en este navegador');
      return;
    }

    // Asegurar que el contexto de audio esté en estado 'running'
    if (audioContext.current.state !== 'running') {
      try {
        await audioContext.current.resume();
        console.log('🔊 Contexto de audio reanudado');
      } catch (error) {
        console.error('Error al reanudar contexto de audio:', error);
      }
    }

    const intervalo = 60000 / bpm; // ms por beat
    
    setMetronomoActivo(true);
    reproducirClick(); // Click inmediato
    
    // Usar setInterval con configuraciones para background
    intervalMetronomo.current = setInterval(() => {
      try {
        reproducirClick();
      } catch (error) {
        console.error('Error en click del metrónomo:', error);
      }
    }, intervalo);

    console.log(`🎵 Metrónomo iniciado a ${bpm} BPM (intervalo: ${intervalo}ms)`);

    // Registrar que se está usando el metrónomo y establecer BPM inicial si es la primera vez
    if (sesionActiva && !sesionActiva.metronomomUsado) {
      try {
        await sesionEstudioService.actualizarSesion(sesionActiva._id, {
          metronomomUsado: true,
          bpmInicial: bpm,
          bpmFinal: bpm
        });
        // Actualizar estado local
        setSesionActiva(prev => ({
          ...prev,
          metronomomUsado: true,
          bpmInicial: bpm,
          bpmFinal: bpm
        }));
        bpmAnterior.current = bpm;
      } catch (error) {
        console.error('Error al marcar metrónomo como usado:', error);
      }
    }
  };

  const detenerMetronomo = () => {
    if (intervalMetronomo.current) {
      clearInterval(intervalMetronomo.current);
      intervalMetronomo.current = null;
      console.log('🔇 Metrónomo detenido');
    }
    setMetronomoActivo(false);
  };

  // Función para registrar cambio de BPM (solo si el metrónomo está activo)
  const registrarCambioBpm = async (nuevoBpm) => {
    if (sesionActiva && nuevoBpm !== bpmAnterior.current && metronomoActivo) {
      try {
        await sesionEstudioService.actualizarSesion(sesionActiva._id, {
          bpm: nuevoBpm,
          tiempoEstudioEnSegundos: tiempoSegundos
        });
        bpmAnterior.current = nuevoBpm;
      } catch (error) {
        console.error('Error al registrar cambio de BPM:', error);
      }
    }
  };

  // Función para registrar cambio de BPM con delay de 5 segundos
  const registrarCambioBpmConDelay = (nuevoBpm) => {
    // Limpiar timeout anterior si existe
    if (timeoutBpm.current) {
      clearTimeout(timeoutBpm.current);
    }

    // Registrar si el metrónomo está activo y hay sesión (incluso si está pausada)
    if (sesionActiva && metronomoActivo) {
      timeoutBpm.current = setTimeout(() => {
        registrarCambioBpm(nuevoBpm);
      }, 5000); // 5 segundos
    }
  };

  // Handlers de BPM
  const cambiarBpm = (incremento) => {
    const nuevoBpm = Math.max(40, Math.min(300, bpm + incremento));
    setBpm(nuevoBpm);
    
    // Si el metrónomo está activo, reiniciarlo con el nuevo BPM
    if (metronomoActivo) {
      detenerMetronomo();
      setTimeout(() => {
        setBpm(nuevoBpm);
        iniciarMetronomo();
      }, 100);
      
      // Registrar cambio con delay de 5 segundos
      registrarCambioBpmConDelay(nuevoBpm);
    }
  };

  // Handlers del estudio
  const iniciarSesion = async () => {
    if (!compositor || !obra) {
      toast.error('Debes seleccionar compositor y obra');
      return;
    }

    try {
      const response = await sesionEstudioService.crearSesion({
        compositor,
        obra,
        movimientoPieza,
        compasesEstudiados
        // No enviamos bpmInicial aquí, se establecerá cuando se active el metrónomo
      });

      if (response.success) {
        setSesionActiva(response.sesion);
        setTiempoSegundos(0);
        setTimerEstado('corriendo');
        iniciarTimer();
        toast.success('Sesión de estudio iniciada');
        
        // Mensaje informativo sobre continuidad
        setTimeout(() => {
          toast('📱 La sesión continuará aunque se bloquee la pantalla', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#3B82F6',
              color: 'white',
            }
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast.error('Error al iniciar la sesión');
    }
  };

  const pausarSesion = async () => {
    try {
      detenerTimer();
      setTimerEstado('pausado');
      fechaPausa.current = new Date();
      
      if (sesionActiva) {
        await sesionEstudioService.actualizarSesion(sesionActiva._id, {
          estado: 'pausada',
          movimientoPieza,
          compasesEstudiados,
          comentarios
        });
      }
      
      toast.success('Sesión pausada');
    } catch (error) {
      console.error('Error al pausar sesión:', error);
      toast.error('Error al pausar la sesión');
    }
  };

  const reanudarSesion = async () => {
    try {
      setTimerEstado('corriendo');
      iniciarTimer();
      fechaPausa.current = null;
      
      if (sesionActiva) {
        await sesionEstudioService.actualizarSesion(sesionActiva._id, {
          estado: 'activa'
        });
      }
      
      toast.success('Sesión reanudada');
    } catch (error) {
      console.error('Error al reanudar sesión:', error);
      toast.error('Error al reanudar la sesión');
    }
  };

  const finalizarSesion = async () => {
    if (!sesionActiva) return;

    try {
      detenerTimer();
      detenerMetronomo();
      
      // Limpiar timeout de BPM si existe
      if (timeoutBpm.current) {
        clearTimeout(timeoutBpm.current);
      }
      
      const response = await sesionEstudioService.finalizarSesion(sesionActiva._id, {
        tiempoTotalSegundos: tiempoSegundos,
        comentarios,
        bpmFinal: bpm
      });

      if (response.success) {
        // Preparar datos para el modal de compartir
        const datosResumen = {
          ...sesionActiva,
          tiempoTotalSegundos: tiempoSegundos,
          comentarios,
          bpmFinal: bpm,
          compositor,
          obra,
          movimientoPieza,
          compasesEstudiados
        };

        setSesionParaCompartir(datosResumen);
        setModalCompartirAbierto(true);
      }

    } catch (error) {
      console.error('Error al finalizar sesión:', error);
      toast.error('Error al finalizar la sesión');
    }
  };

  // Estado para rastrear si ya se tomó una decisión
  const [decisionTomada, setDecisionTomada] = useState(false);

  // Función para manejar la decisión de compartir
  const handleCompartirSesion = async (compartir, comentarioAlumno = '') => {
    if (decisionTomada) return; // Evitar múltiples llamadas
    
    setDecisionTomada(true);
    
    try {
      const response = await sesionEstudioService.compartirSesionConProfesor(
        sesionActiva._id, 
        compartir, 
        comentarioAlumno
      );

      if (response.success) {
        if (compartir) {
          toast.success('✅ Sesión compartida con tu profesor');
        } else {
          toast('🔒 Sesión marcada como privada', {
            icon: '🔒',
            style: {
              background: '#6B7280',
              color: 'white',
            }
          });
        }

        // Cerrar modal y resetear estado después de un pequeño delay
        // para permitir que el backend procese la actualización
        setTimeout(() => {
          resetearEstado();
        }, 1000);
      }
    } catch (error) {
      console.error('Error al compartir sesión:', error);
      toast.error('Error al procesar tu decisión');
      setDecisionTomada(false); // Permitir reintentar en caso de error
    }
  };

  // Función para cerrar modal sin tomar decisión
  const cerrarModalSinDecision = () => {
    if (!decisionTomada) {
      // Solo si no se ha tomado una decisión, marcar como privado
      handleCompartirSesion(false);
    } else {
      // Si ya se tomó una decisión, solo cerrar el modal
      setModalCompartirAbierto(false);
      setSesionParaCompartir(null);
    }
  };

  // Función para resetear el estado después de finalizar
  const resetearEstado = () => {
    setSesionActiva(null);
    setTimerEstado('detenido');
    setTiempoSegundos(0);
    setCompositor('');
    setObra('');
    setMovimientoPieza('');
    setCompasesEstudiados('');
    setComentarios('');
    setNuevoCompositor('');
    setNuevaObra('');
    setBpm(120);
    fechaPausa.current = null;
    setSesionParaCompartir(null);
    setModalCompartirAbierto(false);
    setDecisionTomada(false); // Resetear flag de decisión

    toast.success('Sesión finalizada exitosamente');
  };

  // Formatear tiempo mejorado
  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const secs = segundos % 60;
    
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Sesión de Estudio</h1>
        
        {/* Panel Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Configuración de la Sesión */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuración</h2>
            
            {/* Selector de Compositor */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compositor
              </label>
              <select
                value={compositor}
                onChange={(e) => {
                  setCompositor(e.target.value);
                  if (e.target.value !== 'nuevo') {
                    setNuevoCompositor('');
                  }
                }}
                disabled={sesionActiva}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Seleccionar compositor...</option>
                {compositoresUnicos.map((comp, index) => (
                  <option key={index} value={comp}>{comp}</option>
                ))}
                <option value="nuevo">+ Agregar nuevo compositor</option>
              </select>
              {compositor === 'nuevo' && (
                <input
                  type="text"
                  value={nuevoCompositor}
                  placeholder="Nombre del compositor"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setNuevoCompositor(e.target.value)}
                  onBlur={() => {
                    if (nuevoCompositor.trim()) {
                      setCompositor(nuevoCompositor.trim());
                      setNuevoCompositor('');
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && nuevoCompositor.trim()) {
                      setCompositor(nuevoCompositor.trim());
                      setNuevoCompositor('');
                    }
                  }}
                />
              )}
            </div>

            {/* Selector de Obra */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obra
              </label>
              <select
                value={obra}
                onChange={(e) => {
                  setObra(e.target.value);
                  if (e.target.value !== 'nueva') {
                    setNuevaObra('');
                  }
                }}
                disabled={sesionActiva || !compositor}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Seleccionar obra...</option>
                {obrasDelCompositor.map((obraItem, index) => (
                  <option key={index} value={obraItem}>{obraItem}</option>
                ))}
                <option value="nueva">+ Agregar nueva obra</option>
              </select>
              {obra === 'nueva' && (
                <input
                  type="text"
                  value={nuevaObra}
                  placeholder="Nombre de la obra"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setNuevaObra(e.target.value)}
                  onBlur={() => {
                    if (nuevaObra.trim()) {
                      setObra(nuevaObra.trim());
                      setNuevaObra('');
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && nuevaObra.trim()) {
                      setObra(nuevaObra.trim());
                      setNuevaObra('');
                    }
                  }}
                />
              )}
            </div>

            {/* Movimiento/Pieza */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Movimiento/Pieza
              </label>
              <input
                type="text"
                value={movimientoPieza}
                onChange={(e) => setMovimientoPieza(e.target.value)}
                placeholder="Ej: I. Allegro, Pieza No. 1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Compases */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compases Estudiados
              </label>
              <input
                type="text"
                value={compasesEstudiados}
                onChange={(e) => setCompasesEstudiados(e.target.value)}
                placeholder="Ej: 1-16, 25-32"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Comentarios */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios
              </label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Notas sobre la sesión, dificultades, logros..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Timer y Controles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Timer y Controles</h2>
            
            {/* Display del Timer */}
            <div className="text-center mb-6">
              <div className="text-6xl font-mono font-bold text-blue-600 mb-2">
                {formatearTiempo(tiempoSegundos)}
              </div>
              <div className="text-sm text-gray-500">
                {timerEstado === 'corriendo' && 'Estudiando...'}
                {timerEstado === 'pausado' && 'En pausa'}
                {timerEstado === 'detenido' && 'Listo para comenzar'}
              </div>
            </div>

            {/* Controles del Timer */}
            <div className="flex justify-center space-x-4 mb-6">
              {!sesionActiva ? (
                <button
                  onClick={iniciarSesion}
                  disabled={!compositor || !obra}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Play size={20} />
                  <span>Iniciar Sesión</span>
                </button>
              ) : (
                <>
                  {timerEstado === 'corriendo' ? (
                    <button
                      onClick={pausarSesion}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Pause size={20} />
                      <span>Pausar</span>
                    </button>
                  ) : (
                    <button
                      onClick={reanudarSesion}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Play size={20} />
                      <span>Reanudar</span>
                    </button>
                  )}
                  
                  <button
                    onClick={finalizarSesion}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Square size={20} />
                    <span>Finalizar</span>
                  </button>
                </>
              )}
            </div>

            {/* Metrónomo */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Metrónomo</h3>
              
              {/* BPM Display y Controles */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => cambiarBpm(-10)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded transition-colors"
                >
                  -10
                </button>
                <button
                  onClick={() => cambiarBpm(-1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded transition-colors"
                >
                  -1
                </button>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{bpm}</div>
                  <div className="text-sm text-gray-500">BPM</div>
                </div>
                
                <button
                  onClick={() => cambiarBpm(1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded transition-colors"
                >
                  +1
                </button>
                <button
                  onClick={() => cambiarBpm(10)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded transition-colors"
                >
                  +10
                </button>
              </div>

              {/* Control del Metrónomo */}
              <div className="flex justify-center">
                <button
                  onClick={toggleMetronomo}
                  className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors ${
                    metronomoActivo
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {metronomoActivo ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  <span>{metronomoActivo ? 'Detener' : 'Iniciar'} Metrónomo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Información de la Sesión Actual */}
        {sesionActiva && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Sesión Actual</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Obra:</span>
                <div className="text-blue-600">{sesionActiva.compositor} - {sesionActiva.obra}</div>
              </div>
              <div>
                <span className="font-medium text-blue-700">
                  {timerEstado === 'pausado' ? 'Pausada:' : 'Iniciada:'}
                </span>
                <div className="text-blue-600">
                  {timerEstado === 'pausado' && fechaPausa.current
                    ? fechaPausa.current.toLocaleString()
                    : new Date(sesionActiva.fechaInicio).toLocaleString()
                  }
                </div>
              </div>
              <div>
                <span className="font-medium text-blue-700">
                  {metronomoActivo ? 'BPM Actual:' : 'Metrónomo:'}
                </span>
                <div className="text-blue-600">
                  {metronomoActivo 
                    ? `${bpm} BPM` 
                    : sesionActiva.metronomomUsado 
                      ? `${sesionActiva.bpmFinal || sesionActiva.bpmInicial} BPM (detenido)`
                      : 'Sin usar'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para compartir sesión */}
      <ModalCompartirSesion
        isOpen={modalCompartirAbierto}
        onClose={cerrarModalSinDecision}
        onCompartir={handleCompartirSesion}
        datosResumen={sesionParaCompartir}
      />
    </div>
  );
};

export default SesionEstudio;
