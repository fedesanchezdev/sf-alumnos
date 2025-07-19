import { useState, useEffect } from 'react';

const LoadingSpinner = ({ 
  title = "Cargando...", 
  subtitle = null,
  showRenderMessage = false,
  size = "large" 
}) => {
  const [showRenderTip, setShowRenderTip] = useState(false);

  useEffect(() => {
    if (showRenderMessage) {
      // Mostrar el mensaje de Render después de 3 segundos
      const timer = setTimeout(() => {
        setShowRenderTip(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showRenderMessage]);

  const sizeClasses = {
    small: "h-8 w-8",
    medium: "h-12 w-12", 
    large: "h-16 w-16"
  };

  const containerClasses = {
    small: "min-h-32",
    medium: "min-h-48",
    large: "min-h-64"
  };

  return (
    <div className={`flex justify-center items-center ${containerClasses[size]}`}>
      <div className="text-center max-w-md mx-auto px-4">
        {/* Spinner principal */}
        <div className="relative mb-6">
          {/* Anillo exterior */}
          <div className={`${sizeClasses[size]} mx-auto relative`}>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
          </div>
          
          {/* Punto central */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Título principal */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>

        {/* Subtítulo opcional */}
        {subtitle && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {subtitle}
          </p>
        )}

        {/* Mensaje de Render (aparece después de 3 segundos) */}
        {showRenderMessage && (
          <div className={`transition-all duration-500 ${showRenderTip ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'}`}>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Despertando el servidor...
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    El servidor está iniciando en Render.com. Esto puede tomar unos momentos la primera vez.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Puntos de carga animados */}
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
