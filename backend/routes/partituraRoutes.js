import express from 'express';
import {
  obtenerPartituras,
  obtenerPartiturasPorCompositor,
  buscarPartituras,
  crearPartitura,
  actualizarPartitura,
  eliminarPartitura
} from '../controllers/partituraController.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas
router.use(verificarToken);

// @route   GET /api/partituras
router.get('/', obtenerPartituras);

// @route   GET /api/partituras/buscar?q=termino
router.get('/buscar', buscarPartituras);

// @route   GET /api/partituras/compositor/:compositor
router.get('/compositor/:compositor', obtenerPartiturasPorCompositor);

// @route   POST /api/partituras (solo admin)
router.post('/', verificarAdmin, crearPartitura);

// @route   PUT /api/partituras/:id (solo admin)
router.put('/:id', verificarAdmin, actualizarPartitura);

// @route   DELETE /api/partituras/:id (solo admin)
router.delete('/:id', verificarAdmin, eliminarPartitura);

export default router;
