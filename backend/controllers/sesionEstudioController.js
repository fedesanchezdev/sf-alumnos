import SesionEstudio from '../models/SesionEstudio.js';
import { validationResult } from 'express-validator';
import { notificacionService } from '../services/notificacionService.js';

// Crear nueva sesión de estudio
export const crearSesionEstudio = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      compositor,
      obra,
      movimientoPieza,
      compasesEstudiados,
      bpmInicial
    } = req.body;

    const nuevaSesion = new SesionEstudio({
      usuario: req.usuario._id,
      compositor,
      obra,
      movimientoPieza: movimientoPieza || '',
      compasesEstudiados: compasesEstudiados || '',
      bpmInicial: bpmInicial || 120,
      bpmFinal: bpmInicial || 120
    });

    await nuevaSesion.save();

    res.status(201).json({
      success: true,
      message: 'Sesión de estudio iniciada exitosamente',
      sesion: nuevaSesion
    });

  } catch (error) {
    console.error('Error al crear sesión de estudio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener sesión activa del usuario
export const obtenerSesionActiva = async (req, res) => {
  try {
    const sesionActiva = await SesionEstudio.findOne({
      usuario: req.usuario._id,
      estado: { $in: ['activa', 'pausada'] }
    }).sort({ fechaInicio: -1 });

    res.json({
      success: true,
      sesion: sesionActiva
    });

  } catch (error) {
    console.error('Error al obtener sesión activa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar sesión (cambio de metrónomo, pausa, etc.)
export const actualizarSesion = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      bpm, 
      tiempoEstudioEnSegundos, 
      estado,
      movimientoPieza,
      compasesEstudiados,
      comentarios,
      metronomomUsado,
      bpmInicial,
      bpmFinal
    } = req.body;

    const sesion = await SesionEstudio.findOne({
      _id: id,
      usuario: req.usuario._id
    });

    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    // Si se proporciona un nuevo BPM, registrar el cambio
    if (bpm && tiempoEstudioEnSegundos !== undefined) {
      await sesion.agregarCambioMetronomo(bpm, tiempoEstudioEnSegundos);
    }

    // Actualizar otros campos si se proporcionan
    if (estado) sesion.estado = estado;
    if (movimientoPieza !== undefined) sesion.movimientoPieza = movimientoPieza;
    if (compasesEstudiados !== undefined) sesion.compasesEstudiados = compasesEstudiados;
    if (comentarios !== undefined) sesion.comentarios = comentarios;
    if (metronomomUsado !== undefined) sesion.metronomomUsado = metronomomUsado;
    if (bpmInicial !== undefined) sesion.bpmInicial = bpmInicial;
    if (bpmFinal !== undefined) sesion.bpmFinal = bpmFinal;

    await sesion.save();

    res.json({
      success: true,
      message: 'Sesión actualizada exitosamente',
      sesion
    });

  } catch (error) {
    console.error('Error al actualizar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Finalizar sesión de estudio
export const finalizarSesion = async (req, res) => {
  try {
    const { id } = req.params;
    const { tiempoTotalSegundos, comentarios, bpmFinal } = req.body;

    const sesion = await SesionEstudio.findOne({
      _id: id,
      usuario: req.usuario._id
    });

    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    if (sesion.estado === 'finalizada') {
      return res.status(400).json({
        success: false,
        message: 'La sesión ya está finalizada'
      });
    }

    // Actualizar BPM final si se proporciona
    if (bpmFinal) {
      sesion.bpmFinal = bpmFinal;
    }

    await sesion.finalizar(tiempoTotalSegundos, comentarios);

    res.json({
      success: true,
      message: 'Sesión finalizada exitosamente',
      sesion
    });

  } catch (error) {
    console.error('Error al finalizar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener historial de sesiones del usuario
export const obtenerHistorialSesiones = async (req, res) => {
  try {
    const { page = 1, limit = 20, compositor, obra, fechaDesde, fechaHasta } = req.query;
    
    const filtro = { usuario: req.usuario._id };
    
    if (compositor) filtro.compositor = new RegExp(compositor, 'i');
    if (obra) filtro.obra = new RegExp(obra, 'i');
    
    if (fechaDesde || fechaHasta) {
      filtro.fechaInicio = {};
      if (fechaDesde) {
        // Crear fecha en zona horaria local y luego convertir a UTC
        const fechaInicioDate = new Date(fechaDesde);
        // Ajustar para zona horaria local (UTC-3 para Argentina)
        fechaInicioDate.setUTCHours(3, 0, 0, 0); // 3 AM UTC = 00:00 ART
        filtro.fechaInicio.$gte = fechaInicioDate;
        console.log('🔍 Filtro fechaDesde:', fechaInicioDate);
      }
      if (fechaHasta) {
        const fechaFinalDate = new Date(fechaHasta);
        // Hasta las 02:59:59 UTC del día siguiente (23:59:59 ART)
        fechaFinalDate.setUTCHours(26, 59, 59, 999); // 02:59:59 UTC del día siguiente = 23:59:59 ART
        filtro.fechaInicio.$lte = fechaFinalDate;
        console.log('🔍 Filtro fechaHasta:', fechaFinalDate);
      }
    }

    console.log('🔍 Filtro completo:', JSON.stringify(filtro, null, 2));

    const sesiones = await SesionEstudio.find(filtro)
      .sort({ fechaInicio: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    console.log('📊 Sesiones encontradas:', sesiones.length);
    if (sesiones.length > 0) {
      console.log('📅 Primera sesión:', {
        fecha: sesiones[0].fechaInicio,
        compositor: sesiones[0].compositor,
        obra: sesiones[0].obra
      });
    }

    const total = await SesionEstudio.countDocuments(filtro);

    res.json({
      success: true,
      sesiones,
      paginacion: {
        paginaActual: parseInt(page),
        totalPaginas: Math.ceil(total / limit),
        totalSesiones: total,
        sesionesPorPagina: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de estudio
export const obtenerEstadisticas = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, compositor, obra } = req.query;

    const estadisticas = await SesionEstudio.obtenerEstadisticasUsuario(
      req.usuario._id,
      fechaDesde,
      fechaHasta,
      compositor,
      obra
    );

    // Calcular totales generales
    const totales = await SesionEstudio.aggregate([
      { 
        $match: { 
          usuario: req.usuario._id,
          ...(compositor && { compositor: new RegExp(compositor, 'i') }),
          ...(obra && { obra: new RegExp(obra, 'i') }),
          ...(fechaDesde || fechaHasta ? {
            fechaInicio: {
              ...(fechaDesde && { 
                $gte: (() => {
                  const fecha = new Date(fechaDesde);
                  fecha.setHours(0, 0, 0, 0);
                  return fecha;
                })()
              }),
              ...(fechaHasta && { 
                $lte: (() => {
                  const fecha = new Date(fechaHasta);
                  fecha.setHours(23, 59, 59, 999);
                  return fecha;
                })()
              })
            }
          } : {})
        }
      },
      {
        $group: {
          _id: null,
          totalSesiones: { $sum: 1 },
          tiempoTotalSegundos: { $sum: '$tiempoTotalSegundos' },
          bpmPromedio: { $avg: '$bpmFinal' }
        }
      }
    ]);

    const totalGeneral = totales[0] || {
      totalSesiones: 0,
      tiempoTotalSegundos: 0,
      bpmPromedio: 0
    };

    res.json({
      success: true,
      estadisticas,
      resumen: {
        totalSesiones: totalGeneral.totalSesiones,
        tiempoTotalHoras: Math.round((totalGeneral.tiempoTotalSegundos / 3600) * 10) / 10,
        bpmPromedio: Math.round(totalGeneral.bpmPromedio || 0)
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener obras únicas para el selector
export const obtenerObrasUsuario = async (req, res) => {
  try {
    const obras = await SesionEstudio.aggregate([
      { $match: { usuario: req.usuario._id } },
      {
        $group: {
          _id: {
            compositor: '$compositor',
            obra: '$obra'
          },
          ultimaSesion: { $max: '$fechaInicio' },
          totalSesiones: { $sum: 1 }
        }
      },
      {
        $project: {
          compositor: '$_id.compositor',
          obra: '$_id.obra',
          ultimaSesion: 1,
          totalSesiones: 1,
          _id: 0
        }
      },
      { $sort: { ultimaSesion: -1 } }
    ]);

    res.json({
      success: true,
      obras
    });

  } catch (error) {
    console.error('Error al obtener obras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener sesión específica por ID
export const obtenerSesionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sesion = await SesionEstudio.findOne({
      _id: id,
      usuario: req.usuario._id
    });

    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    res.json({
      success: true,
      sesion
    });

  } catch (error) {
    console.error('Error al obtener sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Editar sesión
export const editarSesion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const datosActualizacion = req.body;

    const sesion = await SesionEstudio.findOne({
      _id: id,
      usuario: req.usuario._id
    });

    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    // No permitir editar sesiones activas
    if (sesion.estado === 'activa') {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una sesión activa'
      });
    }

    // Actualizar campos
    Object.keys(datosActualizacion).forEach(key => {
      if (datosActualizacion[key] !== undefined) {
        sesion[key] = datosActualizacion[key];
      }
    });

    sesion.fechaActualizacion = new Date();
    await sesion.save();

    res.json({
      success: true,
      message: 'Sesión actualizada exitosamente',
      sesion
    });

  } catch (error) {
    console.error('Error al editar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar sesión
export const eliminarSesion = async (req, res) => {
  try {
    const { id } = req.params;

    const sesion = await SesionEstudio.findOne({
      _id: id,
      usuario: req.usuario._id
    });

    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    // No permitir eliminar sesiones activas
    if (sesion.estado === 'activa') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una sesión activa'
      });
    }

    await SesionEstudio.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Sesión eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Compartir sesión con el profesor
export const compartirSesionConProfesor = async (req, res) => {
  try {
    const { id } = req.params;
    const { compartir, comentarioAlumno } = req.body;

    console.log('🔄 Intentando compartir sesión:', {
      sessionId: id,
      userId: req.usuario._id,
      compartir,
      comentarioAlumno
    });

    const sesion = await SesionEstudio.findOne({
      _id: id,
      usuario: req.usuario._id
    });

    if (!sesion) {
      console.log('❌ Sesión no encontrada para:', { id, usuario: req.usuario._id });
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    console.log('📋 Sesión encontrada:', {
      id: sesion._id,
      estado: sesion.estado,
      compartidaAntes: sesion.compartidaConProfesor
    });

    if (sesion.estado !== 'finalizada') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden compartir sesiones finalizadas'
      });
    }

    // Actualizar estado de compartir
    sesion.compartidaConProfesor = compartir;
    if (compartir) {
      sesion.fechaCompartida = new Date();
      // Si el alumno agregó un comentario, actualizar los comentarios
      if (comentarioAlumno && comentarioAlumno.trim()) {
        sesion.comentarios = comentarioAlumno.trim();
      }
    } else {
      sesion.fechaCompartida = null;
    }

    await sesion.save();

    // Crear notificación si se está compartiendo la sesión
    if (compartir) {
      // Poblar los datos del usuario para la notificación
      await sesion.populate('usuario', 'nombre apellido');
      await notificacionService.crearNotificacionSesionCompartida(sesion);
    }

    console.log('✅ Sesión actualizada:', {
      id: sesion._id,
      compartidaConProfesor: sesion.compartidaConProfesor,
      fechaCompartida: sesion.fechaCompartida
    });

    res.json({
      success: true,
      message: compartir ? 'Sesión compartida con el profesor' : 'Sesión marcada como privada',
      sesion
    });

  } catch (error) {
    console.error('Error al compartir sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ENDPOINT TEMPORAL PARA CREAR SESIÓN DE PRUEBA COMPARTIDA
export const crearSesionPrueba = async (req, res) => {
  try {
    // Buscar una sesión existente de Lorena para marcarla como compartida
    const sesion = await SesionEstudio.findOne({
      usuario: '686d1f20a1a2e2dd3ecf3767', // ID de Lorena
      estado: 'finalizada'
    });
    
    if (sesion) {
      sesion.compartidaConProfesor = true;
      sesion.fechaCompartida = new Date();
      sesion.comentarios = 'Sesión compartida para prueba del sistema';
      await sesion.save();
      
      console.log('✅ Sesión marcada como compartida:', sesion._id);
      
      res.json({
        success: true,
        message: 'Sesión marcada como compartida para prueba',
        sesion: {
          id: sesion._id,
          compositor: sesion.compositor,
          obra: sesion.obra,
          compartidaConProfesor: sesion.compartidaConProfesor
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No se encontró ninguna sesión de Lorena para marcar como compartida'
      });
    }
  } catch (error) {
    console.error('Error al crear sesión de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear sesión de prueba'
    });
  }
};

// Obtener sesiones compartidas (para profesores)
export const obtenerSesionesCompartidas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      compositor,
      obra,
      fechaDesde,
      fechaHasta,
      alumno
    } = req.query;

    // Verificar que el usuario sea profesor/admin
    if (req.usuario.rol !== 'profesor' && req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver sesiones de alumnos'
      });
    }

    const filtros = {
      compartidaConProfesor: true
    };

    // Aplicar filtros si existen
    if (compositor) {
      filtros.compositor = { $regex: compositor, $options: 'i' };
    }

    if (obra) {
      filtros.obra = { $regex: obra, $options: 'i' };
    }

    if (fechaDesde || fechaHasta) {
      filtros.fechaInicio = {};
      if (fechaDesde) {
        filtros.fechaInicio.$gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const fechaHastaFin = new Date(fechaHasta);
        fechaHastaFin.setHours(23, 59, 59, 999);
        filtros.fechaInicio.$lte = fechaHastaFin;
      }
    }

    // Filtro por alumno específico (buscar por nombre)
    if (alumno) {
      // Buscar usuarios cuyo nombre coincida con el texto
      const Usuario = (await import('../models/Usuario.js')).default;
      const usuariosCoincidentes = await Usuario.find({
        $or: [
          { nombre: { $regex: alumno, $options: 'i' } },
          { apellido: { $regex: alumno, $options: 'i' } }
        ]
      }).select('_id');
      
      if (usuariosCoincidentes.length > 0) {
        filtros.usuario = { $in: usuariosCoincidentes.map(u => u._id) };
      } else {
        // Si no hay usuarios que coincidan, buscar por ID inexistente para no devolver nada
        filtros.usuario = null;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('🔍 Búsqueda de sesiones compartidas:', {
      filtros,
      page,
      limit,
      skip
    });

    // Debug: Ver todas las sesiones en la base de datos
    const todasLasSesiones = await SesionEstudio.find({}).select('compartidaConProfesor fechaCompartida compositor obra usuario estado').limit(5);
    console.log('🗃️ Sesiones en BD (muestra):', todasLasSesiones.map(s => ({
      id: s._id,
      compositor: s.compositor,
      obra: s.obra,
      usuario: s.usuario,
      estado: s.estado,
      compartidaConProfesor: s.compartidaConProfesor,
      fechaCompartida: s.fechaCompartida
    })));

    const sesiones = await SesionEstudio.find(filtros)
      .populate('usuario', 'nombre apellido email')
      .sort({ fechaCompartida: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SesionEstudio.countDocuments(filtros);
    
    console.log('📊 Resultado búsqueda:', {
      sesionesEncontradas: sesiones.length,
      totalDocumentos: total,
      primeraSession: sesiones[0] ? {
        id: sesiones[0]._id,
        compositor: sesiones[0].compositor,
        obra: sesiones[0].obra,
        compartidaConProfesor: sesiones[0].compartidaConProfesor,
        fechaCompartida: sesiones[0].fechaCompartida
      } : 'ninguna'
    });

    const totalPaginas = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      sesiones,
      paginacion: {
        paginaActual: parseInt(page),
        totalPaginas,
        totalSesiones: total,
        limite: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener sesiones compartidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Agregar comentario del profesor a una sesión compartida
export const agregarComentarioProfesor = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarioProfesor } = req.body;

    // Verificar que el usuario sea profesor/admin
    if (req.usuario.rol !== 'profesor' && req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para comentar sesiones'
      });
    }

    const sesion = await SesionEstudio.findOne({
      _id: id,
      compartidaConProfesor: true
    }).populate('usuario', 'nombre apellido');

    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada o no está compartida'
      });
    }

    // Agregar el nuevo comentario a los comentarios existentes
    const comentariosExistentes = sesion.comentariosProfesor || '';
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (comentariosExistentes) {
      sesion.comentariosProfesor = `${comentariosExistentes}\n\n--- ${fechaActual} ---\n${comentarioProfesor}`;
    } else {
      sesion.comentariosProfesor = comentarioProfesor;
    }
    
    await sesion.save();

    // Crear notificación para el alumno
    if (comentarioProfesor && comentarioProfesor.trim()) {
      await notificacionService.crearNotificacionComentarioProfesor(sesion, comentarioProfesor);
    }

    res.json({
      success: true,
      message: 'Comentario agregado exitosamente',
      sesion
    });

  } catch (error) {
    console.error('Error al agregar comentario del profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
