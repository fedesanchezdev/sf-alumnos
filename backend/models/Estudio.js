import mongoose from 'mongoose';

const estudioSchema = new mongoose.Schema({
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
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFinalizacionSugerida: {
    type: Date,
    required: false
  },
  fechaFinalizada: {
    type: Date,
    default: null
  },
  porcentajeProgreso: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  estado: {
    type: String,
    enum: ['en_progreso', 'finalizado', 'pausado'],
    default: 'en_progreso'
  },
  notas: {
    type: String,
    trim: true,
    default: ''
  },
  // Referencia opcional a partitura si existe en el sistema
  partitura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partitura',
    default: null
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
estudioSchema.index({ usuario: 1, estado: 1 });
estudioSchema.index({ fechaInicio: 1 });
estudioSchema.index({ fechaFinalizacionSugerida: 1 });

// Métodos virtuales eliminados - ya no se calculan días restantes ni retrasos

// Incluir virtuals cuando se convierte a JSON
estudioSchema.set('toJSON', { virtuals: true });
estudioSchema.set('toObject', { virtuals: true });

export default mongoose.model('Estudio', estudioSchema);
