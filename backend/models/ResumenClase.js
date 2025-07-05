import mongoose from 'mongoose';

const obraEstudiadaSchema = new mongoose.Schema({
  partitura: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partitura',
    required: true
  },
  movimientosEstudiados: [{
    movimientoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    nombre: {
      type: String,
      required: true
    },
    comentarios: {
      type: String,
      default: ''
    }
  }],
  comentarios: {
    type: String,
    default: ''
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
  comentariosGenerales: {
    type: String,
    default: ''
  },
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

const ResumenClase = mongoose.model('ResumenClase', resumenClaseSchema);

export default ResumenClase;
