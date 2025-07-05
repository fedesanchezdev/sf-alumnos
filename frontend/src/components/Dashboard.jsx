import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { usuario, isAdmin } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido, {usuario?.nombre}! 🎻
        </h1>
        <p className="text-gray-600">
          {isAdmin() ? 'Panel de administración' : 'Tu espacio personal de aprendizaje'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <span className="mr-2">👤</span>
            Tu Perfil
          </h3>
          <div className="space-y-2">
            <p className="text-blue-700">
              <span className="font-medium">Nombre:</span> {usuario?.nombre} {usuario?.apellido}
            </p>
            <p className="text-blue-700">
              <span className="font-medium">Email:</span> {usuario?.email}
            </p>
            <p className="text-blue-700">
              <span className="font-medium">Rol:</span> 
              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                isAdmin() 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {usuario?.rol}
              </span>
            </p>
          </div>
        </div>

        {isAdmin() && (
          <>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                <span className="mr-2">👥</span>
                Gestión de Usuarios
              </h3>
              <p className="text-green-700 mb-4">
                Administra los usuarios del sistema
              </p>
              <Link
                to="/usuarios"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Ver Usuarios
              </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                <span className="mr-2">⚙️</span>
                Panel de Administración
              </h3>
              <p className="text-purple-700 mb-4">
                Acceso completo al sistema
              </p>
              <span className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                Administrador
              </span>
            </div>
          </>
        )}

        {!isAdmin() && (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">🎼</span>
                Partituras
              </h3>
              <p className="text-blue-700 mb-4">
                Explora y marca tus partituras favoritas
              </p>
              <Link
                to="/partituras"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Ver Partituras
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                <span className="mr-2">📚</span>
                Mis Clases
              </h3>
              <p className="text-green-700 mb-4">
                Revisa el resumen de tus clases anteriores
              </p>
              <Link
                to="/resumen-clases"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Ver Mis Clases
              </Link>
            </div>
          </>
        )}

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center">
            <span className="mr-2">🔒</span>
            Seguridad
          </h3>
          <p className="text-indigo-700 mb-4">
            Cambia tu contraseña cuando sea necesario
          </p>
          <Link
            to="/cambiar-contrasena"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Cambiar Contraseña
          </Link>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl shadow-sm border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Información Importante
        </h3>
        <p className="text-yellow-700">
          {usuario?.rol === 'usuario' 
            ? 'Si esta es tu primera vez ingresando, recuerda cambiar tu contraseña provisional.'
            : 'Como administrador, puedes gestionar todos los usuarios del sistema.'
          }
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
