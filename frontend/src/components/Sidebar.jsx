import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = isAdmin() ? [
    // Orden para administradores
    {
      name: 'Gestión de Clases',
      path: '/clases',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      allowedFor: 'admin'
    },
    {
      name: 'Partituras',
      path: '/partituras',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
        </svg>
      ),
      allowedFor: 'admin'
    },
    {
      name: 'Gestión de Pagos',
      path: '/pagos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      allowedFor: 'admin'
    },
    {
      name: 'Admin Partituras',
      path: '/admin-partituras',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      allowedFor: 'admin'
    },
    {
      name: 'Gestión de Estudios',
      path: '/estudios',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      allowedFor: 'admin'
    },
    {
      name: 'Sesiones Compartidas',
      path: '/sesiones-compartidas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      allowedFor: 'admin'
    },
    {
      name: 'Gestión de Usuarios',
      path: '/usuarios',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      allowedFor: 'admin'
    },
    {
      name: 'Cambiar Contraseña',
      path: '/cambiar-contrasena',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      allowedFor: 'admin'
    }
  ] : [
    // Orden para usuarios normales: Mis clases, Partituras, Mis pagos, Cambiar contraseña
    {
      name: 'Mis Clases',
      path: '/mis-clases',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      allowedFor: 'user'
    },
    {
      name: 'Mis Estudios',
      path: '/mis-estudios',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      allowedFor: 'user'
    },
    {
      name: 'Sesión de Estudio',
      path: '/sesion-estudio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      allowedFor: 'user'
    },
    {
      name: 'Historial de Sesiones',
      path: '/historial-sesiones',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      allowedFor: 'user'
    },
    {
      name: 'Comentarios del Profesor',
      path: '/mis-comentarios-profesor',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      allowedFor: 'user'
    },
    {
      name: 'Partituras',
      path: '/partituras',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
        </svg>
      ),
      allowedFor: 'user'
    },
    {
      name: 'Mis Pagos',
      path: '/mis-pagos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      allowedFor: 'user'
    },
    {
      name: 'Cambiar Contraseña',
      path: '/cambiar-contrasena',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      allowedFor: 'user'
    }
  ];

  return (
    <>
      {/* Sidebar para dispositivos medianos y grandes (md+) */}
      <aside className="md:block hidden fixed left-0 top-16 h-full w-64 bg-slate-50 shadow-lg border-r border-slate-200 z-40">
        <div className="flex flex-col h-full">
          {/* Menú principal */}
          <nav className="flex-1 pt-6 pb-4 overflow-y-auto">
            <div className="px-3">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive(item.path)
                          ? 'bg-indigo-200 text-indigo-900 border-r-2 border-indigo-600'
                          : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Footer del sidebar */}
          <div className="px-3 py-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 text-center">
              <p>Sistema de Gestión</p>
              <p>Clases de Violoncello</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Menú móvil en la parte inferior para dispositivos pequeños */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-600 shadow-lg z-50">
        <div className="flex justify-around items-center py-2">
          {/* Mostrar los primeros 4 elementos principales */}
          {menuItems.slice(0, 4).map((item) => {
            // Mapeo de nombres largos a versiones cortas para móvil
            const getMobileLabel = (name) => {
              const mobileLabels = {
                'Gestión de Clases': 'Clases',
                'Partituras': 'Part.',
                'Gestión de Pagos': 'Pagos',
                'Mis Clases': 'Clases',
                'Mis Estudios': 'Estudios',
                'Mis Pagos': 'Pagos',
                'Cambiar Contraseña': 'Pass.',
                'Admin Partituras': 'Admin',
                'Gestión de Estudios': 'Estudios',
                'Gestión de Usuarios': 'Users'
              };
              return mobileLabels[name] || name;
            };
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-2 text-xs font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'text-white bg-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <div className={`${isActive(item.path) ? 'text-white' : 'text-slate-300'}`}>
                  {item.icon}
                </div>
                <span className="mt-1 text-[10px] leading-tight text-center font-semibold">
                  {getMobileLabel(item.name)}
                </span>
              </Link>
            );
          })}
          
          {/* Botón "Más" si hay más de 4 elementos */}
          {menuItems.length > 4 && (
            <button
              onClick={() => setShowMobileMenu(true)}
              className="flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="mt-1 text-[10px] font-semibold">Más</span>
            </button>
          )}
        </div>
      </nav>

      {/* Modal para elementos adicionales del menú móvil */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-60 flex items-end pb-20">
          <div className="bg-white w-full rounded-t-lg shadow-lg max-h-96 overflow-y-auto mb-2">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Menú</h3>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 pb-6">
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
