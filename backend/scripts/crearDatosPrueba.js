import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Usuario from '../models/Usuario.js';
import Pago from '../models/Pago.js';
import Clase from '../models/Clase.js';

// Cargar variables de entorno
dotenv.config();

// Función helper para ajustar fechas y evitar problemas de zona horaria
const ajustarFecha = (fecha) => {
  const fechaAjustada = new Date(fecha);
  fechaAjustada.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de timezone
  return fechaAjustada;
};

// Función para generar fechas de clases semanales
const generarFechasClases = (fechaInicio, fechaFin) => {
  const fechas = [];
  const inicio = ajustarFecha(fechaInicio);
  const fin = ajustarFecha(fechaFin);
  
  let fechaActual = new Date(inicio);
  
  while (fechaActual <= fin) {
    fechas.push(new Date(fechaActual));
    fechaActual.setDate(fechaActual.getDate() + 7); // Agregar 7 días para clases semanales
  }
  
  return fechas;
};

const crearDatosPrueba = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un usuario llamado Santos
    let santos = await Usuario.findOne({ 
      $or: [
        { email: 'santos@ejemplo.com' },
        { nombre: 'Santos' }
      ]
    });

    // Si no existe, crear el usuario Santos
    if (!santos) {
      santos = new Usuario({
        nombre: 'Santos',
        apellido: 'García',
        email: 'santos@ejemplo.com',
        password: 'santos123',
        rol: 'usuario'
      });
      await santos.save();
      console.log('👤 Usuario Santos creado');
    } else {
      console.log('👤 Usuario Santos ya existe');
    }

    // Verificar si ya tiene pagos
    const pagoExistente = await Pago.findOne({ usuario: santos._id });
    
    if (!pagoExistente) {
      // Crear el pago de Santos: $130,000 para clases de junio 20-27 y julio 4-11
      const fechaInicio = ajustarFecha('2025-06-20');
      const fechaFin = ajustarFecha('2025-07-11');

      const pago = new Pago({
        usuario: santos._id,
        monto: 130000,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        descripcion: 'Pago de clases junio-julio'
      });

      await pago.save();
      console.log('💰 Pago de Santos creado: $130,000');

      // Generar fechas de clases semanales
      const fechasClases = generarFechasClases(fechaInicio, fechaFin);
      console.log('📅 Fechas de clases generadas:', fechasClases.map(f => f.toDateString()));

      // Crear las clases automáticamente
      const clases = fechasClases.map(fecha => ({
        usuario: santos._id,
        pago: pago._id,
        fecha: fecha,
        estado: 'no_iniciada'
      }));

      await Clase.insertMany(clases);
      console.log(`📚 ${clases.length} clases creadas para Santos`);

      // Mostrar resumen
      console.log('\n📋 RESUMEN DEL PAGO Y CLASES:');
      console.log(`👤 Usuario: ${santos.nombre} ${santos.apellido} (${santos.email})`);
      console.log(`💰 Monto: $${pago.monto.toLocaleString()}`);
      console.log(`📅 Período: ${pago.fechaInicio.toDateString()} - ${pago.fechaFin.toDateString()}`);
      console.log(`📚 Clases programadas: ${clases.length}`);
      
      fechasClases.forEach((fecha, index) => {
        console.log(`   ${index + 1}. ${fecha.toDateString()}`);
      });

    } else {
      console.log('💰 Santos ya tiene pagos registrados');
      
      // Mostrar las clases existentes
      const clases = await Clase.find({ usuario: santos._id })
        .populate('pago', 'monto descripcion')
        .sort({ fecha: 1 });
      
      console.log('\n📋 CLASES EXISTENTES:');
      clases.forEach((clase, index) => {
        const estado = {
          'no_iniciada': '⚪ No iniciada',
          'tomada': '🟢 Tomada',
          'ausente': '🔴 Ausente',
          'reprogramar': '🟡 Reprogramar',
          'recuperada': '🟣 Recuperada'
        };
        console.log(`   ${index + 1}. ${clase.fecha.toDateString()} - ${estado[clase.estado] || clase.estado}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
};

crearDatosPrueba();
