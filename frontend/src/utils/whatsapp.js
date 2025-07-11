/**
 * Utilidades para WhatsApp
 * Manejo correcto de emojis y codificación de mensajes
 */

/**
 * Codifica un mensaje para envío por WhatsApp
 * Maneja correctamente los emojis y caracteres especiales
 * @param {string} texto - El texto a codificar
 * @returns {string} - Texto codificado para URL de WhatsApp
 */
export const codificarParaWhatsApp = (texto) => {
  // Usar encodeURIComponent para codificación básica
  let textoCodificado = encodeURIComponent(texto);
  
  // Preservar asteriscos para formato bold de WhatsApp
  textoCodificado = textoCodificado.replace(/%2A/g, '*');
  
  return textoCodificado;
};

/**
 * Abre WhatsApp con un mensaje pre-escrito
 * @param {string} mensaje - El mensaje a enviar
 */
export const enviarWhatsApp = (mensaje) => {
  const mensajeCodificado = codificarParaWhatsApp(mensaje);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${mensajeCodificado}`;
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
  let mensaje = `🎼 *Resumen de Clase*\n`;
  mensaje += `📅 Fecha: ${fecha}\n\n`;
  
  if (obrasEstudiadas.length > 0) {
    mensaje += `🎵 *Obras Estudiadas:*\n`;
    obrasEstudiadas.forEach((obra, index) => {
      mensaje += `${index + 1}. *${obra.compositor}* - ${obra.obra}\n`;
      if (obra.movimientosCompases) {
        mensaje += `   📖 Movimientos/Compases: ${obra.movimientosCompases}\n`;
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
