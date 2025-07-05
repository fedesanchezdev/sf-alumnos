import mongoose from 'mongoose';

const claseSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  pago: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pago',
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['no_iniciada', 'tomada', 'ausente', 'reprogramar', 'recuperada'],
    default: 'no_iniciada'
  },
  notas: {
    type: String,
    default: ''
  },
  fechaReprogramada: {
    type: Date
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice compuesto para optimizar consultas
claseSchema.index({ usuario: 1, fecha: 1 });
claseSchema.index({ pago: 1 });

const Clase = mongoose.model('Clase', claseSchema);

export default Clase;
