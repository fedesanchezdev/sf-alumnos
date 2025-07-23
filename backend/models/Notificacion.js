import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: ['sesion_compartida', 'comentario_profesor', 'comentario_alumno'],
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  sesionEstudio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SesionEstudio'
  },
  leida: {
    type: Boolean,
    default: false
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaLeida: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
notificacionSchema.index({ usuario: 1, leida: 1 });
notificacionSchema.index({ fechaCreacion: -1 });

const Notificacion = mongoose.model('Notificacion', notificacionSchema);

export default Notificacion;
