import Partitura from '../models/Partitura.js';

// @desc    Obtener todas las partituras
// @route   GET /api/partituras
// @access  Private
export const obtenerPartituras = async (req, res) => {
  try {
    // Obtener todas las partituras (sin filtrar por activo ya que parece que no tienen ese campo)
    const partituras = await Partitura.find({})
      .sort({ compositor: 1, obra: 1 })
      .lean();

    console.log('📚 Partituras encontradas:', partituras.length);
    if (partituras.length > 0) {
      console.log('🎼 Ejemplo de partitura:', {
        id: partituras[0]._id,
        compositor: partituras[0].compositor,
        obra: partituras[0].obra,
        hasMovimientos: !!partituras[0].movimientos,
        movimientosCount: partituras[0].movimientos?.length || 0
      });
    }

    res.json(partituras);

  } catch (error) {
    console.error('Error al obtener partituras:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener partituras por compositor
// @route   GET /api/partituras/compositor/:compositor
// @access  Private
export const obtenerPartiturasPorCompositor = async (req, res) => {
  try {
    const { compositor } = req.params;

    const partituras = await Partitura.find({ 
      compositor: { $regex: compositor, $options: 'i' },
      activo: true 
    })
      .sort({ obra: 1 })
      .lean();

    res.json(partituras);

  } catch (error) {
    console.error('Error al obtener partituras por compositor:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Buscar partituras
// @route   GET /api/partituras/buscar?q=termino
// @access  Private
export const buscarPartituras = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: 'El término de búsqueda debe tener al menos 2 caracteres'
      });
    }

    const termino = q.trim();
    
    const partituras = await Partitura.find({
      $and: [
        { activo: true },
        {
          $or: [
            { compositor: { $regex: termino, $options: 'i' } },
            { obra: { $regex: termino, $options: 'i' } },
            { 'movimientos.nombre': { $regex: termino, $options: 'i' } }
          ]
        }
      ]
    })
      .sort({ compositor: 1, obra: 1 })
      .lean();

    res.json(partituras);

  } catch (error) {
    console.error('Error al buscar partituras:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Crear nueva partitura
// @route   POST /api/partituras
// @access  Private (Admin)
export const crearPartitura = async (req, res) => {
  try {
    const { compositor, obra, partituraCello, partituraPiano, movimientos } = req.body;

    const partitura = new Partitura({
      compositor,
      obra,
      partituraCello,
      partituraPiano,
      movimientos: movimientos || []
    });

    await partitura.save();

    res.status(201).json({
      message: 'Partitura creada exitosamente',
      partitura
    });

  } catch (error) {
    console.error('Error al crear partitura:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Error de validación',
        errores
      });
    }

    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Actualizar partitura
// @route   PUT /api/partituras/:id
// @access  Private (Admin)
export const actualizarPartitura = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizaciones = req.body;

    const partitura = await Partitura.findByIdAndUpdate(
      id,
      actualizaciones,
      { new: true, runValidators: true }
    );

    if (!partitura) {
      return res.status(404).json({
        message: 'Partitura no encontrada'
      });
    }

    res.json({
      message: 'Partitura actualizada exitosamente',
      partitura
    });

  } catch (error) {
    console.error('Error al actualizar partitura:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Eliminar partitura
// @route   DELETE /api/partituras/:id
// @access  Private (Admin)
export const eliminarPartitura = async (req, res) => {
  try {
    const { id } = req.params;

    const partitura = await Partitura.findByIdAndDelete(id);

    if (!partitura) {
      return res.status(404).json({
        message: 'Partitura no encontrada'
      });
    }

    res.json({
      message: 'Partitura eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar partitura:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
