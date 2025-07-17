import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ListaUsuarios from './components/ListaUsuarios';
import CambiarContrasena from './components/CambiarContrasena';
import GestionPagos from './components/GestionPagos';
import GestionClases from './components/GestionClases';
import GestionPartituras from './components/GestionPartituras';
import AdminPartituras from './components/AdminPartituras';
import ResumenClasePage from './components/ResumenClasePage';
import MisClases from './components/MisClases';
import MisPagos from './components/MisPagos';
import LoggingTest from './components/LoggingTest';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppContent() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // Detectar si estamos en la página de resumen standalone
  const isStandaloneResumen = window.location.pathname.includes('/admin/resumen-clase/') && 
                              window.location.search.includes('newTab=true');

  // Si estamos cargando la autenticación, mostrar spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Solo mostrar navegación si no es standalone y está autenticado */}
      {isAuthenticated() && !isStandaloneResumen && (
        <>
          <Navbar />
          <Sidebar />
        </>
      )}
      
      {/* Contenedor principal con márgenes responsivos */}
      <div className={`${
        isAuthenticated() && !isStandaloneResumen 
          ? 'md:ml-64 pt-16 md:pt-24 pb-20 md:pb-0' 
          : ''
      }`}>
        <Routes>        {/* Ruta de resumen de clase - DEBE ir antes que otras rutas admin */}
        <Route 
          path="/admin/resumen-clase/:claseId" 
          element={
            <ProtectedRoute adminOnly={true}>
              <ResumenClasePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/login" 
          element={
            isAuthenticated() ? (
              <Navigate to={isAdmin() ? "/clases" : "/mis-clases"} replace />
            ) : (
              <Login />
            )
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute adminOnly={true}>
              <ListaUsuarios />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/cambiar-contrasena" 
          element={
            <ProtectedRoute>
              <CambiarContrasena />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/pagos" 
          element={
            <ProtectedRoute adminOnly={true}>
              <GestionPagos />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/clases" 
          element={
            <ProtectedRoute adminOnly={true}>
              <GestionClases />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/partituras" 
          element={
            <ProtectedRoute>
              <GestionPartituras />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin-partituras" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPartituras />
            </ProtectedRoute>
          } 
        />



        <Route 
          path="/mis-clases" 
          element={
            <ProtectedRoute>
              <MisClases />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/mis-pagos" 
          element={
            <ProtectedRoute>
              <MisPagos />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/test-logging" 
          element={<LoggingTest />} 
        />
        
        <Route 
          path="/" 
          element={
            isAuthenticated() ? (
              <Navigate to={isAdmin() ? "/clases" : "/mis-clases"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Catch-all route */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router
        basename="/alumnos"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
