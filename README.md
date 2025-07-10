# Sistema de Gestión de Alumnos

Sistema completo de gestión de alumnos con autenticación, manejo de usuarios, pagos y clases.

## Estructura del Proyecto

```
sf-alumnos/
├── backend/          # API REST con Node.js + Express + MongoDB
├── frontend/         # Aplicación React + Vite + Tailwind CSS
└── README.md         # Este archivo
```

## Tecnologías

### Backend
- **Node.js** + **Express.js**
- **MongoDB** (Atlas)
- **JWT** para autenticación
- **bcryptjs** para encriptación
- **CORS** para comunicación con frontend

### Frontend
- **React 18**
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Axios** (HTTP client)
- **React Router** (navegación)

## 🚀 Opciones de Ejecución

### Opción 1: Backend en Render.com (Recomendado) 
```bash
# Solo ejecutar frontend (backend en la nube)
./iniciar-frontend.ps1
```

### Opción 2: Todo local
```bash
# Ejecutar backend y frontend localmente
./iniciar-dev.ps1
```

## 🌐 Configuración Backend en Render.com

Para usar el backend desplegado en Render.com:

1. **Desplegar backend**: Ver instrucciones en `DEPLOY-RENDER.md`
2. **Configurar frontend**: Actualizar `.env` con la URL del backend
3. **Ejecutar solo frontend**: `./iniciar-frontend.ps1`

### Ventajas del backend en Render.com:
- ✅ Base de datos persistente
- ✅ Disponible 24/7
- ✅ Desarrollo más rápido
- ✅ Menor uso de recursos locales
- ✅ Fácil compartir con otros

## Cómo ejecutar (Local completo)

### Backend
```bash
cd backend
npm install
node server.js
```
Servidor disponible en: http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Aplicación disponible en: http://localhost:5173

## Funcionalidades

- ✅ **Autenticación**: Login con JWT
- ✅ **Roles**: Admin y Usuario
- ✅ **Gestión de Usuarios**: CRUD completo
- ✅ **Cambio de Contraseña**: Para usuarios autenticados
- ✅ **Gestión de Pagos**: Crear pagos por período o fechas individuales
- ✅ **Gestión de Clases**: Ver y actualizar estado de clases
- ✅ **Filtros**: Solo mostrar datos activos (soft delete)

## Variables de Entorno

### Backend (.env)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=tu_secret_aqui
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Scripts Útiles

### Backend
- `node scripts/crearAdmin.js` - Crear usuario administrador
- `node scripts/crearDatosPrueba.js` - Datos de prueba
- `node scripts/mostrarCredenciales.js` - Ver credenciales

### Credenciales por Defecto
- **Admin**: admin@sistema.com / admin123
- **Usuario**: santos@gmail.com / santos123
