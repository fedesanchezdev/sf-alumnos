import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import conectarDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import pagoRoutes from './routes/pagoRoutes.js';
import claseRoutes from './routes/claseRoutes.js';
import partituraRoutes from './routes/partituraRoutes.js';
import resumenClaseRoutes from './routes/resumenClaseRoutes.js';
import estudioRoutes from './routes/estudioRoutes.js';

// Version: 2.3 - FINAL DEPLOY with complete Partitura model and all routes

// Configurar variables de entorno
dotenv.config();

// Conectar a la base de datos
conectarDB();

const app = express();

// Middleware de CORS
const allowedOrigins = [
  'http://localhost:5173', // Frontend en desarrollo
  'http://localhost:5174', // Frontend en desarrollo (puerto alternativo)
  'http://localhost:5175', // Frontend en desarrollo (puerto alternativo 2)
  'http://localhost:3000', // Frontend alternativo
  process.env.FRONTEND_URL, // URL configurada en variables de entorno
  'https://federicosanchez.com.ar', // Frontend en producción (Hostinger)
  'http://federicosanchez.com.ar', // Frontend en producción (Hostinger - HTTP)
  'https://www.federicosanchez.com.ar', // Frontend con www
  'http://www.federicosanchez.com.ar', // Frontend con www (HTTP)
].filter(Boolean); // Remover valores undefined/null

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (móvil, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // En desarrollo, permitir cualquier localhost
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
app.use('/api/partituras', partituraRoutes);
app.use('/api/resumenes-clase', resumenClaseRoutes);
app.use('/api/estudios', estudioRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Servidor backend funcionando correctamente',
    version: '2.3',
    features: ['updated-partitura-model', 'subtitulo-audios-support', 'migration-complete', 'all-routes-active'],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployed: 'FINAL VERSION'
  });
});

// Ruta de verificación de versión
app.get('/api/version', (req, res) => {
  res.json({
    version: '2.3',
    model: 'updated-partitura-schema',
    deployed: new Date().toISOString(),
    commit: 'final-deployment',
    status: 'PRODUCTION READY'
  });
});

// Health check para Render.com
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'sf-alumnos-backend',
    database: 'Connected'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      'GET /api/test',
      'GET /api/version',
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
      'POST /api/pagos/:id/clases',
      'GET /api/clases',
      'GET /api/clases/usuario/:usuarioId',
      'GET /api/clases/resumen/:usuarioId',
      'GET /api/clases/fecha/:fecha',
      'PUT /api/clases/:id/estado',
      'GET /api/partituras',
      'POST /api/partituras',
      'PUT /api/partituras/:id',
      'DELETE /api/partituras/:id'
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
   • GET  /api/pagos
   • POST /api/pagos
   • GET  /api/pagos/usuario/:usuarioId
   • PUT  /api/pagos/:id
   • DELETE /api/pagos/:id
   • POST /api/pagos/:id/clases
   • GET  /api/clases
   • GET  /api/clases/usuario/:usuarioId
   • GET  /api/clases/resumen/:usuarioId
   • GET  /api/clases/fecha/:fecha
   • PUT  /api/clases/:id/estado
   • GET  /api/partituras
   • GET  /api/partituras/buscar
   • POST /api/partituras
   • PUT  /api/partituras/:id
   • GET  /api/resumenes-clase/clase/:claseId
   • GET  /api/resumenes-clase/usuario/:usuarioId
   • POST /api/resumenes-clase
   • DELETE /api/resumenes-clase/:id
`);

  if (process.env.MONGODB_URI) {
    console.log('✅ MongoDB conectado:', process.env.MONGODB_URI.split('@')[1]?.split('/')[0] || 'localhost');
  }
});
