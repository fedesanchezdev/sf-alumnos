# Sistema de Gestión de Alumnos - Backend

API REST desarrollada con Node.js, Express y MongoDB para el sistema de gestión de alumnos.

## Características

- **Autenticación JWT** con roles (Usuario/Administrador)
- **CRUD completo** para usuarios/alumnos
- **Encriptación de contraseñas** con bcrypt
- **Validación de datos** con Mongoose
- **Middleware de autorización** por roles
- **CORS configurado** para frontend React

## Tecnologías

- **Node.js** - Runtime
- **Express.js** - Framework web
- **MongoDB** - Base de datos
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **CORS** - Cross-Origin Resource Sharing

## Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Edita el archivo `.env` con tus credenciales:
   ```env
   MONGODB_URI=tu_uri_de_mongodb
   JWT_SECRET=tu_jwt_secret_muy_seguro
   PORT=5000
   NODE_ENV=development
   ```

3. **Crear usuario administrador inicial:**
   ```bash
   npm run crear-admin
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Ejecutar en producción:**
   ```bash
   npm start
   ```

## API Endpoints

### Autenticación
```
POST /api/auth/login                    # Login de usuario
GET  /api/auth/perfil                   # Obtener perfil del usuario autenticado
GET  /api/auth/verificar                # Verificar token válido
```

### Usuarios
```
GET    /api/usuarios                    # Obtener todos los usuarios (Admin)
GET    /api/usuarios/:id                # Obtener usuario por ID (Admin/Propietario)
POST   /api/usuarios                    # Crear nuevo usuario (Admin)
PUT    /api/usuarios/:id                # Actualizar usuario (Admin/Propietario)
DELETE /api/usuarios/:id                # Eliminar usuario (Admin)
PUT    /api/usuarios/:id/cambiar-contrasena # Cambiar contraseña (Admin/Propietario)
```

### Utilidades
```
GET /api/test                          # Ruta de prueba
GET /api/health                        # Estado del servidor
```

## Estructura del Proyecto

```
├── config/
│   └── database.js          # Configuración de MongoDB
├── controllers/
│   ├── authController.js    # Controladores de autenticación
│   └── usuarioController.js # Controladores de usuarios
├── middleware/
│   └── auth.js              # Middlewares de autenticación
├── models/
│   └── Usuario.js           # Modelo de usuario
├── routes/
│   ├── authRoutes.js        # Rutas de autenticación
│   └── usuarioRoutes.js     # Rutas de usuarios
├── scripts/
│   └── crearAdmin.js        # Script para crear admin inicial
├── .env                     # Variables de entorno
├── server.js                # Archivo principal del servidor
└── package.json             # Dependencias y scripts
```

## Modelo de Usuario

```javascript
{
  _id: ObjectId,
  nombre: String,            // Obligatorio, máx 50 chars
  apellido: String,          // Obligatorio, máx 50 chars
  email: String,             // Obligatorio, único, formato email
  password: String,          // Obligatorio, mín 6 chars (hasheado)
  rol: String,               // 'usuario' | 'administrador'
  fechaCreacion: Date,       // Automático
  ultimoAcceso: Date,        // Se actualiza en login
  createdAt: Date,           // Timestamp automático
  updatedAt: Date            // Timestamp automático
}
```

## Autenticación

### Login
```json
POST /api/auth/login
{
  "email": "usuario@email.com",
  "password": "contraseña"
}

Respuesta:
{
  "message": "Login exitoso",
  "token": "jwt_token_aqui",
  "usuario": {
    "_id": "...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com",
    "rol": "usuario"
  }
}
```

### Headers para rutas protegidas
```
Authorization: Bearer tu_jwt_token_aqui
```

## Roles y Permisos

### Usuario
- ✅ Login
- ✅ Ver su propio perfil
- ✅ Actualizar sus propios datos
- ✅ Cambiar su propia contraseña

### Administrador
- ✅ Todas las funciones de usuario
- ✅ Ver todos los usuarios
- ✅ Crear nuevos usuarios
- ✅ Editar cualquier usuario
- ✅ Eliminar usuarios (excepto a sí mismo)
- ✅ Cambiar roles de usuarios

## Scripts Disponibles

- `npm start` - Ejecutar servidor en producción
- `npm run dev` - Ejecutar servidor en desarrollo con nodemon
- `npm run crear-admin` - Crear usuario administrador inicial

## Credenciales de Administrador por Defecto

Después de ejecutar `npm run crear-admin`:
- **Email:** admin@sistema.com
- **Contraseña:** admin123

⚠️ **¡IMPORTANTE!** Cambia estas credenciales después del primer login.

## Variables de Entorno

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database
JWT_SECRET=secreto_muy_seguro_para_jwt_tokens
PORT=5000
NODE_ENV=development
```

## Despliegue en Render.com

1. Conecta tu repositorio de GitHub a Render
2. Configura las variables de entorno en Render
3. El comando de build: `npm install`
4. El comando de start: `npm start`
5. Ejecuta `npm run crear-admin` desde la consola de Render (una sola vez)

## Seguridad

- ✅ Contraseñas hasheadas con bcrypt (12 rounds)
- ✅ Tokens JWT con expiración (7 días)
- ✅ Validación de entrada de datos
- ✅ CORS configurado
- ✅ Middlewares de autorización por roles
- ✅ Headers de seguridad básicos
