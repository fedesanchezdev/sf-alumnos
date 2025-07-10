import React, { createContext, useContext, useState, useEffect } from 'react';
import { usuariosService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la aplicación
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    
    if (token && usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Intentando login con:', { email, password: '***' });
      console.log('API URL:', import.meta.env.VITE_API_URL);
      
      const response = await usuariosService.login({ email, password });
      console.log('Respuesta del servidor:', response);
      
      const { token, usuario: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(userData));
      setUsuario(userData);
      
      console.log('Usuario logueado:', userData);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      console.error('Detalles del error:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const isAdmin = () => {
    return usuario?.rol === 'administrador';
  };

  const isAuthenticated = () => {
    return usuario !== null;
  };

  const value = {
    usuario,
    login,
    logout,
    isAdmin,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
