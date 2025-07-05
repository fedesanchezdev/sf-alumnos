import express from 'express';
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  cambiarContrasena,
  cambiarEstadoUsuario,
  eliminarUsuarioCompleto,
  obtenerFavoritos,
  agregarFavorito,
  quitarFavorito,
  alternarFavorito
} from '../controllers/usuarioController.js';
import { 
  verificarToken, 
  verificarAdmin, 
  verificarPropietarioOAdmin 
} from '../middleware/auth.js';

const router = express.Router();

// Aplicar verificación de token a todas las rutas
router.use(verificarToken);

// Rutas que requieren permisos de administrador
router.get('/', verificarAdmin, obtenerUsuarios);
router.post('/', verificarAdmin, crearUsuario);
router.delete('/:id', verificarAdmin, eliminarUsuario);
router.patch('/:id/estado', verificarAdmin, cambiarEstadoUsuario);
router.delete('/:id/completo', verificarAdmin, eliminarUsuarioCompleto);

// Rutas que pueden ser accedidas por el propietario o admin
router.get('/:id', verificarPropietarioOAdmin, obtenerUsuarioPorId);
router.put('/:id', verificarPropietarioOAdmin, actualizarUsuario);
router.put('/:id/cambiar-contrasena', verificarPropietarioOAdmin, cambiarContrasena);

// Rutas de favoritos
router.get('/:id/favoritos', verificarPropietarioOAdmin, obtenerFavoritos);
router.post('/:id/favoritos/:partituraId', verificarPropietarioOAdmin, agregarFavorito);
router.delete('/:id/favoritos/:partituraId', verificarPropietarioOAdmin, quitarFavorito);
router.put('/:id/favoritos/:partituraId', verificarPropietarioOAdmin, alternarFavorito);

export default router;
