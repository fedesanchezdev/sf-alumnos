import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

// Generar JWT Token
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token válido por 7 días
  });
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que se proporcionen email y contraseña
    if (!email || !password) {
      return res.status(400).json({
        message: 'Por favor proporciona email y contraseña'
      });
    }

    // Buscar usuario por email (incluyendo password para comparación)
    const usuario = await Usuario.findOne({ email }).select('+password');

    if (!usuario) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const passwordValida = await usuario.compararPassword(password);

    if (!passwordValida) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save();

    // Generar token
    const token = generarToken(usuario._id);

    // Enviar respuesta (el password se excluye automáticamente por el método toJSON)
    res.json({
      message: 'Login exitoso',
      token,
      usuario: usuario.toJSON()
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/perfil
// @access  Private
export const obtenerPerfil = async (req, res) => {
  try {
    res.json({
      usuario: req.usuario
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Verificar token
// @route   GET /api/auth/verificar
// @access  Private
export const verificarToken = async (req, res) => {
  try {
    res.json({
      valido: true,
      usuario: req.usuario
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
