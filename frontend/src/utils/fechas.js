// Utilidades para manejo de fechas universales (funciona en cualquier zona horaria)

/**
 * Convierte una fecha UTC a fecha local preservando el día calendario
 * Soluciona el problema de fechas de "solo día" que aparecen como día anterior/siguiente
 * @param {string|Date} fecha - Fecha en formato UTC
 * @returns {Date} - Fecha ajustada que preserva el día calendario original
 */
export const fechaUTCALocal = (fecha) => {
  if (!fecha) return null;
  
  const fechaUTC = new Date(fecha);
  
  // Si la fecha NO es medianoche UTC (tiene hora específica), la mantenemos como está
  if (fechaUTC.getUTCHours() !== 0 || fechaUTC.getUTCMinutes() !== 0 || fechaUTC.getUTCSeconds() !== 0) {
    return fechaUTC;
  }
  
  // Para fechas que son exactamente medianoche UTC (típicas de campos de "solo fecha")
  // creamos una nueva fecha usando los componentes de fecha UTC como fecha local
  // Esto preserva el día calendario sin importar la zona horaria del usuario
  return new Date(
    fechaUTC.getUTCFullYear(),
    fechaUTC.getUTCMonth(), 
    fechaUTC.getUTCDate(),
    12, 0, 0, 0 // Mediodía local para evitar problemas de borde con DST
  );
};

/**
 * Formatea una fecha para mostrar en el idioma y zona horaria local del usuario
 * @param {string|Date} fecha - Fecha a formatear
 * @param {object} opciones - Opciones de formato adicionales
 * @returns {string} - Fecha formateada en el idioma local
 */
export const formatearFecha = (fecha, opciones = {}) => {
  if (!fecha) return '';
  
  const fechaAjustada = fechaUTCALocal(fecha);
  
  const opcionesDefault = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
    // No especificamos timeZone para que use la zona horaria local del usuario
  };
  
  const opcionesFinales = { ...opcionesDefault, ...opciones };
  
  // Usar el idioma del navegador del usuario, con fallback a español
  const idioma = (typeof navigator !== 'undefined' && navigator.language) || 'es-ES';
  
  return fechaAjustada.toLocaleDateString(idioma, opcionesFinales);
};

/**
 * Formatea una fecha para mostrar solo el día, mes y año
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada (ej: "15 de julio de 2025")
 */
export const formatearFechaCorta = (fecha) => {
  if (!fecha) return '';
  
  const fechaAjustada = fechaUTCALocal(fecha);
  
  const opciones = {
    weekday: undefined,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  // Forzar idioma español
  return fechaAjustada.toLocaleDateString('es-ES', opciones);
};

/**
 * Formatea una fecha para mostrar solo día y mes
 * @param {string|Date} fecha - Fecha a formatear  
 * @returns {string} - Fecha formateada (ej: "15 jul")
 */
export const formatearFechaMuyCorta = (fecha) => {
  return formatearFecha(fecha, {
    weekday: undefined,
    year: undefined,
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formatea una fecha para mostrar día, mes y año en formato compacto español
 * @param {string|Date} fecha - Fecha a formatear  
 * @returns {string} - Fecha formateada (ej: "15 jul 2025")
 */
export const formatearFechaCompacta = (fecha) => {
  return formatearFecha(fecha, {
    weekday: undefined,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formatea una fecha en formato DD/MM/YY
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada (ej: "15/07/25")
 */
export const formatearFechaNumericaCorta = (fecha) => {
  if (!fecha) return '';
  
  const fechaAjustada = fechaUTCALocal(fecha);
  
  const dia = fechaAjustada.getDate().toString().padStart(2, '0');
  const mes = (fechaAjustada.getMonth() + 1).toString().padStart(2, '0');
  const año = fechaAjustada.getFullYear().toString().slice(-2);
  
  return `${dia}/${mes}/${año}`;
};

/**
 * Formatea una fecha en formato "Mes DD, YYYY" en español
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada (ej: "julio 15, 2025")
 */
export const formatearFechaAmericanaEspañol = (fecha) => {
  if (!fecha) return '';
  
  const fechaAjustada = fechaUTCALocal(fecha);
  
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const dia = fechaAjustada.getDate();
  const mes = meses[fechaAjustada.getMonth()];
  const año = fechaAjustada.getFullYear();
  
  return `${mes} ${dia}, ${año}`;
};

/**
 * Convierte una fecha local a UTC preservando el día calendario
 * Útil para enviar fechas al backend
 * @param {string|Date} fecha - Fecha local
 * @returns {Date} - Fecha en UTC que preserva el día calendario
 */
export const fechaLocalAUTC = (fecha) => {
  if (!fecha) return null;
  
  // Si es un string en formato YYYY-MM-DD, parsearlo manualmente
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [año, mes, dia] = fecha.split('-').map(Number);
    return new Date(Date.UTC(año, mes - 1, dia, 12, 0, 0, 0));
  }
  
  // Si es una fecha existente, usar sus componentes locales
  const fechaLocal = new Date(fecha);
  
  // Crear fecha UTC usando los componentes de fecha local
  // Esto preserva el día calendario sin importar la zona horaria
  return new Date(Date.UTC(
    fechaLocal.getFullYear(),
    fechaLocal.getMonth(),
    fechaLocal.getDate(),
    12, 0, 0, 0 // Mediodía UTC para evitar problemas de timezone en el backend
  ));
};

/**
 * Verifica si una fecha es hoy
 * @param {string|Date} fecha - Fecha a verificar
 * @returns {boolean} - True si es hoy
 */
export const esHoy = (fecha) => {
  if (!fecha) return false;
  
  const fechaAjustada = fechaUTCALocal(fecha);
  const hoy = new Date();
  
  return fechaAjustada.toDateString() === hoy.toDateString();
};

/**
 * Verifica si una fecha es mañana
 * @param {string|Date} fecha - Fecha a verificar  
 * @returns {boolean} - True si es mañana
 */
export const esMañana = (fecha) => {
  if (!fecha) return false;
  
  const fechaAjustada = fechaUTCALocal(fecha);
  const mañana = new Date();
  mañana.setDate(mañana.getDate() + 1);
  
  return fechaAjustada.toDateString() === mañana.toDateString();
};
