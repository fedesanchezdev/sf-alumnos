import express from 'express';
import { login, obtenerPerfil, verificarToken } from '../controllers/authController.js';
import { verificarToken as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/login', login);

// Rutas protegidas
router.get('/perfil', authMiddleware, obtenerPerfil);
router.get('/verificar', authMiddleware, verificarToken);

export default router;
