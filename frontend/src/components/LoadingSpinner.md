# LoadingSpinner Component - Documentation

## Descripción

El componente `LoadingSpinner` es un spinner reutilizable y profesional diseñado para manejar estados de carga en toda la aplicación. Está especialmente optimizado para manejar el "cold start" de servidores en Render.com.

## Características

- **Diseño profesional**: Spinner con anillo exterior, punto central animado y puntos de carga
- **Mensaje de Render**: Muestra información específica sobre el despertar del servidor después de 3 segundos
- **Tamaños flexibles**: Soporta tamaños `small`, `medium`, y `large`
- **Personalizable**: Título, subtítulo y mensaje de Render configurables
- **Responsive**: Se adapta a diferentes pantallas y contextos

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | `string` | `"Cargando..."` | Título principal del spinner |
| `subtitle` | `string` | `null` | Subtítulo opcional |
| `showRenderMessage` | `boolean` | `false` | Mostrar mensaje específico de Render.com |
| `size` | `string` | `"large"` | Tamaño del spinner: `small`, `medium`, `large` |

## Uso

```jsx
import LoadingSpinner from './LoadingSpinner';

// Uso básico
<LoadingSpinner />

// Uso completo
<LoadingSpinner 
  title="Cargando partituras..."
  subtitle="Obteniendo la colección de partituras musicales"
  showRenderMessage={true}
  size="large"
/>

// Para páginas internas (sin mensaje de Render)
<LoadingSpinner 
  title="Verificando autenticación..."
  subtitle="Validando permisos de acceso"
  showRenderMessage={false}
  size="medium"
/>
```

## Componentes actualizados

Los siguientes componentes ya están usando el nuevo `LoadingSpinner`:

1. **GestionPartituras.jsx** - Spinner principal con mensaje de Render
2. **ListaUsuarios.jsx** - Spinner para carga de usuarios
3. **ProtectedRoute.jsx** - Spinner para autenticación
4. **GestionPagos.jsx** - Spinner para carga de pagos
5. **GestionPagos_backup.jsx** - Spinner para carga de pagos (backup)
6. **GestionClases.jsx** - Spinner para carga de clases

## Tamaños recomendados

- **`large`**: Para páginas principales como GestionPartituras
- **`medium`**: Para componentes de gestión como usuarios, pagos
- **`small`**: Para spinners internos o secundarios

## Mensaje de Render

El mensaje de Render aparece automáticamente después de 3 segundos cuando `showRenderMessage={true}`, explicando al usuario que el servidor está "despertando" en Render.com. Esto mejora la experiencia de usuario durante el cold start.
