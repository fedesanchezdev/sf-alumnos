import express from 'express';
import { body } from 'express-validator';
import { verificarToken } from '../middleware/auth.js';
import {
  crearSesionEstudio,
  obtenerSesionActiva,
  actualizarSesion,
  finalizarSesion,
  obtenerHistorialSesiones,
  obtenerEstadisticas,
  obtenerObrasUsuario,
  eliminarSesion,
  editarSesion,
  obtenerSesionPorId,
  compartirSesionConProfesor,
  obtenerSesionesCompartidas,
  agregarComentarioProfesor,
  crearSesionPrueba
} from '../controllers/sesionEstudioController.js';

const router = express.Router();

// POST /api/sesiones-estudio/crear-prueba - TEMPORAL: Crear sesión compartida de prueba (sin auth)
router.post('/crear-prueba', (req, res, next) => {
  // Saltear autenticación para este endpoint temporal
  req.usuario = { _id: '686346e82b5fd9dfb8e38852', rol: 'administrador' };
  next();
}, crearSesionPrueba);

// Aplicar autenticación a todas las rutas restantes
router.use(verificarToken);

// Validaciones para crear sesión
const validacionCrearSesion = [
  body('compositor')
    .notEmpty()
    .withMessage('El compositor es obligatorio')
    .isLength({ min: 1, max: 100 })
    .withMessage('El compositor debe tener entre 1 y 100 caracteres'),
  
  body('obra')
    .notEmpty()
    .withMessage('La obra es obligatoria')
    .isLength({ min: 1, max: 150 })
    .withMessage('La obra debe tener entre 1 y 150 caracteres'),
  
  body('movimientoPieza')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El movimiento/pieza no puede exceder 100 caracteres'),
  
  body('compasesEstudiados')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Los compases no pueden exceder 50 caracteres'),
  
  body('bpmInicial')
    .optional()
    .isInt({ min: 40, max: 300 })
    .withMessage('El BPM inicial debe estar entre 40 y 300')
];

// Validaciones para actualizar sesión
const validacionActualizarSesion = [
  body('bpm')
    .optional()
    .isInt({ min: 40, max: 300 })
    .withMessage('El BPM debe estar entre 40 y 300'),
  
  body('tiempoEstudioEnSegundos')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo debe ser un número positivo'),
  
  body('estado')
    .optional()
    .isIn(['activa', 'pausada', 'finalizada'])
    .withMessage('Estado inválido'),
  
  body('movimientoPieza')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El movimiento/pieza no puede exceder 100 caracteres'),
  
  body('compasesEstudiados')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Los compases no pueden exceder 50 caracteres'),
  
  body('comentarios')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Los comentarios no pueden exceder 500 caracteres')
];

// Validaciones para finalizar sesión
const validacionFinalizarSesion = [
  body('tiempoTotalSegundos')
    .notEmpty()
    .isInt({ min: 0 })
    .withMessage('El tiempo total es obligatorio y debe ser positivo'),
  
  body('comentarios')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Los comentarios no pueden exceder 500 caracteres'),
  
  body('bpmFinal')
    .optional()
    .isInt({ min: 40, max: 300 })
    .withMessage('El BPM final debe estar entre 40 y 300')
];

// Validaciones para editar sesión
const validacionEditarSesion = [
  body('compositor')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El compositor debe tener entre 1 y 100 caracteres'),
  
  body('obra')
    .optional()
    .isLength({ min: 1, max: 150 })
    .withMessage('La obra debe tener entre 1 y 150 caracteres'),
  
  body('movimientoPieza')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El movimiento/pieza no puede exceder 100 caracteres'),
  
  body('compasesEstudiados')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Los compases no pueden exceder 50 caracteres'),
  
  body('comentarios')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Los comentarios no pueden exceder 500 caracteres'),

  body('tiempoTotalSegundos')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo total debe ser positivo'),

  body('bpmInicial')
    .optional()
    .isInt({ min: 40, max: 300 })
    .withMessage('El BPM inicial debe estar entre 40 y 300'),

  body('bpmFinal')
    .optional()
    .isInt({ min: 40, max: 300 })
    .withMessage('El BPM final debe estar entre 40 y 300')
];

// POST /api/sesiones-estudio - Crear nueva sesión
router.post('/', validacionCrearSesion, crearSesionEstudio);

// GET /api/sesiones-estudio/activa - Obtener sesión activa
router.get('/activa', obtenerSesionActiva);

// GET /api/sesiones-estudio/historial - Obtener historial de sesiones
router.get('/historial', obtenerHistorialSesiones);

// GET /api/sesiones-estudio/estadisticas - Obtener estadísticas
router.get('/estadisticas', obtenerEstadisticas);

// GET /api/sesiones-estudio/obras - Obtener obras del usuario para selector
router.get('/obras', obtenerObrasUsuario);

// GET /api/sesiones-estudio/compartidas - Obtener sesiones compartidas (solo profesores)
router.get('/compartidas', obtenerSesionesCompartidas);

// POST /api/sesiones-estudio/crear-prueba - TEMPORAL: Crear sesión compartida de prueba (sin auth)
router.post('/crear-prueba', (req, res, next) => {
  // Saltear autenticación para este endpoint temporal
  req.usuario = { _id: '686346e82b5fd9dfb8e38852', rol: 'administrador' };
  next();
}, crearSesionPrueba);

// Aplicar autenticación a todas las rutas restantes
router.use('*', verificarToken);

// GET /api/sesiones-estudio/:id - Obtener sesión específica por ID
router.get('/:id', obtenerSesionPorId);

// PUT /api/sesiones-estudio/:id - Actualizar sesión (cambios de metrónomo, etc.)
router.put('/:id', validacionActualizarSesion, actualizarSesion);

// PUT /api/sesiones-estudio/:id/finalizar - Finalizar sesión
router.put('/:id/finalizar', validacionFinalizarSesion, finalizarSesion);

// PUT /api/sesiones-estudio/:id/editar - Editar sesión
router.put('/:id/editar', validacionEditarSesion, editarSesion);

// POST /api/sesiones-estudio/:id/compartir - Compartir sesión con profesor
router.post('/:id/compartir', [
  body('compartir')
    .isBoolean()
    .withMessage('El campo compartir debe ser true o false'),
  
  body('comentarioAlumno')
    .optional()
    .isLength({ max: 500 })
    .withMessage('El comentario no puede exceder 500 caracteres')
], compartirSesionConProfesor);

// POST /api/sesiones-estudio/:id/comentario-profesor - Agregar comentario del profesor
router.post('/:id/comentario-profesor', [
  body('comentarioProfesor')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('El comentario del profesor no puede exceder 1000 caracteres')
], agregarComentarioProfesor);

// DELETE /api/sesiones-estudio/:id - Eliminar sesión
router.delete('/:id', eliminarSesion);

export default router;
