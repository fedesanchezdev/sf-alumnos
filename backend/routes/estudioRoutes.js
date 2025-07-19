import express from 'express';
import { 
  obtenerEstudios,
  obtenerEstudiosPorUsuario,
  crearEstudio,
  actualizarEstudio,
  eliminarEstudio,
  finalizarEstudio
} from '../controllers/estudioController.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(verificarToken);

// Rutas para gestión de estudios
router.get('/', obtenerEstudios);
router.get('/usuario/:usuarioId', obtenerEstudiosPorUsuario);
router.post('/', crearEstudio);
router.put('/:id', actualizarEstudio);
router.delete('/:id', eliminarEstudio);
router.patch('/:id/finalizar', finalizarEstudio);

export default router;
