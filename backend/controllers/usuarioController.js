import Usuario from '../models/Usuario.js';
import bcrypt from 'bcryptjs';

// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Private (Admin)
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find({})
      .select('-password')
      .sort({ fechaCreacion: -1 });

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/usuarios/:id
// @access  Private (Admin o mismo usuario)
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Crear nuevo usuario
// @route   POST /api/usuarios
// @access  Private (Admin)
export const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, password, rol } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios'
      });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        message: 'Ya existe un usuario con este email'
      });
    }

    // Crear nuevo usuario
    const usuario = new Usuario({
      nombre,
      apellido,
      email,
      telefono,
      password,
      rol: rol || 'usuario'
    });

    await usuario.save();

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: usuario.toJSON()
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Error de validación',
        errores
      });
    }

    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/usuarios/:id
// @access  Private (Admin o mismo usuario)
export const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, rol, password } = req.body;
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Si se proporciona un nuevo email, verificar que no esté en uso
    if (email && email !== usuario.email) {
      const emailExistente = await Usuario.findOne({ email });
      if (emailExistente) {
        return res.status(400).json({
          message: 'Ya existe un usuario con este email'
        });
      }
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (email) usuario.email = email;
    if (telefono !== undefined) usuario.telefono = telefono; // Permitir vacío
    
    // Solo admin puede cambiar roles
    if (rol && req.usuario.rol === 'administrador') {
      usuario.rol = rol;
    }

    // Si se proporciona nueva contraseña, hashearla
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }
      usuario.password = password; // Se hasheará automáticamente por el middleware
    }

    await usuario.save();

    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: usuario.toJSON()
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Error de validación',
        errores
      });
    }

    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Eliminar usuario
// @route   DELETE /api/usuarios/:id
// @access  Private (Admin)
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir que el admin se elimine a sí mismo
    if (req.usuario._id.toString() === id) {
      return res.status(400).json({
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    await Usuario.findByIdAndDelete(id);

    res.json({
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Cambiar contraseña
// @route   PUT /api/usuarios/:id/cambiar-contrasena
// @access  Private (Admin o mismo usuario)
export const cambiarContrasena = async (req, res) => {
  try {
    const { contrasenaActual, nuevaContrasena } = req.body;
    const { id } = req.params;

    if (!contrasenaActual || !nuevaContrasena) {
      return res.status(400).json({
        message: 'Se requiere la contraseña actual y la nueva contraseña'
      });
    }

    if (nuevaContrasena.length < 6) {
      return res.status(400).json({
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const usuario = await Usuario.findById(id).select('+password');
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const passwordValida = await usuario.compararPassword(contrasenaActual);
    if (!passwordValida) {
      return res.status(400).json({
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Actualizar contraseña
    usuario.password = nuevaContrasena; // Se hasheará automáticamente
    await usuario.save();

    res.json({
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Pausar/Reactivar usuario
// @route   PATCH /api/usuarios/:id/estado
// @access  Private (Admin)
export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        message: 'El estado debe ser un valor booleano'
      });
    }

    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // No permitir pausar administradores
    if (usuario.rol === 'administrador' && !activo) {
      return res.status(400).json({
        message: 'No se puede pausar un usuario administrador'
      });
    }

    usuario.activo = activo;
    await usuario.save();

    res.json({
      message: `Usuario ${activo ? 'reactivado' : 'pausado'} exitosamente`,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        activo: usuario.activo
      }
    });

  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Eliminar usuario y todos sus datos asociados
// @route   DELETE /api/usuarios/:id/completo
// @access  Private (Admin)
export const eliminarUsuarioCompleto = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar administradores
    if (usuario.rol === 'administrador') {
      return res.status(400).json({
        message: 'No se puede eliminar un usuario administrador'
      });
    }

    // Importar modelos aquí para evitar dependencias circulares
    const Pago = (await import('../models/Pago.js')).default;
    const Clase = (await import('../models/Clase.js')).default;

    // Contar elementos a eliminar para mostrar estadísticas
    const pagosCount = await Pago.countDocuments({ usuario: req.params.id });
    const clasesCount = await Clase.countDocuments({ usuario: req.params.id });

    // Eliminar en orden: primero clases, luego pagos, finalmente usuario
    const clasesEliminadas = await Clase.deleteMany({ usuario: req.params.id });
    const pagosEliminados = await Pago.deleteMany({ usuario: req.params.id });
    await Usuario.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Usuario y todos sus datos eliminados exitosamente',
      estadisticas: {
        usuario: usuario.nombre + ' ' + usuario.apellido,
        clasesEliminadas: clasesEliminadas.deletedCount,
        pagosEliminados: pagosEliminados.deletedCount
      }
    });

  } catch (error) {
    console.error('Error al eliminar usuario completo:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener favoritos de un usuario
// @route   GET /api/usuarios/:id/favoritos
// @access  Private (mismo usuario o admin)
export const obtenerFavoritos = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .populate('favoritosPartituras')
      .select('favoritosPartituras');

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    res.json(usuario.favoritosPartituras || []);
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Agregar partitura a favoritos
// @route   POST /api/usuarios/:id/favoritos/:partituraId
// @access  Private (mismo usuario o admin)
export const agregarFavorito = async (req, res) => {
  try {
    const { id, partituraId } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si ya está en favoritos
    if (usuario.favoritosPartituras.includes(partituraId)) {
      return res.status(400).json({
        message: 'La partitura ya está en favoritos'
      });
    }

    usuario.favoritosPartituras.push(partituraId);
    await usuario.save();

    res.json({
      message: 'Partitura agregada a favoritos',
      favoritos: usuario.favoritosPartituras
    });
  } catch (error) {
    console.error('Error al agregar favorito:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Quitar partitura de favoritos
// @route   DELETE /api/usuarios/:id/favoritos/:partituraId
// @access  Private (mismo usuario o admin)
export const quitarFavorito = async (req, res) => {
  try {
    const { id, partituraId } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Quitar de favoritos
    usuario.favoritosPartituras = usuario.favoritosPartituras.filter(
      fav => fav.toString() !== partituraId
    );

    await usuario.save();

    res.json({
      message: 'Partitura quitada de favoritos',
      favoritos: usuario.favoritosPartituras
    });
  } catch (error) {
    console.error('Error al quitar favorito:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// @desc    Alternar favorito (agregar/quitar)
// @route   PUT /api/usuarios/:id/favoritos/:partituraId
// @access  Private (mismo usuario o admin)
export const alternarFavorito = async (req, res) => {
  try {
    const { id, partituraId } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    const estaEnFavoritos = usuario.favoritosPartituras.includes(partituraId);
    
    if (estaEnFavoritos) {
      // Quitar de favoritos
      usuario.favoritosPartituras = usuario.favoritosPartituras.filter(
        fav => fav.toString() !== partituraId
      );
    } else {
      // Agregar a favoritos
      usuario.favoritosPartituras.push(partituraId);
    }

    await usuario.save();

    res.json({
      message: estaEnFavoritos ? 'Partitura quitada de favoritos' : 'Partitura agregada a favoritos',
      favoritos: usuario.favoritosPartituras,
      esFavorito: !estaEnFavoritos
    });
  } catch (error) {
    console.error('Error al alternar favorito:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
