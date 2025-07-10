import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-slate-700 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Título */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-white text-xl font-bold hover:text-slate-300 flex items-center space-x-2">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
              </svg>
              <span>Clases de Violoncello</span>
            </Link>
          </div>

          {/* Usuario y Cerrar Sesión */}
          <div className="flex items-center space-x-4">
            <div className="text-white text-sm">
              <span className="font-medium">{usuario?.nombre} {usuario?.apellido}</span>
              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                usuario?.rol === 'administrador'
                  ? 'bg-violet-200 text-violet-900' 
                  : 'bg-emerald-200 text-emerald-900'
              }`}>
                {usuario?.rol}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-slate-600 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
