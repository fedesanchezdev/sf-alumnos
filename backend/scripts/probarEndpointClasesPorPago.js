// Script para probar el endpoint de clases por pago
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB');

// Generar token de admin
const adminToken = jwt.sign(
  { 
    id: '686346e82b5fd9dfb8e38852',
    email: 'admin@sistema.com',
    rol: 'admin'
  }, 
  process.env.JWT_SECRET, 
  { expiresIn: '24h' }
);

console.log('🔑 Token de admin generado:', adminToken);

// Probar el endpoint
const pagoId = '68649ffd9d8a1074fa5fe573'; // ID de uno de los pagos que falló
const url = `http://localhost:5000/api/clases/pago/${pagoId}`;

try {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });

  console.log(`📊 Estado de respuesta: ${response.status}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log('✅ Endpoint funcionando correctamente');
    console.log(`📚 Clases encontradas: ${data.length}`);
    console.log('Datos:', JSON.stringify(data, null, 2));
  } else {
    const errorData = await response.text();
    console.log('❌ Error en endpoint:', errorData);
  }
  
} catch (error) {
  console.error('❌ Error al probar endpoint:', error.message);
}

// Cerrar conexión
await mongoose.connection.close();
console.log('🔌 Conexión cerrada');
