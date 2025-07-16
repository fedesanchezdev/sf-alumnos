import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { pagosService } from '../services/api';
import { formatearFecha, formatearFechaCompacta, formatearFechaMuyCorta, formatearFechaNumericaCorta, formatearFechaAmericanaEspañol } from '../utils/fechas';

const LoadingSpinner = ({ title, subtitle, size = "normal" }) => {
  const spinnerSize = size === "small" ? "h-6 w-6" : "h-8 w-8";
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full ${spinnerSize} border-b-2 border-blue-600`}></div>
      <p className="mt-3 text-gray-600 font-medium">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

const PagoCard = ({ pago }) => {
  const [descargando, setDescargando] = useState(false);

  const handleDescargarFactura = () => {
    const urlFactura = pago.facturaUrl || pago.linkFactura;
    if (urlFactura && urlFactura !== 'undefined' && urlFactura !== '') {
      setDescargando(true);
      window.open(urlFactura, '_blank');
      setTimeout(() => setDescargando(false), 1000);
    } else {
      alert('No hay factura disponible para este pago');
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pagado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vencido':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pagado':
        return '✅';
      case 'pendiente':
        return '⏳';
      case 'vencido':
        return '❌';
      default:
        return '📄';
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-2.5 shadow-md hover:shadow-lg transition-all duration-200 w-full min-w-0 flex flex-col">
      {/* Header */}
      <div className="mb-2 flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-900 mb-1 leading-tight">
          Pago {formatearFechaNumericaCorta(pago.fechaCreacion || pago.createdAt)}
        </h3>
      </div>

      {/* Detalles del pago */}
      <div className="space-y-1 flex-grow">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Monto:</span>
          <span className="text-sm font-bold text-green-600">
            ${pago.monto?.toLocaleString()}
          </span>
        </div>

        {pago.periodo && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Período:</span>
            <span className="text-xs font-medium truncate ml-1">{pago.periodo}</span>
          </div>
        )}

        {pago.fechaVencimiento && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Vence:</span>
            <span className="text-xs font-medium">{formatearFechaCompacta(pago.fechaVencimiento)}</span>
          </div>
        )}

        {pago.metodoPago && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Método:</span>
            <span className="text-xs font-medium truncate ml-1">{pago.metodoPago}</span>
          </div>
        )}

        {/* Fechas de clases pagadas - TODAS */}
        {pago.clases && pago.clases.length > 0 && (
          <div className="mt-2 p-1.5 bg-blue-50 rounded border">
            <h4 className="text-xs font-medium text-gray-700 mb-1.5 text-center">
              📚 Clases ({pago.clases.length})
            </h4>
            <div className="space-y-1">
              {pago.clases.map((clase, index) => (
                <div key={index} className="flex flex-col gap-0.5 p-1 bg-white rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {formatearFechaAmericanaEspañol(clase.fecha)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      clase.estado === 'tomada' ? 'bg-green-100 text-green-700' :
                      clase.estado === 'ausente' ? 'bg-red-100 text-red-700' :
                      clase.estado === 'recuperada' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {clase.estado === 'no_iniciada' ? 'Pendiente' : 
                       clase.estado === 'tomada' ? 'Tomada' :
                       clase.estado === 'ausente' ? 'Ausente' :
                       clase.estado === 'recuperada' ? 'Recuperada' :
                       clase.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pago.notas && (
          <div className="mt-2 p-1.5 bg-gray-50 rounded border">
            <p className="text-xs text-gray-700">
              📝 {pago.notas}
            </p>
          </div>
        )}
      </div>

      {/* Botón de factura */}
      <div className="mt-2 pt-2 border-t border-gray-200 flex-shrink-0">
        {(() => {
          const urlFactura = pago.facturaUrl || pago.linkFactura;
          const tieneFactura = urlFactura && urlFactura !== 'undefined' && urlFactura !== '' && urlFactura !== 'null';
          
          return tieneFactura ? (
            <button
              onClick={handleDescargarFactura}
              disabled={descargando}
              className="w-full px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
            >
              {descargando ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Descargando
                </>
              ) : (
                <>
                  📄 Factura
                </>
              )}
            </button>
          ) : (
            <div className="w-full px-2 py-1 bg-gray-100 text-gray-500 rounded text-center text-xs">
              Sin factura
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const MisPagos = () => {
  const { usuario } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usuario?._id) {
      cargarPagos();
    }
  }, [usuario]);

  const cargarPagos = async () => {
    try {
      setLoading(true);
      const response = await pagosService.obtenerPorUsuario(usuario._id);
      // Ordenar pagos por fecha de creación descendente (más reciente primero)
      const pagosOrdenados = (response.data || [])
        .sort((a, b) => new Date(b.fechaCreacion || b.createdAt) - new Date(a.fechaCreacion || a.createdAt));
      setPagos(pagosOrdenados);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Mis Pagos
      </h1>

      {loading ? (
        <LoadingSpinner 
          title="Cargando pagos..." 
          subtitle="Obteniendo tu historial de pagos"
        />
      ) : pagos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 auto-rows-min">
          {pagos.map((pago) => (
            <PagoCard key={pago._id} pago={pago} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-4">�</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay pagos registrados
          </h3>
          <p className="text-gray-600">
            Tu historial de pagos y facturas aparecerán aquí.
          </p>
        </div>
      )}
    </div>
  );
};

export default MisPagos;
