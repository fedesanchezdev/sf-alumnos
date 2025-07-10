// Script para verificar el usuario actual en localStorage
console.log('=== DIAGNÓSTICO DE USUARIO ===');

const token = localStorage.getItem('token');
const usuario = localStorage.getItem('usuario');

console.log('Token existe:', !!token);
console.log('Usuario guardado:', usuario);

if (usuario) {
  try {
    const userData = JSON.parse(usuario);
    console.log('Datos del usuario:', userData);
    console.log('Rol del usuario:', userData.rol);
    console.log('Es administrador:', userData.rol === 'administrador');
  } catch (error) {
    console.error('Error al parsear usuario:', error);
  }
} else {
  console.log('No hay usuario guardado en localStorage');
}

// Verificar la URL de la API
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
