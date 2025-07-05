import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'La URL del audio debe ser válida (http:// o https://)'
    }
  }
});

const movimientoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  subtitulo: {
    type: String,
    default: ''
  },
  audios: [audioSchema]
});

const partituraSchema = new mongoose.Schema({
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
  partituraCello: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'La URL de la partitura debe ser válida (http:// o https://)'
    }
  },
  partituraPiano: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'La URL de la partitura debe ser válida (http:// o https://)'
    }
  },
  movimientos: [movimientoSchema],
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para optimizar búsquedas
partituraSchema.index({ compositor: 1 });
partituraSchema.index({ obra: 1 });
partituraSchema.index({ 'movimientos.nombre': 1 });
partituraSchema.index({ 'movimientos.audios.nombre': 1 });

const Partitura = mongoose.model('Partitura', partituraSchema);

export default Partitura;
