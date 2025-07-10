import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Esquema anterior (solo para leer datos existentes)
const movimientoSchemaAntiguo = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  duracion: String,
  _id: mongoose.Schema.Types.ObjectId
});

const partituraSchemaAntiguo = new mongoose.Schema({
  compositor: String,
  obra: String,
  partituraCello: String,
  partituraPiano: String,
  movimientos: [movimientoSchemaAntiguo],
  activo: Boolean
}, {
  timestamps: true
});

// Función principal de migración
const migrarPartituras = async () => {
  try {
    await connectDB();
    
    // Obtener todas las partituras existentes
    const partituras = await mongoose.connection.db.collection('partituras').find({}).toArray();
    
    console.log(`Encontradas ${partituras.length} partituras para migrar`);
    
    let migradas = 0;
    let sinCambios = 0;
    
    for (const partitura of partituras) {
      let necesitaMigracion = false;
      
      // Verificar si tiene movimientos con estructura antigua
      if (partitura.movimientos && partitura.movimientos.length > 0) {
        const movimientosNuevos = partitura.movimientos.map(mov => {
          // Si ya tiene la estructura nueva, no cambiar
          if (mov.audios !== undefined) {
            return mov;
          }
          
          // Si tiene estructura antigua, migrar
          if (mov.descripcion !== undefined || mov.duracion !== undefined) {
            necesitaMigracion = true;
            return {
              _id: mov._id,
              nombre: mov.nombre || '',
              subtitulo: mov.descripcion || mov.duracion || '',
              audios: []
            };
          }
          
          // Si no tiene ninguna estructura reconocida, crear estructura nueva
          necesitaMigracion = true;
          return {
            _id: mov._id,
            nombre: mov.nombre || '',
            subtitulo: '',
            audios: []
          };
        });
        
        if (necesitaMigracion) {
          // Actualizar la partitura con la nueva estructura
          await mongoose.connection.db.collection('partituras').updateOne(
            { _id: partitura._id },
            { 
              $set: { 
                movimientos: movimientosNuevos
              }
            }
          );
          
          console.log(`Migrada partitura: ${partitura.compositor} - ${partitura.obra}`);
          migradas++;
        } else {
          sinCambios++;
        }
      } else {
        sinCambios++;
      }
    }
    
    console.log(`\nMigración completada:`);
    console.log(`- Partituras migradas: ${migradas}`);
    console.log(`- Partituras sin cambios: ${sinCambios}`);
    console.log(`- Total procesadas: ${partituras.length}`);
    
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión cerrada');
  }
};

// Ejecutar migración
migrarPartituras();
