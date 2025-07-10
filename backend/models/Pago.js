import mongoose from 'mongoose';

const pagoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  fechaPago: {
    type: Date,
    required: true,
    default: Date.now
  },
  fechaInicio: {
    type: Date,
    required: false
  },
  fechaFin: {
    type: Date,
    required: false
  },
  descripcion: {
    type: String,
    default: ''
  },
  linkFactura: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        // Permitir string vacío o URL válida
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'El link de la factura debe ser una URL válida (http:// o https://)'
    }
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice compuesto para optimizar consultas
pagoSchema.index({ usuario: 1, fechaPago: -1 });

const Pago = mongoose.model('Pago', pagoSchema);

export default Pago;
