/**
 * Utilidad de logging segura
 * En producción, oculta logs sensibles y solo muestra errores críticos
 */

const isDevelopment = import.meta.env.MODE === 'development';
const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';
const enableSensitiveLogs = import.meta.env.VITE_ENABLE_SENSITIVE_LOGS === 'true';

class Logger {
  constructor() {
    this.isDev = isDevelopment;
    this.allowDebug = this.isDev && enableDebugLogs;
    this.allowSensitive = this.isDev && enableSensitiveLogs;
  }

  /**
   * Log de desarrollo - solo se muestra en desarrollo
   */
  dev(...args) {
    if (this.allowDebug) {
      console.log('[DEV]', ...args);
    }
  }

  /**
   * Log de información - se muestra en desarrollo, mínimo en producción
   */
  info(message, ...details) {
    if (this.isDev) {
      console.log('ℹ️', message, ...details);
    } else {
      // En producción, solo el mensaje sin detalles sensibles
      console.log('ℹ️', message);
    }
  }

  /**
   * Log de éxito - se muestra en desarrollo, mínimo en producción
   */
  success(message, ...details) {
    if (this.isDev) {
      console.log('✅', message, ...details);
    } else {
      console.log('✅', message);
    }
  }

  /**
   * Log de advertencia - se muestra siempre pero con menos detalles en producción
   */
  warn(message, ...details) {
    if (this.isDev) {
      console.warn('⚠️', message, ...details);
    } else {
      console.warn('⚠️', message);
    }
  }

  /**
   * Log de error - se muestra siempre
   */
  error(message, error = null) {
    if (this.isDev) {
      console.error('❌', message, error);
    } else {
      // En producción, solo mensaje de error sin detalles internos
      console.error('❌', message);
      if (error && error.message) {
        console.error('Error:', error.message);
      }
    }
  }

  /**
   * Log de depuración - solo en desarrollo
   */
  debug(label, data) {
    if (this.allowDebug) {
      console.log(`🔍 ${label}:`, data);
    }
  }

  /**
   * Log de datos sensibles - solo en desarrollo y si está habilitado
   */
  sensitive(label, data) {
    if (this.allowSensitive) {
      console.log(`🔒 ${label}:`, data);
    }
  }

  /**
   * Log de rendimiento - solo en desarrollo
   */
  perf(label, time) {
    if (this.allowDebug) {
      console.log(`⏱️ ${label}: ${time}ms`);
    }
  }

  /**
   * Agrupa logs relacionados - solo en desarrollo
   */
  group(label, callback) {
    if (this.allowDebug) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Método de conveniencia para verificar si estamos en desarrollo
export const isDev = isDevelopment;
