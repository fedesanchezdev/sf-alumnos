import Estudio from '../models/Estudio.js';
import Usuario from '../models/Usuario.js';
import Partitura from '../models/Partitura.js';

// Función helper para ajustar fechas y evitar problemas de zona horaria
const ajustarFecha = (fecha) => {
  // Si la fecha viene como string (ej: "2025-07-03"), la interpretamos como fecha local
  if (typeof fecha === 'string') {
    // Agregamos 'T12:00:00.000Z' para establecer mediodía UTC
    // Esto asegura que la fecha se mantenga correcta independientemente de la zona horaria
    const fechaConHora = fecha.includes('T') ? fecha : fecha + 'T12:00:00.000Z';
    return new Date(fechaConHora);
  }
  
  // Si ya es un objeto Date, establecer mediodía local
  const fechaAjustada = new Date(fecha);
  fechaAjustada.setHours(12, 0, 0, 0);
  return fechaAjustada;
};

// Obtener todos los estudios (admin) o estudios del usuario
const obtenerEstudios = async (req, res) => {
  try {
    const { usuario: currentUser } = req;
    const { usuarioId, estado, page = 1, limit = 20 } = req.query;

    // Construcción dinámica del filtro
    let filtro = {};

    // Si es administrador y se especifica usuarioId, filtrar por ese usuario
    if (currentUser.rol === 'administrador' && usuarioId) {
      filtro.usuario = usuarioId;
    } else if (currentUser.rol !== 'administrador') {
      // Si no es admin, solo puede ver sus propios estudios
      filtro.usuario = currentUser._id;
    }

    // Filtrar por estado si se especifica
    if (estado) {
      filtro.estado = estado;
    }

    const skip = (page - 1) * limit;

    const estudios = await Estudio.find(filtro)
      .populate('usuario', 'nombre apellido email')
      .populate('partitura', 'compositor obra archivo')
      .populate('creadoPor', 'nombre apellido')
      .sort({ fechaInicio: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Estudio.countDocuments(filtro);

    res.json({
      estudios,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error al obtener estudios:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// Obtener estudios por usuario específico
const obtenerEstudiosPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { usuario: currentUser } = req;

    // Verificar permisos
    if (currentUser.rol !== 'administrador' && currentUser._id.toString() !== usuarioId) {
      return res.status(403).json({ message: 'No tienes permisos para ver estos estudios' });
    }

    const estudios = await Estudio.find({ usuario: usuarioId })
      .populate('partitura', 'compositor obra archivo')
      .populate('creadoPor', 'nombre apellido')
      .sort({ fechaInicio: -1 });

    res.json({ estudios });
  } catch (error) {
    console.error('Error al obtener estudios por usuario:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// Crear un nuevo estudio
const crearEstudio = async (req, res) => {
  try {
    const { usuario: currentUser } = req;
    const {
      usuarioId,
      compositor,
      obra,
      fechaInicio,
      fechaFinalizacionSugerida,
      fechaFinalizada,
      porcentajeProgreso = 0,
      estado = 'en_progreso',
      notas = '',
      partituraId = null
    } = req.body;

    // Solo administradores pueden crear estudios
    if (currentUser.rol !== 'administrador') {
      return res.status(403).json({ message: 'Solo los administradores pueden crear estudios' });
    }

    // Validaciones
    if (!usuarioId || !compositor || !obra || !fechaInicio) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos: usuarioId, compositor, obra, fechaInicio' 
      });
    }

    // Verificar que el usuario existe
    const usuarioExiste = await Usuario.findById(usuarioId);
    if (!usuarioExiste) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que la fecha de finalización sea posterior a la de inicio (solo si se proporciona)
    if (fechaFinalizacionSugerida && new Date(fechaFinalizacionSugerida) <= new Date(fechaInicio)) {
      return res.status(400).json({ 
        message: 'La fecha de finalización debe ser posterior a la fecha de inicio' 
      });
    }

    // Crear el estudio
    const estudioData = {
      usuario: usuarioId,
      compositor,
      obra,
      fechaInicio: ajustarFecha(fechaInicio),
      porcentajeProgreso,
      estado,
      notas,
      partitura: partituraId,
      creadoPor: currentUser._id
    };

    // Solo agregar fechaFinalizacionSugerida si se proporciona
    if (fechaFinalizacionSugerida) {
      estudioData.fechaFinalizacionSugerida = ajustarFecha(fechaFinalizacionSugerida);
    }

    // Solo agregar fechaFinalizada si se proporciona
    if (fechaFinalizada) {
      estudioData.fechaFinalizada = ajustarFecha(fechaFinalizada);
    }

    const nuevoEstudio = new Estudio(estudioData);

    const estudioGuardado = await nuevoEstudio.save();
    
    // Popular el estudio guardado para la respuesta
    await estudioGuardado.populate('usuario', 'nombre apellido email');
    await estudioGuardado.populate('partitura', 'compositor obra archivo');
    await estudioGuardado.populate('creadoPor', 'nombre apellido');

    res.status(201).json({
      message: 'Estudio creado exitosamente',
      estudio: estudioGuardado
    });
  } catch (error) {
    console.error('Error al crear estudio:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// Actualizar un estudio
const actualizarEstudio = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario: currentUser } = req;
    const {
      compositor,
      obra,
      fechaInicio,
      fechaFinalizacionSugerida,
      fechaFinalizada,
      porcentajeProgreso,
      estado,
      notas,
      partituraId
    } = req.body;

    const estudio = await Estudio.findById(id);
    if (!estudio) {
      return res.status(404).json({ message: 'Estudio no encontrado' });
    }

    // Verificar permisos
    if (currentUser.rol !== 'administrador') {
      return res.status(403).json({ message: 'Solo los administradores pueden actualizar estudios' });
    }

    // Preparar datos de actualización
    const datosActualizacion = {};
    
    if (compositor !== undefined) datosActualizacion.compositor = compositor;
    if (obra !== undefined) datosActualizacion.obra = obra;
    if (fechaInicio !== undefined) datosActualizacion.fechaInicio = ajustarFecha(fechaInicio);
    if (fechaFinalizacionSugerida !== undefined) datosActualizacion.fechaFinalizacionSugerida = ajustarFecha(fechaFinalizacionSugerida);
    if (fechaFinalizada !== undefined) {
      datosActualizacion.fechaFinalizada = fechaFinalizada ? ajustarFecha(fechaFinalizada) : null;
      // Si se marca como finalizado, actualizar estado pero mantener el progreso actual
      if (fechaFinalizada) {
        datosActualizacion.estado = 'finalizado';
        // NO sobrescribir el porcentajeProgreso automáticamente
      }
    }
    if (porcentajeProgreso !== undefined) datosActualizacion.porcentajeProgreso = porcentajeProgreso;
    if (estado !== undefined) datosActualizacion.estado = estado;
    if (notas !== undefined) datosActualizacion.notas = notas;
    if (partituraId !== undefined) datosActualizacion.partitura = partituraId;

    // Validar fechas si se están actualizando
    if (datosActualizacion.fechaInicio && datosActualizacion.fechaFinalizacionSugerida) {
      if (datosActualizacion.fechaFinalizacionSugerida <= datosActualizacion.fechaInicio) {
        return res.status(400).json({ 
          message: 'La fecha de finalización debe ser posterior a la fecha de inicio' 
        });
      }
    }

    const estudioActualizado = await Estudio.findByIdAndUpdate(
      id,
      datosActualizacion,
      { new: true, runValidators: true }
    )
      .populate('usuario', 'nombre apellido email')
      .populate('partitura', 'compositor obra archivo')
      .populate('creadoPor', 'nombre apellido');

    res.json({
      message: 'Estudio actualizado exitosamente',
      estudio: estudioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar estudio:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// Eliminar un estudio
const eliminarEstudio = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario: currentUser } = req;

    // Solo administradores pueden eliminar estudios
    if (currentUser.rol !== 'administrador') {
      return res.status(403).json({ message: 'Solo los administradores pueden eliminar estudios' });
    }

    const estudio = await Estudio.findById(id);
    if (!estudio) {
      return res.status(404).json({ message: 'Estudio no encontrado' });
    }

    await Estudio.findByIdAndDelete(id);

    res.json({ message: 'Estudio eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar estudio:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// Marcar estudio como finalizado
const finalizarEstudio = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario: currentUser } = req;

    // Solo administradores pueden finalizar estudios
    if (currentUser.rol !== 'administrador') {
      return res.status(403).json({ message: 'Solo los administradores pueden finalizar estudios' });
    }

    const estudio = await Estudio.findById(id);
    if (!estudio) {
      return res.status(404).json({ message: 'Estudio no encontrado' });
    }

    const estudioFinalizado = await Estudio.findByIdAndUpdate(
      id,
      {
        fechaFinalizada: ajustarFecha(new Date()),
        estado: 'finalizado'
        // NO cambiar el porcentajeProgreso - mantener el valor actual
      },
      { new: true }
    )
      .populate('usuario', 'nombre apellido email')
      .populate('partitura', 'compositor obra archivo')
      .populate('creadoPor', 'nombre apellido');

    res.json({
      message: 'Estudio finalizado exitosamente',
      estudio: estudioFinalizado
    });
  } catch (error) {
    console.error('Error al finalizar estudio:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

export {
  obtenerEstudios,
  obtenerEstudiosPorUsuario,
  crearEstudio,
  actualizarEstudio,
  eliminarEstudio,
  finalizarEstudio
};
