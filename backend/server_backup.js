import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import conectarDB app.listen(PORT, () => {
  console.log(`
🚀 Servidor iniciado exitosamente
📍 URL: http://localhost:${PORT}
🌍 Entorno: ${process.env.NODE_ENV}
📊 Rutas disponibles:
   • GET  /api/test
   • GET  /api/health  
   • POST /api/auth/login
   • GET  /api/auth/perfil
   • GET  /api/usuarios
   • POST /api/usuarios
   • PUT  /api/usuarios/:id
   • DELETE /api/usuarios/:id
   • GET  /api/pagos
   • POST /api/pagos
   • GET  /api/pagos/usuario/:usuarioId
   • PUT  /api/pagos/:id
   • DELETE /api/pagos/:id
   • GET  /api/clases
   • GET  /api/clases/usuario/:usuarioId
   • GET  /api/clases/resumen/:usuarioId
   • GET  /api/clases/fecha/:fecha
   • PUT  /api/clases/:id/estado
`);g/database.js';
import authRoutes from './routes/authRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import pagoRoutes from './routes/pagoRoutes.js';
import claseRoutes from './routes/claseRoutes.js';

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
conectarDB();

const app = express();

// Middleware de CORS
app.use(cors({
  origin: [
    'http://localhost:5173', // Frontend en desarrollo
    'http://localhost:5174', // Frontend en desarrollo (puerto alternativo)
    'http://localhost:3000', // Frontend alternativo
    'https://tu-dominio-frontend.com' // Frontend en producción
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging para desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
  });
}

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/clases', claseRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({
    message: '🚀 Servidor backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Ruta de estado de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      'GET /api/test',
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/auth/perfil',
      'GET /api/usuarios',
      'POST /api/usuarios',
      'PUT /api/usuarios/:id',
      'DELETE /api/usuarios/:id',
      'GET /api/pagos',
      'POST /api/pagos',
      'GET /api/pagos/usuario/:usuarioId',
      'PUT /api/pagos/:id',
      'DELETE /api/pagos/:id',
      'GET /api/clases',
      'GET /api/clases/usuario/:usuarioId',
      'GET /api/clases/resumen/:usuarioId',
      'GET /api/clases/fecha/:fecha',
      'PUT /api/clases/:id/estado'
    ]
  });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  
  res.status(error.status || 500).json({
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 Servidor iniciado exitosamente
📍 URL: http://localhost:${PORT}
🌍 Entorno: ${process.env.NODE_ENV}
📊 Rutas disponibles:
   • GET  /api/test
   • GET  /api/health  
   • POST /api/auth/login
   • GET  /api/auth/perfil
   • GET  /api/usuarios
   • POST /api/usuarios
   • PUT  /api/usuarios/:id
   • DELETE /api/usuarios/:id
  `);
});
