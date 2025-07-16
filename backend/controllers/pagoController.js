import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';
import Usuario from '../models/Usuario.js';

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

// Función para generar fechas de clases semanales
const generarFechasClases = (fechaInicio, fechaFin) => {
  const fechas = [];
  const inicio = ajustarFecha(fechaInicio);
  const fin = ajustarFecha(fechaFin);

  let fechaActual = new Date(inicio);

  while (fechaActual <= fin) {
    fechas.push(new Date(fechaActual));
    fechaActual.setDate(fechaActual.getDate() + 7); // Agregar 7 días para clases semanales
  }

  return fechas;
};

// @desc    Crear un nuevo pago y generar clases automáticamente
// @route   POST /api/pagos
// @access  Private (solo admin)
export const crearPago = async (req, res) => {
  try {
    const { usuarioId, monto, fechaInicio, fechaFin, descripcion, fechasClases } = req.body;

    // Validar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Crear el pago
    const pagoData = {
      usuario: usuarioId,
      monto,
      descripcion
    };

    // Solo agregar fechas de período si se proporcionan
    if (fechaInicio && fechaFin) {
      pagoData.fechaInicio = ajustarFecha(fechaInicio);
      pagoData.fechaFin = ajustarFecha(fechaFin);
    }

    const pago = new Pago(pagoData);

    await pago.save();

    let clasesParaCrear = [];

    // Si se proporcionan fechas específicas, usar esas
    if (fechasClases && Array.isArray(fechasClases) && fechasClases.length > 0) {
      clasesParaCrear = fechasClases.map(fecha => ({
        usuario: usuarioId,
        pago: pago._id,
        fecha: ajustarFecha(fecha),
        estado: 'no_iniciada'
      }));
    }
    // Si no, generar fechas semanales automáticamente
    else if (fechaInicio && fechaFin) {
      const fechasGeneradas = generarFechasClases(fechaInicio, fechaFin);
      clasesParaCrear = fechasGeneradas.map(fecha => ({
        usuario: usuarioId,
        pago: pago._id,
        fecha: fecha,
        estado: 'no_iniciada'
      }));
    }

    // VALIDACIÓN: Un pago debe tener al menos una clase asociada
    if (clasesParaCrear.length === 0) {
      // Eliminar el pago si no se pueden crear clases
      await Pago.findByIdAndDelete(pago._id);
      return res.status(400).json({
        message: 'Error: No se pueden crear pagos sin clases asociadas. Debe proporcionar fechas de inicio/fin para período semanal o fechas específicas para clases individuales.',
        error: 'CLASES_REQUERIDAS'
      });
    }

    // Crear las clases
    await Clase.insertMany(clasesParaCrear);

    // Obtener el pago completo con las clases
    const pagoCompleto = await Pago.findById(pago._id)
      .populate('usuario', 'nombre apellido email telefono')
      .lean();

    const clasesCreadas = await Clase.find({ pago: pago._id }).lean();

    res.status(201).json({
      message: 'Pago y clases creados exitosamente',
      pago: pagoCompleto,
      clases: clasesCreadas
    });

  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener todos los pagos
// @route   GET /api/pagos
// @access  Private (solo admin)
export const obtenerPagos = async (req, res) => {
  try {
    const pagos = await Pago.find({ activo: true })
      .populate('usuario', 'nombre apellido email telefono')
      .sort({ fechaPago: -1 })
      .lean();

    res.json(pagos);

  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener pagos de un usuario específico
// @route   GET /api/pagos/usuario/:usuarioId
// @access  Private
export const obtenerPagosPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const pagos = await Pago.find({
      usuario: usuarioId,
      activo: true
    })
      .populate('usuario', 'nombre apellido email telefono')
      .sort({ fechaPago: -1 })
      .lean();

    // Para cada pago, obtener sus clases asociadas
    const pagosConClases = await Promise.all(
      pagos.map(async (pago) => {
        const clases = await Clase.find({
          pago: pago._id
        })
          .select('fecha estado')
          .sort({ fecha: 1 })
          .lean();

        return {
          ...pago,
          clases: clases || [],
          facturaUrl: pago.linkFactura || null
        };
      })
    );

    res.json(pagosConClases);

  } catch (error) {
    console.error('Error al obtener pagos por usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Actualizar un pago
// @route   PUT /api/pagos/:id
// @access  Private (solo admin)
export const actualizarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, fechaInicio, fechaFin, descripcion, linkFactura, fechasClases } = req.body;

    const pago = await Pago.findById(id);

    if (!pago) {
      return res.status(404).json({
        message: 'Pago no encontrado'
      });
    }

    // Verificar si realmente cambiaron las fechas del período
    const fechaInicioAnterior = pago.fechaInicio ? pago.fechaInicio.toISOString().split('T')[0] : null;
    const fechaFinAnterior = pago.fechaFin ? pago.fechaFin.toISOString().split('T')[0] : null;
    
    const fechaInicioNueva = fechaInicio ? fechaInicio : null;
    const fechaFinNueva = fechaFin ? fechaFin : null;
    
    const fechasCambiaron = (fechaInicioAnterior !== fechaInicioNueva) || (fechaFinAnterior !== fechaFinNueva);

    // Actualizar el pago
    pago.monto = monto || pago.monto;
    pago.descripcion = descripcion !== undefined ? descripcion : pago.descripcion;
    pago.linkFactura = linkFactura !== undefined ? linkFactura : pago.linkFactura;
    
    // Solo actualizar fechas de período si se proporcionan explícitamente
    if (fechaInicio !== undefined) {
      pago.fechaInicio = fechaInicio ? ajustarFecha(fechaInicio) : null;
    }
    if (fechaFin !== undefined) {
      pago.fechaFin = fechaFin ? ajustarFecha(fechaFin) : null;
    }

    await pago.save();

    // Solo regenerar clases si:
    // 1. Las fechas del período realmente cambiaron, O
    // 2. Se proporcionan fechas específicas de clases
    if (fechasCambiaron && fechaInicio && fechaFin) {
      console.log(`🔄 Regenerando clases para pago ${id} - fechas cambiaron de ${fechaInicioAnterior}-${fechaFinAnterior} a ${fechaInicioNueva}-${fechaFinNueva}`);
      
      // Obtener las clases existentes para preservar las que ya fueron tomadas
      const clasesExistentes = await Clase.find({ pago: id });
      const clasesTomadas = clasesExistentes.filter(clase => clase.estado !== 'no_iniciada');
      
      // Solo eliminar clases que no han sido tomadas
      const clasesEliminadas = await Clase.deleteMany({
        pago: id,
        estado: 'no_iniciada'
      });
      
      console.log(`🗑️  Eliminadas ${clasesEliminadas.deletedCount} clases no iniciadas`);

      // Generar nuevas fechas de clases
      const fechasClases = generarFechasClases(pago.fechaInicio, pago.fechaFin);
      
      // Filtrar fechas que ya tienen clases tomadas para evitar duplicados
      const fechasClasesTomadas = clasesTomadas.map(clase => 
        clase.fecha.toISOString().split('T')[0]
      );
      
      const fechasNuevas = fechasClases.filter(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0];
        return !fechasClasesTomadas.includes(fechaStr);
      });

      console.log(`📅 Fechas generadas: ${fechasClases.length}, fechas nuevas: ${fechasNuevas.length}`);

      // Crear nuevas clases solo para fechas que no tienen clases tomadas
      if (fechasNuevas.length > 0) {
        const nuevasClases = fechasNuevas.map(fecha => ({
          usuario: pago.usuario,
          pago: pago._id,
          fecha: fecha,
          estado: 'no_iniciada'
        }));

        await Clase.insertMany(nuevasClases);
        console.log(`✅ Creadas ${nuevasClases.length} nuevas clases`);
      }
    } else if (fechasClases && Array.isArray(fechasClases)) {
      // Si se proporcionan fechas específicas, actualizar clases individuales
      console.log(`📋 Actualizando clases individuales para pago ${id}`);
      
      // Eliminar clases no iniciadas
      await Clase.deleteMany({
        pago: id,
        estado: 'no_iniciada'
      });

      // Crear nuevas clases con las fechas especificadas
      const nuevasClases = fechasClases.map(fecha => ({
        usuario: pago.usuario,
        pago: pago._id,
        fecha: ajustarFecha(fecha),
        estado: 'no_iniciada'
      }));

      await Clase.insertMany(nuevasClases);
      console.log(`✅ Creadas ${nuevasClases.length} clases individuales`);
    } else {
      console.log(`ℹ️  No se regeneraron clases para pago ${id} - sin cambios en fechas`);
    }

    const pagoActualizado = await Pago.findById(id)
      .populate('usuario', 'nombre apellido email telefono')
      .lean();

    res.json({
      message: 'Pago actualizado exitosamente',
      pago: pagoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Eliminar un pago (soft delete)
// @route   DELETE /api/pagos/:id
// @access  Private (solo admin)
export const eliminarPago = async (req, res) => {
  try {
    const { id } = req.params;

    const pago = await Pago.findById(id);

    if (!pago) {
      return res.status(404).json({
        message: 'Pago no encontrado'
      });
    }

    // Soft delete del pago
    pago.activo = false;
    await pago.save();

    // También desactivar las clases asociadas
    await Clase.updateMany(
      { pago: id },
      { $set: { activo: false } }
    );

    res.json({
      message: 'Pago eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Agregar clases individuales a un pago existente
// @route   POST /api/pagos/:id/clases
// @access  Private (solo admin)
export const agregarClasesIndividuales = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechasClases } = req.body;

    // Validar que el pago existe
    const pago = await Pago.findById(id);
    if (!pago) {
      return res.status(404).json({
        message: 'Pago no encontrado'
      });
    }

    // Validar que se proporcionan fechas
    if (!fechasClases || !Array.isArray(fechasClases) || fechasClases.length === 0) {
      return res.status(400).json({
        message: 'Debe proporcionar al menos una fecha de clase'
      });
    }

    // Crear las nuevas clases
    const nuevasClases = fechasClases.map(fecha => ({
      usuario: pago.usuario,
      pago: pago._id,
      fecha: ajustarFecha(fecha),
      estado: 'no_iniciada'
    }));

    await Clase.insertMany(nuevasClases);

    // Obtener todas las clases del pago
    const todasLasClases = await Clase.find({ pago: id })
      .populate('usuario', 'nombre apellido email telefono')
      .sort({ fecha: 1 })
      .lean();

    res.status(201).json({
      message: `${nuevasClases.length} clases agregadas exitosamente`,
      clases: todasLasClases
    });

  } catch (error) {
    console.error('Error al agregar clases individuales:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
