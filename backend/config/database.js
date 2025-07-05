import mongoose from 'mongoose';

const conectarDB = async () => {
  try {
    const conexion = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB conectado: ${conexion.connection.host}`);
    
    // Configurar eventos de conexión
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose desconectado de MongoDB');
    });

    // Manejar cierre de la aplicación
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Conexión MongoDB cerrada por cierre de aplicación');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error al conectar MongoDB:', error.message);
    process.exit(1);
  }
};

export default conectarDB;
