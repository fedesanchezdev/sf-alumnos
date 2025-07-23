import express from 'express';
import { verificarToken } from '../middleware/auth.js';
import {
  obtenerNotificaciones,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas
} from '../controllers/notificacionController.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(verificarToken);

// GET /api/notificaciones - Obtener notificaciones del usuario
router.get('/', obtenerNotificaciones);

// GET /api/notificaciones/no-leidas - Contar notificaciones no leídas
router.get('/no-leidas', contarNoLeidas);

// PUT /api/notificaciones/:id/leida - Marcar notificación como leída
router.put('/:id/leida', marcarComoLeida);

// PUT /api/notificaciones/marcar-todas-leidas - Marcar todas como leídas
router.put('/marcar-todas-leidas', marcarTodasComoLeidas);

export default router;
