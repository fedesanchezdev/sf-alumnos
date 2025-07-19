# 🏠 Guía de Deploy en Hostinger

## Arquitectura Final:
- **Frontend**: Hostinger (archivos estáticos)
- **Backend**: Render.com (API Node.js)
- **Database**: MongoDB Atlas/Render

## Pasos para Deploy:

### 1. Preparar el Build
```bash
# Ejecutar script de build
build-hostinger.bat  # En Windows
# o
build-hostinger.sh   # En Linux/Mac
```

### 2. Subir a Hostinger

#### Opción A: Panel de Control de Hostinger
1. Accede al panel de control de Hostinger
2. Ve a "Administrador de archivos" 
3. Navega a `public_html` (o la carpeta de tu dominio)
4. Sube todos los archivos de la carpeta `build-hostinger`
5. Extrae los archivos si los subiste en ZIP

#### Opción B: FTP/SFTP
1. Conecta por FTP a tu hosting
2. Navega a `public_html`
3. Sube todos los archivos de `build-hostinger`

### 3. Configurar Variables de Entorno

El archivo `.env.production` ya está configurado con:
```
VITE_API_URL=https://sf-alumnos-backend.onrender.com/api
```

### 4. Configurar CORS en Backend

Actualiza `backend/server.js` con tu dominio real:
- Cambia `'https://tu-dominio.hostinger.com'` por tu dominio real
- Cambia `'https://tu-dominio.com'` por tu dominio personalizado

### 5. Configurar Redirecciones (SPA)

En Hostinger, crea un archivo `.htaccess` en `public_html`:

```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### 6. Configurar el Link desde tu Página Principal

En tu página principal de Hostinger, el link debe ser:
```html
<a href="https://tu-dominio.com/sf-alumnos">Sistema de Alumnos</a>
```

O si está en un subdominio:
```html
<a href="https://alumnos.tu-dominio.com">Sistema de Alumnos</a>
```

## Ventajas de esta Configuración:

✅ **Económico**: Frontend gratis en Hostinger, Backend gratis en Render
✅ **Rápido**: Archivos estáticos servidos desde Hostinger
✅ **Escalable**: Backend en Render con MongoDB
✅ **Integrado**: Todo conectado desde tu dominio principal

## URLs Finales:
- Frontend: `https://tu-dominio.com` (Hostinger)
- Backend: `https://sf-alumnos-backend.onrender.com` (Render)
- Database: MongoDB Atlas/Render

## Troubleshooting:

### Error de CORS:
- Verifica que tu dominio esté en `allowedOrigins` del backend
- Actualiza las variables de entorno en Render

### Error 404 en rutas:
- Verifica que el archivo `.htaccess` esté correctamente configurado
- Asegúrate de que todos los archivos estén en `public_html`

### API no conecta:
- Verifica que `VITE_API_URL` apunte al backend correcto
- Comprueba que el backend esté funcionando en Render
