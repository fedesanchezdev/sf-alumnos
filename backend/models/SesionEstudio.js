import mongoose from 'mongoose';

const cambioMetronomoSchema = new mongoose.Schema({
  tiempo: {
    type: Date,
    required: true,
    default: Date.now
  },
  bpm: {
    type: Number,
    required: true,
    min: 40,
    max: 300
  },
  tiempoEstudioEnSegundos: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

const sesionEstudioSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  compositor: {
    type: String,
    required: true,
    trim: true
  },
  obra: {
    type: String,
    required: true,
    trim: true
  },
  movimientoPieza: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  compasesEstudiados: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  fechaInicio: {
    type: Date,
    required: true,
    default: Date.now
  },
  fechaFin: {
    type: Date,
    default: null
  },
  tiempoTotalSegundos: {
    type: Number,
    required: true,
    default: 0
  },
  bpmInicial: {
    type: Number,
    min: 0,
    max: 300,
    default: 0
  },
  bpmFinal: {
    type: Number,
    min: 0,
    max: 300,
    default: 0
  },
  metronomomUsado: {
    type: Boolean,
    default: false
  },
  cambiosMetronomo: [cambioMetronomoSchema],
  comentarios: {
    type: String,
    trim: true,
    default: ''
  },
  estado: {
    type: String,
    enum: ['activa', 'pausada', 'finalizada'],
    default: 'activa'
  },
  // Campo para compartir con el profesor
  compartidaConProfesor: {
    type: Boolean,
    default: false
  },
  comentariosProfesor: {
    type: String,
    trim: true,
    default: ''
  },
  fechaCompartida: {
    type: Date,
    default: null
  },
  // Referencia al estudio general si existe
  estudio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estudio',
    default: null
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
sesionEstudioSchema.index({ usuario: 1, fechaInicio: -1 });
sesionEstudioSchema.index({ compositor: 1, obra: 1 });
sesionEstudioSchema.index({ fechaInicio: -1 });

// Middleware para actualizar fechaFin y calcular tiempo total
sesionEstudioSchema.pre('save', function(next) {
  if (this.estado === 'finalizada' && !this.fechaFin) {
    this.fechaFin = new Date();
  }
  
  // Si hay cambios de metrónomo, el BPM final es el último registrado
  if (this.cambiosMetronomo && this.cambiosMetronomo.length > 0) {
    this.bpmFinal = this.cambiosMetronomo[this.cambiosMetronomo.length - 1].bpm;
  }
  
  next();
});

// Método para agregar cambio de metrónomo
sesionEstudioSchema.methods.agregarCambioMetronomo = function(bpm, tiempoEstudioEnSegundos) {
  this.cambiosMetronomo.push({
    bpm: bpm,
    tiempoEstudioEnSegundos: tiempoEstudioEnSegundos
  });
  return this.save();
};

// Método para finalizar sesión
sesionEstudioSchema.methods.finalizar = function(tiempoTotalSegundos, comentarios = '') {
  this.estado = 'finalizada';
  this.tiempoTotalSegundos = tiempoTotalSegundos;
  this.fechaFin = new Date();
  if (comentarios) {
    this.comentarios = comentarios;
  }
  return this.save();
};

// Método estático para obtener estadísticas de estudio por usuario
sesionEstudioSchema.statics.obtenerEstadisticasUsuario = function(usuarioId, fechaDesde, fechaHasta, compositor, obra) {
  const filtro = { usuario: usuarioId };
  
  if (compositor) filtro.compositor = new RegExp(compositor, 'i');
  if (obra) filtro.obra = new RegExp(obra, 'i');
  
  if (fechaDesde || fechaHasta) {
    filtro.fechaInicio = {};
    if (fechaDesde) {
      const fechaInicioDate = new Date(fechaDesde);
      fechaInicioDate.setHours(0, 0, 0, 0);
      filtro.fechaInicio.$gte = fechaInicioDate;
    }
    if (fechaHasta) {
      const fechaFinalDate = new Date(fechaHasta);
      fechaFinalDate.setHours(23, 59, 59, 999);
      filtro.fechaInicio.$lte = fechaFinalDate;
    }
  }
  
  return this.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: {
          compositor: '$compositor',
          obra: '$obra'
        },
        totalSesiones: { $sum: 1 },
        tiempoTotal: { $sum: '$tiempoTotalSegundos' },
        bpmPromedio: { $avg: '$bpmFinal' },
        ultimaSesion: { $max: '$fechaInicio' }
      }
    },
    {
      $project: {
        compositor: '$_id.compositor',
        obra: '$_id.obra',
        totalSesiones: 1,
        tiempoTotalMinutos: { $round: [{ $divide: ['$tiempoTotal', 60] }, 1] },
        bpmPromedio: { $round: ['$bpmPromedio', 0] },
        ultimaSesion: 1,
        _id: 0
      }
    },
    { $sort: { ultimaSesion: -1 } }
  ]);
};

export default mongoose.model('SesionEstudio', sesionEstudioSchema);
