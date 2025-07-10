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
import ResumenClasesUsuario from './components/ResumenClasesUsuario';
import MisClases from './components/MisClases';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppContent() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated() && (
        <>
          <Navbar />
          <Sidebar />
        </>
      )}
      
      {/* Contenedor principal con margen para sidebar */}
      <div className={`${isAuthenticated() ? 'ml-64 pt-24' : ''}`}>
        <Routes>
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
          path="/resumen-clases" 
          element={
            <ProtectedRoute>
              <ResumenClasesUsuario />
            </ProtectedRoute>
          } 
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
