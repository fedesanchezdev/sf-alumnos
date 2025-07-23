/**
 * Utilidades para WhatsApp
 * Manejo correcto de emojis y codificación de mensajes
 */

/**
 * Codifica un mensaje para envío por WhatsApp
 * Maneja correctamente los emojis y caracteres especiales
 * Mantiene emojis legibles, solo codifica caracteres problemáticos
 * @param {string} texto - El texto a codificar
 * @returns {string} - Texto codificado para URL de WhatsApp
 */
export const codificarParaWhatsApp = (texto) => {
  // Codificar solo los caracteres problemáticos para URLs, manteniendo emojis
  return texto
    .replace(/\n/g, '%0A')      // Saltos de línea
    .replace(/ /g, '%20')       // Espacios
    .replace(/&/g, '%26')       // Ampersand
    .replace(/\+/g, '%2B')      // Signo más
    .replace(/#/g, '%23')       // Hash
    .replace(/\?/g, '%3F')      // Signo de interrogación
    .replace(/=/g, '%3D');      // Signo igual
};

/**
 * Abre WhatsApp con un mensaje pre-escrito
 * @param {string} mensaje - El mensaje a enviar
 * @param {string} telefono - Número de teléfono (opcional)
 */
export const enviarWhatsApp = (mensaje, telefono = null) => {
  const mensajeCodificado = codificarParaWhatsApp(mensaje);

  let whatsappUrl;
  if (telefono && telefono.trim() !== '') {
    // Limpiar el número de teléfono solo de espacios, guiones, paréntesis
    // PERO mantener el número exactamente como está registrado (sin agregar código de país)
    let telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');

    // Remover el + si existe al inicio (WhatsApp API no lo necesita)
    telefonoLimpio = telefonoLimpio.replace(/^\+/, '');

    whatsappUrl = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
  } else {
    whatsappUrl = `https://api.whatsapp.com/send?text=${mensajeCodificado}`;
  }

  window.open(whatsappUrl, '_blank');
};

/**
 * Genera el mensaje estándar de resumen de clase
 * @param {Object} datos - Datos del resumen
 * @param {string} datos.fecha - Fecha de la clase
 * @param {Array} datos.obrasEstudiadas - Array de obras estudiadas
 * @param {string} datos.objetivosProximaClase - Objetivos para la próxima clase
 * @returns {string} - Mensaje formateado
 */
export const generarMensajeResumen = ({ fecha, obrasEstudiadas = [], objetivosProximaClase = '' }) => {
  let mensaje = `*Resumen de Clase*\n`;
  mensaje += `📅 Fecha: ${fecha}\n\n`;

  if (obrasEstudiadas.length > 0) {
    mensaje += `🎵 *Obras Estudiadas:*\n`;
    obrasEstudiadas.forEach((obra, index) => {
      mensaje += `${index + 1}. *${obra.compositor}* - ${obra.obra}\n`;
      if (obra.movimientosCompases) {
        mensaje += `   📖 : ${obra.movimientosCompases}\n`;
      }
      if (obra.comentarios) {
        mensaje += `   💭 ${obra.comentarios}\n`;
      }
      mensaje += `\n`;
    });
  }

  if (objetivosProximaClase) {
    mensaje += `📋 *Próxima Clase:*\n${objetivosProximaClase}`;
  }

  return mensaje;
};
