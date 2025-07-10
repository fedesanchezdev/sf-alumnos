# 🚀 Scripts de Desarrollo - sf-alumnos

## Scripts Disponibles

### ✅ **run-dev.ps1** (RECOMENDADO)
Script PowerShell simple y confiable para gestionar los servidores de desarrollo.

**Uso:**
```powershell
# Iniciar ambos servidores
.\run-dev.ps1

# Ver estado actual
.\run-dev.ps1 status

# Detener servidores
.\run-dev.ps1 stop
```

### 📋 **dev.bat** 
Script batch alternativo para usuarios que prefieren CMD.

**Uso:**
```batch
# Iniciar servidores
dev.bat start

# Ver estado
dev.bat status

# Detener servidores
dev.bat stop
```

## 🔧 Características del Script run-dev.ps1

### ✅ **Funcionalidades:**
- ✅ Inicia automáticamente backend (puerto 5000) y frontend (puerto 5173)
- ✅ Verifica que ambos servidores se inicien correctamente
- ✅ Limpia procesos anteriores antes de iniciar
- ✅ Muestra estado en tiempo real
- ✅ Manejo de errores y timeouts
- ✅ Comandos simples para gestión

### 🎯 **Ventajas:**
- **Rápido**: Inicia ambos servidores en ~10-15 segundos
- **Confiable**: Verifica que los puertos estén activos
- **Limpio**: Elimina procesos anteriores automáticamente
- **Informativo**: Muestra estado y URLs claramente
- **Simple**: Un solo comando para todo

### 📊 **Verificaciones Automáticas:**
- ✅ Estructura del proyecto (backend/frontend folders)
- ✅ Archivos package.json existentes
- ✅ Puertos disponibles/ocupados
- ✅ Procesos iniciados correctamente

## 🚨 Solución de Problemas

### Si el script no funciona:

1. **Verificar ubicación:**
   ```powershell
   # Ejecutar desde el directorio sf-alumnos
   cd e:\Proyectos\sf-alumnos
   .\run-dev.ps1
   ```

2. **Limpiar manualmente:**
   ```powershell
   # Detener todos los procesos Node.js
   Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
   
   # Limpiar jobs
   Get-Job | Stop-Job; Get-Job | Remove-Job
   ```

3. **Verificar puertos:**
   ```powershell
   # Ver puertos en uso
   netstat -an | findstr ":5000\|:5173"
   ```

4. **Ver logs de los servidores:**
   ```powershell
   # Después de iniciar con run-dev.ps1
   Get-Job | Receive-Job -Keep
   ```

## 🎯 **Flujo de Trabajo Recomendado**

### Inicio del día:
```powershell
cd e:\Proyectos\sf-alumnos
.\run-dev.ps1
```

### Durante desarrollo:
```powershell
# Ver si todo está funcionando
.\run-dev.ps1 status

# Si hay problemas, reiniciar
.\run-dev.ps1 stop
.\run-dev.ps1 start
```

### Final del día:
```powershell
.\run-dev.ps1 stop
```

## 📁 **Archivos del Proyecto**

### **Scripts principales:**
- `run-dev.ps1` - Script PowerShell recomendado
- `dev.bat` - Script batch alternativo

### **Scripts secundarios:**
- `iniciar-dev.ps1` - Script original (funciona pero más complejo)
- `iniciar-servidores.ps1` - Abre ventanas separadas
- `iniciar-servidores.bat` - Versión batch del anterior

### **URLs de desarrollo:**
- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:5173
- **Health Check:** http://localhost:5000/api/health

## 🎉 **¡Todo listo!**

Con estos scripts, ya no perderás tiempo iniciando servidores. El script `run-dev.ps1` es la solución definitiva para un desarrollo ágil y sin complicaciones.

**Próximos pasos:**
1. Probar el login con: admin@sistema.com / admin123
2. Explorar la nueva sección de Partituras
3. Desarrollar sin preocuparte por la infraestructura

---
*Última actualización: 2 de Julio, 2025*
