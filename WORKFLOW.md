# Flujo de Trabajo - Sistema de Gestión de Alumnos

## Estructura de Ramas

### `main` - Rama de Producción
- **Estado**: Código estable en producción
- **Deploy**: Hostinger + Render
- **Protección**: Solo merge desde `dev` después de testing
- **URL**: https://federicosanchez.com.ar/alumnos

### `dev` - Rama de Desarrollo
- **Estado**: Código en desarrollo y testing
- **Propósito**: Integración de nuevas features
- **Testing**: Desarrollo local antes de merge a main

## Flujo de Trabajo Recomendado

### Para Nuevas Funcionalidades

1. **Crear Feature Branch**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/nombre-funcionalidad
   ```

2. **Desarrollar y Commitear**
   ```bash
   git add .
   git commit -m "feat: descripción de la funcionalidad"
   ```

3. **Merge a Dev**
   ```bash
   git checkout dev
   git merge feature/nombre-funcionalidad
   git push origin dev
   ```

4. **Testing en Dev**
   - Probar localmente
   - Verificar integración
   - Confirmar que no hay breaking changes

5. **Deploy a Producción**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

### Para Hotfixes

1. **Crear Hotfix desde Main**
   ```bash
   git checkout main
   git checkout -b hotfix/descripcion-fix
   ```

2. **Aplicar Fix y Merge**
   ```bash
   # Hacer cambios
   git commit -m "fix: descripción del fix"
   git checkout main
   git merge hotfix/descripcion-fix
   git checkout dev
   git merge hotfix/descripcion-fix
   ```

## Comandos de Deploy

### Frontend (Hostinger)
```bash
# Generar build de producción
./build-hostinger.bat  # Windows
./build-hostinger.sh   # Linux/Mac

# Subir manualmente por FTP a public_html/alumnos/
```

### Backend (Render)
```bash
# Auto-deploy desde main branch
git push origin main
# Render detecta cambios y redeploya automáticamente
```

## Scripts de Desarrollo

### Desarrollo Local
```bash
./dev.bat           # Inicia frontend y backend (Windows)
./dev.ps1           # PowerShell alternativo
./quick-dev.ps1     # Inicio rápido
```

### Solo Frontend
```bash
./iniciar-frontend.ps1
```

### Solo Backend
```bash
./iniciar-servidores.ps1
```

## URLs y Endpoints

### Producción
- **Frontend**: https://federicosanchez.com.ar/alumnos
- **Backend**: https://sf-alumnos-backend-new.onrender.com

### Desarrollo Local
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## Estructura del Proyecto

```
sf-alumnos/
├── frontend/           # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── context/    # Context API
│   │   └── utils/      # Utilidades
│   ├── public/
│   └── build/          # Build de producción
├── backend/            # Node.js + Express + MongoDB
│   ├── controllers/    # Lógica de negocio
│   ├── models/         # Modelos de MongoDB
│   ├── routes/         # Rutas de API
│   ├── middleware/     # Middlewares
│   └── config/         # Configuración
└── build-hostinger/    # Build final para Hostinger
```

## Variables de Entorno

### Frontend (.env.production)
```
VITE_API_URL=https://sf-alumnos-backend-new.onrender.com
```

### Backend (Render)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
FRONTEND_URL=https://federicosanchez.com.ar
PORT=3000
```

## Consideraciones Especiales

### CORS
- Backend configurado para permitir `federicosanchez.com.ar`
- Desarrollo local permite `localhost:5173`

### Routing SPA
- Frontend usa React Router
- `.htaccess` configurado para routing en subdirectorio `/alumnos`

### Base Path
- Vite configurado con `base: '/alumnos/'`
- Todas las rutas relativas funcionan correctamente

## Checklist de Deploy

### Pre-Deploy
- [ ] Código testeado en desarrollo
- [ ] No hay errores en consola
- [ ] Variables de entorno actualizadas
- [ ] Build genera archivos correctamente

### Post-Deploy
- [ ] Frontend carga correctamente
- [ ] API responde desde Render
- [ ] Login funciona
- [ ] Navegación SPA funciona
- [ ] CORS no genera errores

## Troubleshooting

### Error 404 en Rutas
- Verificar `.htaccess` en `public_html/alumnos/`
- Confirmar que Vite usa `base: '/alumnos/'`

### Error de CORS
- Verificar `FRONTEND_URL` en backend
- Confirmar origen en configuración CORS

### Build no Funciona
- Verificar variables en `.env.production`
- Confirmar que `VITE_API_URL` apunta a Render

---

**Última actualización**: $(date)
**Versión en producción**: Estable con sistema de gestión completo
