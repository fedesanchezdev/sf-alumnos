import express from 'express';
import {
  obtenerClasesPorUsuario,
  obtenerTodasLasClases,
  actualizarEstadoClase,
  obtenerResumenClases,
  obtenerClasesPorFecha,
  obtenerClasesSeparadas,
  obtenerClasesPorPago,
  obtenerEstudiantesPorDia
} from '../controllers/claseController.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas
router.use(verificarToken);

// @route   GET /api/clases
router.get('/', verificarAdmin, obtenerTodasLasClases);

// @route   GET /api/clases/estudiantes-por-dia
router.get('/estudiantes-por-dia', verificarAdmin, obtenerEstudiantesPorDia);

// @route   GET /api/clases/usuario/:usuarioId/separadas (DEBE IR ANTES que la ruta genérica)
router.get('/usuario/:usuarioId/separadas', obtenerClasesSeparadas);

// @route   GET /api/clases/usuario/:usuarioId
router.get('/usuario/:usuarioId', obtenerClasesPorUsuario);

// @route   GET /api/clases/resumen/:usuarioId
router.get('/resumen/:usuarioId', obtenerResumenClases);

// @route   GET /api/clases/fecha/:fecha
router.get('/fecha/:fecha', verificarAdmin, obtenerClasesPorFecha);

// @route   GET /api/clases/pago/:pagoId
router.get('/pago/:pagoId', obtenerClasesPorPago);

// @route   PUT /api/clases/:id/estado
router.put('/:id/estado', actualizarEstadoClase);

export default router;
