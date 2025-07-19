import { useEffect } from 'react';
import { logger, isDev } from '../utils/logger';

const LoggingTest = () => {
  useEffect(() => {
    // Mostrar información del entorno
    console.log('=== PRUEBA DEL SISTEMA DE LOGGING ===');
    console.log('Modo:', import.meta.env.MODE);
    console.log('Es desarrollo:', isDev);
    console.log('Debug logs habilitados:', import.meta.env.VITE_ENABLE_DEBUG_LOGS);
    console.log('Logs sensibles habilitados:', import.meta.env.VITE_ENABLE_SENSITIVE_LOGS);
    
    // Probar diferentes tipos de logs
    logger.dev('🔧 Este es un log de desarrollo');
    logger.info('ℹ️ Este es un log de información');
    logger.success('✅ Este es un log de éxito');
    logger.warn('⚠️ Este es un log de advertencia');
    logger.error('❌ Este es un log de error');
    
    // Logs con datos sensibles
    logger.sensitive('🔒 Datos sensibles', {
      usuario: { id: '123', email: 'test@example.com' },
      token: 'abc123xyz789',
      apiResponse: { data: 'información privada' }
    });
    
    logger.debug('🔍 Datos de debug', {
      estado: 'testing',
      variables: { a: 1, b: 2 }
    });
    
    // Simulación de error con detalles
    try {
      throw new Error('Error simulado para prueba');
    } catch (error) {
      logger.error('Error capturado en testing', error);
    }
    
    console.log('=== FIN DE PRUEBA ===');
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Prueba del Sistema de Logging</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">Estado del Sistema:</h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Modo:</strong> {import.meta.env.MODE}</li>
          <li><strong>Es desarrollo:</strong> {isDev ? 'Sí' : 'No'}</li>
          <li><strong>Debug logs:</strong> {import.meta.env.VITE_ENABLE_DEBUG_LOGS}</li>
          <li><strong>Logs sensibles:</strong> {import.meta.env.VITE_ENABLE_SENSITIVE_LOGS}</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-yellow-800 mb-2">🧪 Instrucciones de Prueba:</h2>
        <ol className="text-sm text-yellow-700 space-y-2 list-decimal list-inside">
          <li>Abre la <strong>Consola del Navegador</strong> (F12)</li>
          <li>En <strong>DESARROLLO</strong> deberías ver todos los logs</li>
          <li>Para probar <strong>PRODUCCIÓN</strong>:</li>
          <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
            <li>Ejecuta: <code className="bg-yellow-100 px-1 rounded">npm run build</code></li>
            <li>Luego: <code className="bg-yellow-100 px-1 rounded">npm run preview</code></li>
            <li>Los logs sensibles desaparecerán</li>
          </ul>
        </ol>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="font-semibold text-green-800 mb-2">✅ Tipos de Logs Probados:</h2>
        <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
          <li><code>logger.dev()</code> - Solo desarrollo</li>
          <li><code>logger.sensitive()</code> - Datos sensibles (solo desarrollo)</li>
          <li><code>logger.debug()</code> - Información de depuración</li>
          <li><code>logger.info()</code> - Información general</li>
          <li><code>logger.error()</code> - Errores (siempre visible)</li>
        </ul>
      </div>
    </div>
  );
};

export default LoggingTest;
