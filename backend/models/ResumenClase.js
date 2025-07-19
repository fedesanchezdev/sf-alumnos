import mongoose from 'mongoose';

const obraEstudiadaSchema = new mongoose.Schema({
  partitura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partitura',
    required: false // Ya no es requerido para permitir obras manuales
  },
  compositor: {
    type: String,
    required: true
  },
  obra: {
    type: String,
    required: true
  },
  movimientosCompases: {
    type: String,
    default: ''
  },
  comentarios: {
    type: String,
    default: ''
  },
  esManual: {
    type: Boolean,
    default: false
  }
});

const resumenClaseSchema = new mongoose.Schema({
  clase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clase',
    required: true,
    unique: true // Un resumen por clase
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  obrasEstudiadas: [obraEstudiadaSchema],
  objetivosProximaClase: {
    type: String,
    default: ''
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
resumenClaseSchema.index({ clase: 1 });
resumenClaseSchema.index({ usuario: 1, createdAt: -1 });
resumenClaseSchema.index({ 'obrasEstudiadas.partitura': 1 });
resumenClaseSchema.index({ 'obrasEstudiadas.compositor': 1 });

const ResumenClase = mongoose.model('ResumenClase', resumenClaseSchema);

export default ResumenClase;
