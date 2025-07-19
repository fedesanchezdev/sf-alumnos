import express from 'express';
import {
  crearPago,
  obtenerPagos,
  obtenerPagosPorUsuario,
  actualizarPago,
  eliminarPago,
  agregarClasesIndividuales
} from '../controllers/pagoController.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas para administradores
router.use(verificarToken);

// @route   POST /api/pagos
router.post('/', verificarAdmin, crearPago);

// @route   GET /api/pagos
router.get('/', verificarAdmin, obtenerPagos);

// @route   GET /api/pagos/usuario/:usuarioId
router.get('/usuario/:usuarioId', obtenerPagosPorUsuario);

// @route   PUT /api/pagos/:id
router.put('/:id', verificarAdmin, actualizarPago);

// @route   DELETE /api/pagos/:id
router.delete('/:id', verificarAdmin, eliminarPago);

// @route   POST /api/pagos/:id/clases
router.post('/:id/clases', verificarAdmin, agregarClasesIndividuales);

export default router;
