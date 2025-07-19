// Análisis del documento MongoDB con fechaReprogramada
console.log('=== ANÁLISIS DEL DOCUMENTO MONGODB CON FECHA REPROGRAMADA ===\n');

// Los timestamps del documento
const fechaOriginal = 1752148800000;
const fechaReprogramada = 1752678000000;

console.log('=== FECHA ORIGINAL ===');
console.log('Timestamp:', fechaOriginal);
const fechaOrig = new Date(fechaOriginal);
console.log('Fecha:', fechaOrig);
console.log('ISO String:', fechaOrig.toISOString());
console.log('Fecha local:', fechaOrig.toLocaleDateString());
console.log('Día UTC:', fechaOrig.getUTCDate(), 'Mes UTC:', fechaOrig.getUTCMonth() + 1, 'Año UTC:', fechaOrig.getUTCFullYear());

console.log('\n=== FECHA REPROGRAMADA ===');
console.log('Timestamp:', fechaReprogramada);
const fechaRepr = new Date(fechaReprogramada);
console.log('Fecha:', fechaRepr);
console.log('ISO String:', fechaRepr.toISOString());
console.log('Fecha local:', fechaRepr.toLocaleDateString());
console.log('Día UTC:', fechaRepr.getUTCDate(), 'Mes UTC:', fechaRepr.getUTCMonth() + 1, 'Año UTC:', fechaRepr.getUTCFullYear());

console.log('\n=== COMPARACIÓN ===');
const diffDias = (fechaReprogramada - fechaOriginal) / (1000 * 60 * 60 * 24);
console.log('Diferencia en días:', diffDias);

console.log('\n=== ZONA HORARIA ===');
console.log('Offset en minutos:', fechaRepr.getTimezoneOffset());
console.log('Zona horaria:', Intl.DateTimeFormat().resolvedOptions().timeZone);

// Simular lo que DEBERÍA mostrar formatearFechaCorta
console.log('\n=== LO QUE DEBERÍA MOSTRAR formatearFechaCorta ===');
console.log('Fecha reprogramada formateada (ES):', fechaRepr.toLocaleDateString('es-ES', {
  year: 'numeric',
  month: 'long', 
  day: 'numeric'
}));

console.log('\n=== FIN ANÁLISIS ===');
