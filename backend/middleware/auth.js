import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

// Middleware para verificar el token JWT
export const verificarToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        message: 'Acceso denegado. No se proporcionó token.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        message: 'Token inválido. Usuario no encontrado.'
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido.',
      error: error.message
    });
  }
};

// Middleware para verificar si es administrador
export const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

// Middleware para verificar si el usuario puede modificar el recurso
export const verificarPropietarioOAdmin = (req, res, next) => {
  const { id } = req.params;
  
  // Si es administrador, puede modificar cualquier usuario
  if (req.usuario.rol === 'administrador') {
    return next();
  }
  
  // Si no es admin, solo puede modificar su propio perfil
  if (req.usuario._id.toString() !== id) {
    return res.status(403).json({
      message: 'Acceso denegado. Solo puedes modificar tu propio perfil.'
    });
  }
  
  next();
};
