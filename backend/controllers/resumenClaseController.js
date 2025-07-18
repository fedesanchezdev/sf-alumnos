import ResumenClase from '../models/ResumenClase.js';
import Clase from '../models/Clase.js';
import Partitura from '../models/Partitura.js';
import mongoose from 'mongoose';

// @desc    Obtener resumen de una clase específica
// @route   GET /api/resumenes-clase/clase/:claseId
// @access  Private
export const obtenerResumenPorClase = async (req, res) => {
  try {
    const { claseId } = req.params;

    const resumen = await ResumenClase.findOne({ 
      clase: claseId,
      activo: true 
    })
      .populate('clase', 'fecha estado notas')
      .populate('usuario', 'nombre apellido telefono')
      .populate({
        path: 'obrasEstudiadas.partitura',
        select: 'compositor obra',
        // Populate opcional - no fallar si partitura es null (obras manuales)
        options: { strictPopulate: false }
      })
      .lean();

    if (!resumen) {
      // Si no existe resumen, devolver estructura vacía
      return res.json({
        clase: claseId,
        obrasEstudiadas: [],
        objetivosProximaClase: ''
      });
    }

    res.json(resumen);

  } catch (error) {
    console.error('Error al obtener resumen de clase:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener resúmenes de un usuario
// @route   GET /api/resumenes-clase/usuario/:usuarioId
// @access  Private
export const obtenerResumenesPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limite = 10, pagina = 1 } = req.query;

    const skip = (pagina - 1) * limite;

    const resumenes = await ResumenClase.find({ 
      usuario: usuarioId,
      activo: true 
    })
      .populate('clase', 'fecha estado notas')
      .populate('usuario', 'nombre apellido telefono')
      .populate({
        path: 'obrasEstudiadas.partitura',
        select: 'compositor obra',
        // Populate opcional - no fallar si partitura es null (obras manuales)
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite))
      .lean();

    // Filtrar resúmenes que tienen clase null y loggear los problemáticos
    const resumenesValidos = resumenes.filter(resumen => {
      if (!resumen.clase) {
        console.warn(`Resumen ${resumen._id} tiene clase null - posible referencia huérfana`);
        return false;
      }
      return true;
    });

    if (resumenesValidos.length !== resumenes.length) {
      console.warn(`Se filtraron ${resumenes.length - resumenesValidos.length} resúmenes con clases null`);
    }

    const total = await ResumenClase.countDocuments({ 
      usuario: usuarioId,
      activo: true 
    });

    res.json({
      resumenes: resumenesValidos,
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / limite)
    });

  } catch (error) {
    console.error('Error al obtener resúmenes por usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Crear o actualizar resumen de clase
// @route   POST /api/resumenes-clase
// @access  Private
export const crearOActualizarResumen = async (req, res) => {
  try {
    const { 
      claseId, 
      obrasEstudiadas, 
      objetivosProximaClase 
    } = req.body;

    // Verificar que la clase existe
    const clase = await Clase.findById(claseId);
    if (!clase) {
      return res.status(404).json({
        message: 'Clase no encontrada'
      });
    }

    // Separar obras de la biblioteca (con partitura válida) de obras manuales
    const obrasConPartitura = obrasEstudiadas.filter(obra => obra.partitura && obra.partitura !== null && obra.partitura !== '');
    const obrasManuales = obrasEstudiadas.filter(obra => !obra.partitura || obra.partitura === null || obra.partitura === '' || obra.esManual);

    // Verificar que las partituras de la biblioteca existen
    if (obrasConPartitura.length > 0) {
      const partituraIds = obrasConPartitura.map(obra => obra.partitura).filter(id => id); // Filtrar IDs válidos
      const partituraIdsUnicos = [...new Set(partituraIds)]; // Remover duplicados
      
      const partidasExistentes = await Partitura.find({ 
        _id: { $in: partituraIdsUnicos }
      });

      if (partidasExistentes.length !== partituraIdsUnicos.length) {
        const partiturasNoEncontradas = partituraIdsUnicos.filter(id => 
          id && !partidasExistentes.some(p => p._id.toString() === id.toString())
        );
        return res.status(400).json({
          message: 'Una o más partituras seleccionadas no existen',
          partiturasNoEncontradas
        });
      }
    }

    // Buscar resumen existente o crear uno nuevo
    let resumen = await ResumenClase.findOne({ clase: claseId });

    if (resumen) {
      // Actualizar resumen existente
      resumen.obrasEstudiadas = obrasEstudiadas;
      resumen.objetivosProximaClase = objetivosProximaClase;
      resumen.activo = true; // Asegurar que el resumen esté activo al actualizarlo
      await resumen.save();
    } else {
      // Crear nuevo resumen
      resumen = new ResumenClase({
        clase: claseId,
        usuario: clase.usuario,
        obrasEstudiadas,
        objetivosProximaClase,
        activo: true // Asegurar que el nuevo resumen esté activo
      });
      await resumen.save();
    }

    // Retornar el resumen completo con datos poblados
    const resumenCompleto = await ResumenClase.findById(resumen._id)
      .populate('clase', 'fecha estado notas')
      .populate('usuario', 'nombre apellido telefono')
      .populate({
        path: 'obrasEstudiadas.partitura',
        select: 'compositor obra',
        // Populate opcional - no fallar si partitura es null (obras manuales)
        options: { strictPopulate: false }
      })
      .lean();

    res.status(resumen.isNew ? 201 : 200).json({
      message: resumen.isNew ? 'Resumen creado exitosamente' : 'Resumen actualizado exitosamente',
      resumen: resumenCompleto
    });

  } catch (error) {
    console.error('Error al crear/actualizar resumen de clase:', error);
    
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

// @desc    Eliminar resumen de clase
// @route   DELETE /api/resumenes-clase/:id
// @access  Private
export const eliminarResumen = async (req, res) => {
  try {
    const { id } = req.params;

    const resumen = await ResumenClase.findById(id);
    
    if (!resumen) {
      return res.status(404).json({
        message: 'Resumen no encontrado'
      });
    }

    // Soft delete
    resumen.activo = false;
    await resumen.save();

    res.json({
      message: 'Resumen eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar resumen:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas de obras estudiadas por usuario
// @route   GET /api/resumenes-clase/estadisticas/:usuarioId
// @access  Private
export const obtenerEstadisticasUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const estadisticas = await ResumenClase.aggregate([
      // Filtrar por usuario y registros activos
      { 
        $match: { 
          usuario: new mongoose.Types.ObjectId(usuarioId),
          activo: true 
        } 
      },
      
      // Desenrollar las obras estudiadas
      { $unwind: '$obrasEstudiadas' },
      
      // Hacer lookup con partituras
      {
        $lookup: {
          from: 'partituras',
          localField: 'obrasEstudiadas.partitura',
          foreignField: '_id',
          as: 'partituraInfo'
        }
      },
      
      // Desenrollar la información de partitura
      { $unwind: '$partituraInfo' },
      
      // Agrupar por obra y contar apariciones
      {
        $group: {
          _id: '$obrasEstudiadas.partitura',
          compositor: { $first: '$obrasEstudiadas.compositor' },
          obra: { $first: '$obrasEstudiadas.obra' },
          vecesEstudiada: { $sum: 1 },
          ultimaClase: { $max: '$createdAt' },
          ultimosComentarios: { $last: '$obrasEstudiadas.comentarios' },
          ultimosMovimientos: { $last: '$obrasEstudiadas.movimientosCompases' }
        }
      },
      
      // Ordenar por frecuencia
      { $sort: { vecesEstudiada: -1, ultimaClase: -1 } }
    ]);

    res.json(estadisticas);

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
