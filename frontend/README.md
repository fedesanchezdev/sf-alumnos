# Sistema de Gestión de Alumnos - Frontend React

Este es el frontend del sistema de gestión de alumnos desarrollado con React, Vite y Tailwind CSS.

## Características

- **Autenticación de usuarios** con roles (Usuario/Administrador)
- **Gestión de usuarios** (crear, editar, eliminar) - solo administradores
- **Dashboard personalizado** según el rol del usuario
- **Cambio de contraseñas** para todos los usuarios
- **Interfaz responsive** con Tailwind CSS
- **Protección de rutas** basada en autenticación y roles

## Tecnologías Utilizadas

- **React 19.1.0** - Framework de frontend
- **Vite** - Build tool y desarrollo
- **React Router DOM** - Enrutamiento
- **Axios** - Cliente HTTP para API
- **Tailwind CSS** - Framework de estilos
- **Context API** - Gestión de estado global

## Estructura del Proyecto

```
src/
├── components/
│   ├── Dashboard.jsx          # Página principal del usuario
│   ├── Login.jsx             # Página de inicio de sesión
│   ├── ListaUsuarios.jsx     # Gestión de usuarios (admin)
│   ├── FormularioUsuario.jsx # Formulario para crear/editar usuarios
│   ├── CambiarContrasena.jsx # Componente para cambiar contraseña
│   ├── Navbar.jsx            # Barra de navegación
│   └── ProtectedRoute.jsx    # Componente para proteger rutas
├── context/
│   └── AuthContext.jsx       # Context para autenticación
├── services/
│   └── api.js               # Configuración de API y servicios
├── App.jsx                  # Componente principal con rutas
└── main.jsx                 # Punto de entrada
```

## Configuración

1. **Clonar el repositorio** (si aplica)

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   - Copiar `.env.example` a `.env`
   - Configurar `REACT_APP_API_URL` con la URL de tu backend en Render.com

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Construir para producción:**
   ```bash
   npm run build
   ```

## Funcionalidades por Rol

### Usuario
- ✅ Login con email y contraseña
- ✅ Ver dashboard personal
- ✅ Cambiar contraseña propia
- ✅ Cerrar sesión

### Administrador
- ✅ Todas las funcionalidades de usuario
- ✅ Ver lista de todos los usuarios
- ✅ Crear nuevos usuarios con contraseña provisoria
- ✅ Editar información de usuarios existentes
- ✅ Eliminar usuarios
- ✅ Asignar roles (Usuario/Administrador)

## API Endpoints Esperados

El frontend espera que tu backend en Render.com tenga los siguientes endpoints:

```
POST /api/auth/login                    # Autenticación
GET  /api/usuarios                      # Obtener todos los usuarios
GET  /api/usuarios/:id                  # Obtener usuario por ID
POST /api/usuarios                      # Crear nuevo usuario
PUT  /api/usuarios/:id                  # Actualizar usuario
DELETE /api/usuarios/:id                # Eliminar usuario
PUT  /api/usuarios/:id/cambiar-contrasena # Cambiar contraseña
```

## Modelo de Usuario Esperado

```javascript
{
  _id: "string",
  nombre: "string",
  apellido: "string", 
  email: "string",
  rol: "usuario" | "administrador",
  // password se maneja en el backend
}
```

## Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción
- `npm run lint` - Ejecutar ESLint

## Próximos Pasos

Para conectar con tu backend:

1. Actualiza la variable `REACT_APP_API_URL` en tu archivo `.env`
2. Asegúrate de que tu backend en Render.com tenga CORS configurado para tu dominio frontend
3. Verifica que los endpoints de tu API coincidan con los esperados
4. Prueba la funcionalidad completa

## Notas de Seguridad

- Los tokens JWT se almacenan en localStorage
- Las rutas están protegidas según roles
- Los formularios tienen validación básica
- Se recomienda implementar HTTPS en producción
