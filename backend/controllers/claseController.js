import Clase from '../models/Clase.js';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';
import mongoose from 'mongoose';

// @desc    Obtener clases de un usuario
// @route   GET /api/clases/usuario/:usuarioId
// @access  Private
export const obtenerClasesPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const clases = await Clase.find({ 
      usuario: usuarioId,
      activo: true 
    })
      .populate('pago', 'monto fechaPago descripcion')
      .populate('usuario', 'nombre apellido email')
      .sort({ fecha: 1 })
      .lean();

    res.json(clases);

  } catch (error) {
    console.error('Error al obtener clases por usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener todas las clases
// @route   GET /api/clases
// @access  Private (solo admin)
export const obtenerTodasLasClases = async (req, res) => {
  try {
    const clases = await Clase.find({ activo: true })
      .populate('pago', 'monto fechaPago descripcion')
      .populate('usuario', 'nombre apellido email')
      .sort({ fecha: 1 })
      .lean();

    res.json(clases);

  } catch (error) {
    console.error('Error al obtener todas las clases:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Actualizar estado de una clase
// @route   PUT /api/clases/:id/estado
// @access  Private
export const actualizarEstadoClase = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas, fechaReprogramada } = req.body;

    // Validar estado
    const estadosValidos = ['no_iniciada', 'tomada', 'ausente', 'reprogramar', 'recuperada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        message: 'Estado de clase inválido'
      });
    }

    const clase = await Clase.findById(id);
    
    if (!clase) {
      return res.status(404).json({
        message: 'Clase no encontrada'
      });
    }

    // Actualizar la clase
    clase.estado = estado;
    // Si notas está definido en el request, usarlo (incluso si es una cadena vacía)
    if (notas !== undefined) {
      clase.notas = notas;
    }
    
    // Manejar fecha reprogramada
    if (estado === 'reprogramar' && fechaReprogramada) {
      // Si la fecha ya es un objeto Date, usarla directamente
      // Si es un string, crear Date y ajustar a mediodía UTC (no local)
      let fechaAjustada;
      if (fechaReprogramada instanceof Date) {
        fechaAjustada = fechaReprogramada;
      } else {
        // CORRECCIÓN: Para strings YYYY-MM-DD, crear fecha UTC directamente
        if (typeof fechaReprogramada === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaReprogramada)) {
          const [año, mes, dia] = fechaReprogramada.split('-').map(Number);
          fechaAjustada = new Date(Date.UTC(año, mes - 1, dia, 12, 0, 0, 0));
        } else {
          fechaAjustada = new Date(fechaReprogramada);
          fechaAjustada.setUTCHours(12, 0, 0, 0); // Usar setUTCHours en lugar de setHours
        }
      }
      
      clase.fechaReprogramada = fechaAjustada;
    } else if (fechaReprogramada === null) {
      // Si explícitamente enviamos null, eliminar completamente la fecha reprogramada
      clase.fechaReprogramada = undefined;
      // Usar $unset para eliminar el campo completamente del documento
      await Clase.updateOne(
        { _id: id },
        { 
          $unset: { fechaReprogramada: "" },
          $set: { estado: estado, notas: notas !== undefined ? notas : clase.notas }
        }
      );
      
      // Obtener la clase actualizada para la respuesta
      const claseActualizada = await Clase.findById(id)
        .populate('pago', 'monto fechaPago descripcion')
        .populate('usuario', 'nombre apellido email')
        .lean();

      return res.json({
        message: 'Estado de clase actualizado exitosamente',
        clase: claseActualizada
      });
    }

    await clase.save();

    const claseActualizada = await Clase.findById(id)
      .populate('pago', 'monto fechaPago descripcion')
      .populate('usuario', 'nombre apellido email')
      .lean();

    res.json({
      message: 'Estado de clase actualizado exitosamente',
      clase: claseActualizada
    });

  } catch (error) {
    console.error('Error al actualizar estado de clase:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener resumen de clases por usuario
// @route   GET /api/clases/resumen/:usuarioId
// @access  Private
export const obtenerResumenClases = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const resumen = await Clase.aggregate([
      { $match: { 
        usuario: new mongoose.Types.ObjectId(usuarioId),
        activo: true 
      } },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 }
        }
      }
    ]);

    const resumenFormateado = {
      no_iniciada: 0,
      tomada: 0,
      ausente: 0,
      reprogramar: 0,
      recuperada: 0
    };

    resumen.forEach(item => {
      resumenFormateado[item._id] = item.cantidad;
    });

    res.json(resumenFormateado);

  } catch (error) {
    console.error('Error al obtener resumen de clases:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener clases por fecha
// @route   GET /api/clases/fecha/:fecha
// @access  Private (solo admin)
export const obtenerClasesPorFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    const clases = await Clase.find({
      fecha: {
        $gte: fechaInicio,
        $lte: fechaFin
      },
      activo: true
    })
      .populate('pago', 'monto fechaPago descripcion')
      .populate('usuario', 'nombre apellido email')
      .sort({ fecha: 1 })
      .lean();

    res.json(clases);

  } catch (error) {
    console.error('Error al obtener clases por fecha:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener clases de un usuario separadas por último pago e historial
// @route   GET /api/clases/usuario/:usuarioId/separadas
// @access  Private
export const obtenerClasesSeparadas = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Obtener el último pago activo del usuario
    const ultimoPago = await Pago.findOne({ 
      usuario: usuarioId,
      activo: true 
    })
      .sort({ fechaPago: -1 })
      .lean();

    if (!ultimoPago) {
      return res.json({
        ultimoPago: null,
        clasesUltimoPago: [],
        historialClases: []
      });
    }

    // Obtener clases del último pago
    const clasesUltimoPago = await Clase.find({ 
      pago: ultimoPago._id,
      activo: true 
    })
      .populate('pago', 'monto fechaPago descripcion')
      .populate('usuario', 'nombre apellido email')
      .sort({ fecha: 1 })
      .lean()
      .read('primary'); // Forzar lectura desde primary para obtener datos frescos

    // Obtener historial de clases usando agregación para asegurar que solo se incluyan pagos activos
    const historialClases = await Clase.aggregate([
      // Buscar clases del usuario que no sean del último pago y estén activas
      {
        $match: {
          usuario: new mongoose.Types.ObjectId(usuarioId),
          pago: { $ne: ultimoPago._id },
          activo: true
        }
      },
      // Hacer lookup con pagos para verificar que estén activos
      {
        $lookup: {
          from: 'pagos',
          localField: 'pago',
          foreignField: '_id',
          as: 'pagoInfo'
        }
      },
      // Filtrar solo pagos activos
      {
        $match: {
          'pagoInfo.activo': true
        }
      },
      // Hacer lookup con usuarios
      {
        $lookup: {
          from: 'usuarios',
          localField: 'usuario',
          foreignField: '_id',
          as: 'usuarioInfo'
        }
      },
      // Reestructurar la salida para que coincida con el formato esperado
      {
        $addFields: {
          pago: {
            $arrayElemAt: ['$pagoInfo', 0]
          },
          usuario: {
            $arrayElemAt: ['$usuarioInfo', 0]
          }
        }
      },
      // Seleccionar solo los campos necesarios
      {
        $project: {
          fecha: 1,
          estado: 1,
          notas: 1,
          fechaReprogramada: 1,
          activo: 1,
          createdAt: 1,
          updatedAt: 1,
          __v: 1,
          'pago._id': 1,
          'pago.monto': 1,
          'pago.fechaPago': 1,
          'pago.descripcion': 1,
          'usuario._id': 1,
          'usuario.nombre': 1,
          'usuario.apellido': 1,
          'usuario.email': 1
        }
      },
      // Ordenar por fecha descendente
      {
        $sort: { fecha: -1 }
      }
    ]);

    res.json({
      ultimoPago: ultimoPago,
      clasesUltimoPago: clasesUltimoPago,
      historialClases: historialClases
    });

  } catch (error) {
    console.error('Error al obtener clases separadas:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener clases de un pago específico
// @route   GET /api/clases/pago/:pagoId
// @access  Private
export const obtenerClasesPorPago = async (req, res) => {
  try {
    const { pagoId } = req.params;

    const clases = await Clase.find({ 
      pago: pagoId,
      activo: true 
    })
      .populate('usuario', 'nombre apellido email')
      .sort({ fecha: 1 })
      .lean();

    res.json(clases);

  } catch (error) {
    console.error('Error al obtener clases por pago:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener estudiantes con clases pagadas agrupados por días de la semana
// @route   GET /api/clases/estudiantes-por-dia
// @access  Private (solo admin)
export const obtenerEstudiantesPorDia = async (req, res) => {
  try {
    // Obtener todos los usuarios activos que tienen pagos activos
    const usuariosConPagos = await Usuario.aggregate([
      // Buscar usuarios activos
      {
        $match: {
          activo: true
        }
      },
      // Hacer lookup con pagos para obtener el último pago activo
      {
        $lookup: {
          from: 'pagos',
          localField: '_id',
          foreignField: 'usuario',
          as: 'pagos'
        }
      },
      // Filtrar usuarios que tienen al menos un pago activo
      {
        $match: {
          'pagos.activo': true
        }
      },
      // Obtener solo el último pago activo por fecha
      {
        $addFields: {
          ultimoPago: {
            $first: {
              $filter: {
                input: {
                  $sortArray: {
                    input: '$pagos',
                    sortBy: { fechaPago: -1 }
                  }
                },
                cond: { $eq: ['$$this.activo', true] }
              }
            }
          }
        }
      },
      // Filtrar usuarios que tienen último pago
      {
        $match: {
          ultimoPago: { $exists: true }
        }
      },
      // Hacer lookup con clases para obtener las clases del último pago
      {
        $lookup: {
          from: 'clases',
          localField: 'ultimoPago._id',
          foreignField: 'pago',
          as: 'clases'
        }
      },
      // Filtrar solo clases activas
      {
        $addFields: {
          clases: {
            $filter: {
              input: '$clases',
              cond: { $eq: ['$$this.activo', true] }
            }
          }
        }
      },
      // Proyectar solo los datos necesarios
      {
        $project: {
          _id: 1,
          nombre: 1,
          apellido: 1,
          email: 1,
          ultimoPago: {
            _id: '$ultimoPago._id',
            monto: '$ultimoPago.monto',
            fechaPago: '$ultimoPago.fechaPago',
            descripcion: '$ultimoPago.descripcion'
          },
          clases: {
            $map: {
              input: '$clases',
              as: 'clase',
              in: {
                _id: '$$clase._id',
                fecha: '$$clase.fecha',
                estado: '$$clase.estado',
                notas: '$$clase.notas',
                fechaReprogramada: '$$clase.fechaReprogramada',
                diaSemana: { $dayOfWeek: '$$clase.fecha' } // 1=Domingo, 2=Lunes, etc.
              }
            }
          }
        }
      }
    ]);

    // Agrupar estudiantes por día de la semana
    const estudiantesPorDia = {
      1: [], // Domingo
      2: [], // Lunes
      3: [], // Martes
      4: [], // Miércoles
      5: [], // Jueves
      6: [], // Viernes
      7: []  // Sábado
    };

    usuariosConPagos.forEach(usuario => {
      // Obtener los días únicos en los que tiene clases
      const diasConClases = [...new Set(usuario.clases.map(clase => clase.diaSemana))];
      
      diasConClases.forEach(dia => {
        const clasesDelDia = usuario.clases.filter(clase => clase.diaSemana === dia);
        
        estudiantesPorDia[dia].push({
          _id: usuario._id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          ultimoPago: usuario.ultimoPago,
          clasesDelDia: clasesDelDia.length,
          proximaClase: clasesDelDia
            .filter(clase => new Date(clase.fecha) >= new Date())
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0] || null
        });
      });
    });

    // Convertir números de día a nombres
    const diasSemana = {
      1: 'Domingo',
      2: 'Lunes',
      3: 'Martes',
      4: 'Miércoles',
      5: 'Jueves',
      6: 'Viernes',
      7: 'Sábado'
    };

    const resultado = Object.entries(estudiantesPorDia).map(([numeroDia, estudiantes]) => ({
      dia: numeroDia,
      nombreDia: diasSemana[numeroDia],
      estudiantes: estudiantes.sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`))
    }));

    res.json(resultado);

  } catch (error) {
    console.error('Error al obtener estudiantes por día:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
