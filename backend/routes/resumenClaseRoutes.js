import express from 'express';
import {
  obtenerResumenPorClase,
  obtenerResumenesPorUsuario,
  crearOActualizarResumen,
  eliminarResumen,
  obtenerEstadisticasUsuario
} from '../controllers/resumenClaseController.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas
router.use(verificarToken);

// @route   GET /api/resumenes-clase/clase/:claseId
router.get('/clase/:claseId', obtenerResumenPorClase);

// @route   GET /api/resumenes-clase/usuario/:usuarioId
router.get('/usuario/:usuarioId', obtenerResumenesPorUsuario);

// @route   GET /api/resumenes-clase/estadisticas/:usuarioId
router.get('/estadisticas/:usuarioId', obtenerEstadisticasUsuario);

// @route   POST /api/resumenes-clase
router.post('/', crearOActualizarResumen);

// @route   DELETE /api/resumenes-clase/:id
router.delete('/:id', eliminarResumen);

export default router;
