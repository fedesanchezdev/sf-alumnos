# 🚀 Desplegar Backend en Render.com

## ✅ Pasos Completos para Desplegar:

### 1. 📁 Preparar el Repositorio
```bash
# En el directorio del proyecto
git add .
git commit -m "Preparar backend para Render.com"
git push origin main
```

### 2. 🌐 Configurar Render.com
1. Ve a https://render.com y crea una cuenta
2. Conecta tu cuenta de GitHub
3. Click en **"New +"** → **"Web Service"**
4. Selecciona tu repositorio `sf-alumnos`

### 3. ⚙️ Configuración del Servicio
```
Name: sf-alumnos-backend
Environment: Node
Region: Ohio (US East)
Branch: main
Root Directory: backend
Build Command: npm ci
Start Command: npm start
```

### 4. 🔧 Variables de Entorno
En el dashboard de Render, agregar estas variables:

```bash
NODE_ENV=production
JWT_SECRET=tu_token_super_seguro_aqui_minimo_32_caracteres
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/sf_alumnos
FRONTEND_URL=http://localhost:5173
```

### 5. 🗄️ Configurar MongoDB Atlas (GRATIS)
1. **Crear cuenta**: Ve a https://cloud.mongodb.com
2. **Crear cluster**: 
   - Selecciona **M0 (Free)**
   - Región: **AWS / N. Virginia**
   - Nombre: `sf-alumnos-cluster`
3. **Crear usuario**:
   - Username: `sf_admin`
   - Password: `generar_password_seguro`
4. **Configurar IP**: 
   - IP Access List → Add IP Address → **0.0.0.0/0** (Anywhere)
5. **Obtener connection string**:
   - Connect → Drivers → Copy connection string
   - Reemplazar `<password>` con tu password

### 6. 🎯 URL del Backend Desplegado
Una vez desplegado, tu backend estará en:
```
https://sf-alumnos-backend.onrender.com
```

### 7. 🔄 Configurar Frontend
Actualizar `frontend/.env`:
```bash
# Cambiar de:
VITE_API_URL=http://localhost:5000/api

# A:
VITE_API_URL=https://sf-alumnos-backend.onrender.com/api
```

### 8. 🧪 Probar el Despliegue
```bash
# Probar que el backend responda
curl https://sf-alumnos-backend.onrender.com/api/health

# Ejecutar solo frontend local
./iniciar-frontend.ps1
```

## 🎯 Beneficios del despliegue:

✅ **Backend siempre disponible**: No necesitas ejecutarlo localmente  
✅ **Base de datos persistente**: Los datos se mantienen entre sesiones  
✅ **Desarrollo más rápido**: Solo ejecutas `npm run dev` en frontend  
✅ **Compartir fácilmente**: Otros pueden probar la aplicación  
✅ **Ambiente realista**: Simula condiciones de producción  

## 📝 Comandos actualizados:

### Solo frontend (backend en Render):
```bash
# Usar el nuevo script
./iniciar-frontend.ps1

# O manualmente
cd frontend && npm run dev
```

### Full local (desarrollo completo):
```bash
# Usar el script original
./iniciar-dev.ps1
```

## 🔧 Troubleshooting:

### Backend no responde:
- Verificar que las variables de entorno estén correctas
- Revisar logs en Render dashboard
- Verificar que MONGODB_URI sea válida

### CORS errors:
- Verificar que FRONTEND_URL esté configurada en el backend
- Actualizar las configuraciones de CORS si es necesario

### Base de datos:
- Verificar conexión a MongoDB Atlas
- Asegurar que el usuario tenga permisos de lectura/escritura
- Revisar que la IP esté en whitelist (usar 0.0.0.0/0 para cualquier IP)
