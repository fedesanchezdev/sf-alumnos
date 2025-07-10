// Prueba rápida de las utilidades de fecha
// Copia y pega esto en la consola del navegador

import { formatearFecha, formatearFechaCorta } from '/src/utils/fechas.js';

// Fecha típica de la base de datos
const fechaBD = '2025-07-02T15:00:00.000Z';

console.log('=== PRUEBA DE FECHAS EN EL NAVEGADOR ===');
console.log('Fecha de BD:', fechaBD);
console.log('JavaScript nativo:', new Date(fechaBD).toLocaleDateString());
console.log('Nuestra utilidad (corta):', formatearFechaCorta(fechaBD));
console.log('Nuestra utilidad (completa):', formatearFecha(fechaBD));

// Verificar si el componente está cargando las utilidades
const componenteClases = document.querySelector('[data-testid="gestion-clases"]');
console.log('Componente de clases encontrado:', !!componenteClases);
