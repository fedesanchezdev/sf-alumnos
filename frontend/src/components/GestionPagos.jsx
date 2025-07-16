import { useState, useEffect } from 'react';
import { pagosService, usuariosService, clasesService } from '../services/api';
import { formatearFechaCorta } from '../utils/fechas';
import { agruparPagosPorMes } from '../utils/pagosFechas';
import { codificarParaWhatsApp, enviarWhatsApp } from '../utils/whatsapp';
import LoadingSpinner from './LoadingSpinner';

// Componente para renderizar una card de pago
const PagoCard = ({ pago, onEdit, onEliminar }) => {
  // Función para formatear solo las fechas de clases (sin cantidad)
  const formatearFechasClases = (clases) => {
    if (!clases || clases.length === 0) return 'Sin clases';
    
    // Agrupar clases por mes
    const clasesPorMes = clases.reduce((acc, clase) => {
      const fecha = new Date(clase.fecha);
      const mesAno = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      
      if (!acc[mesAno]) {
        acc[mesAno] = {
          nombreMes: fecha.toLocaleString('es-ES', { month: 'long' }),
          fechas: []
        };
      }
      
      acc[mesAno].fechas.push(fecha.getDate());
      return acc;
    }, {});
    
    // Crear rangos por mes
    const rangos = Object.values(clasesPorMes).map(mes => {
      const fechasOrdenadas = mes.fechas.sort((a, b) => a - b);
      const nombreMes = mes.nombreMes.charAt(0).toUpperCase() + mes.nombreMes.slice(1);
      
      // Para un mismo mes, mostrar todas las fechas separadas por guiones
      const fechasTexto = fechasOrdenadas.join('-');
      return `${nombreMes} ${fechasTexto}`;
    });
    
    // Unir los rangos de diferentes meses con guión
    return rangos.join(' - ');
  };

  // Función para descargar factura
  const descargarFactura = async () => {
    if (!pago.linkFactura) return;
    
    try {
      // Crear un elemento <a> temporal para descargar
      const link = document.createElement('a');
      link.href = pago.linkFactura;
      link.download = `Factura_${pago.usuario.nombre}_${pago.usuario.apellido}_${formatearFechaCorta(pago.fechaPago)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar factura:', error);
      // Fallback: abrir en nueva pestaña
      window.open(pago.linkFactura, '_blank');
    }
  };

  // Función para compartir por WhatsApp con formato específico
  const compartirPorWhatsApp = () => {
    const monto = `$${pago.monto.toLocaleString()}`;
    const fechas = formatearFechasClases(pago.clasesDetalle);
    const fechaPago = formatearFechaCorta(pago.fechaPago);
    
    // Formato específico solicitado con emojis (usando el mismo método que resúmenes)
    let mensaje = `⭐⭐⭐⭐⭐⭐⭐⭐⭐\n\n`;
    mensaje += `*Pagado ${monto} - ${fechas}*\n\n`;
    
    // Agregar comentarios/descripción si existen
    if (pago.descripcion && pago.descripcion.trim() !== '') {
      mensaje += `💬 ${pago.descripcion}\n\n`;
    }
    
    mensaje += `📅 ${fechaPago}\n\n`;
    
    // Agregar link de factura si existe
    if (pago.linkFactura) {
      mensaje += `*Descargar factura*\n📘📘📘📘📘📘📘📘📘\n${pago.linkFactura}`;
    }
    
    // Usar la función actualizada de WhatsApp con teléfono del usuario
    if (pago.usuario?.telefono) {
      enviarWhatsApp(mensaje, pago.usuario.telefono);
    } else {
      enviarWhatsApp(mensaje);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {pago.usuario.nombre} {pago.usuario.apellido}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={compartirPorWhatsApp}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
            title="Compartir por WhatsApp"
          >
            📱
          </button>
          <button
            onClick={() => onEdit(pago)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ✏️
          </button>
          <button
            onClick={() => onEliminar(pago._id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-left">
          <span className="font-semibold text-base text-gray-900">
            ${pago.monto.toLocaleString()}
          </span>
        </div>
        
        {/* Solo fechas de clases, sin cantidad */}
        <div className="text-left">
          <span className="text-sm text-gray-600">
            {pago.clasesDetalle ? formatearFechasClases(pago.clasesDetalle) : 'Cargando...'}
          </span>
        </div>

        {pago.descripcion && (
          <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-200">
            <p className="text-sm text-amber-800">{pago.descripcion}</p>
          </div>
        )}

        {pago.linkFactura && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-blue-600">📄 Factura digital</span>
            <button
              onClick={descargarFactura}
              className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              ⬇ Descargar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const GestionPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [pagosActuales, setPagosActuales] = useState([]);
  const [pagosHistoricos, setPagosHistoricos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [tipoCreacion, setTipoCreacion] = useState('periodo'); // 'periodo' o 'individual'
  const [fechasIndividuales, setFechasIndividuales] = useState(['']);
  
  // Estado para notificaciones temporales
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const [formData, setFormData] = useState({
    usuarioId: '',
    monto: '',
    fechaInicio: '',
    fechaFin: '',
    descripcion: '',
    linkFactura: ''
  });

  // Función para mostrar notificaciones temporales
  const mostrarNotificacion = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000); // Ocultar después de 3 segundos
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [pagosResponse, usuariosResponse] = await Promise.all([
        pagosService.obtenerTodos(),
        usuariosService.obtenerTodos()
      ]);
      
      const todosPagos = pagosResponse.data;
      
      // Obtener clases para cada pago para mostrar información adicional
      const pagosConClases = await Promise.all(
        todosPagos.map(async (pago) => {
          try {
            // Usar el nuevo endpoint para obtener clases por pago directamente
            const clasesResponse = await clasesService.obtenerPorPago(pago._id);
            const clasesDelPago = clasesResponse.data;
            
            return {
              ...pago,
              totalClases: clasesDelPago.length,
              clasesActivas: clasesDelPago.filter(c => c.activo !== false).length,
              clasesDetalle: clasesDelPago // Agregar el detalle completo de las clases
            };
          } catch (error) {
            console.error('Error al obtener clases para pago:', pago._id);
            // Fallback: intentar con el método anterior si el nuevo endpoint falla
            try {
              const clasesResponse = await clasesService.obtenerPorUsuario(pago.usuario._id);
              const clasesDelPago = clasesResponse.data.filter(clase => 
                clase.pago && clase.pago._id && clase.pago._id.toString() === pago._id.toString()
              );
              
              return {
                ...pago,
                totalClases: clasesDelPago.length,
                clasesActivas: clasesDelPago.filter(c => c.activo !== false).length,
                clasesDetalle: clasesDelPago // Agregar el detalle completo de las clases
              };
            } catch (fallbackError) {
              console.error('Error en fallback para pago:', pago._id, fallbackError);
              return {
                ...pago,
                totalClases: 0,
                clasesActivas: 0,
                clasesDetalle: [] // Array vacío si no se pueden obtener las clases
              };
            }
          }
        })
      );
      
      setPagos(pagosConClases);
      setUsuarios(usuariosResponse.data);
      
      // Agrupar pagos por mes actual e históricos
      const { pagosActuales, pagosHistoricos } = agruparPagosPorMes(pagosConClases);
      setPagosActuales(pagosActuales);
      setPagosHistoricos(pagosHistoricos);
      
    } catch (error) {
      setError('Error al cargar los datos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let pagoData = {
        monto: formData.monto,
        descripcion: formData.descripcion,
        linkFactura: formData.linkFactura
      };

      // Para nuevos pagos
      if (!editingPago) {
        pagoData.usuarioId = formData.usuarioId;
        
        // Validaciones del frontend para creación
        if (tipoCreacion === 'individual') {
          const fechasValidas = fechasIndividuales.filter(fecha => fecha.trim() !== '');
          if (fechasValidas.length === 0) {
            mostrarNotificacion('Debe agregar al menos una fecha de clase para crear el pago.', 'error');
            return;
          }
          pagoData.fechasClases = fechasValidas;
        } else if (tipoCreacion === 'periodo') {
          // Validar que las fechas de período estén completas
          if (!formData.fechaInicio || !formData.fechaFin) {
            mostrarNotificacion('Debe especificar fechas de inicio y fin para crear clases automáticamente.', 'error');
            return;
          }
          
          // Validar que la fecha de fin sea posterior a la de inicio
          const fechaInicio = new Date(formData.fechaInicio);
          const fechaFin = new Date(formData.fechaFin);
          if (fechaFin <= fechaInicio) {
            mostrarNotificacion('La fecha de fin debe ser posterior a la fecha de inicio.', 'error');
            return;
          }
          
          pagoData.fechaInicio = formData.fechaInicio;
          pagoData.fechaFin = formData.fechaFin;
        }
      } 
      // Para editar pagos existentes
      else {
        // Solo incluir fechas si realmente cambiaron
        const fechaInicioOriginal = editingPago.fechaInicio ? editingPago.fechaInicio.split('T')[0] : '';
        const fechaFinOriginal = editingPago.fechaFin ? editingPago.fechaFin.split('T')[0] : '';
        
        const fechaInicioCambio = formData.fechaInicio !== fechaInicioOriginal;
        const fechaFinCambio = formData.fechaFin !== fechaFinOriginal;
        
        console.log('🔍 Verificando cambios de fechas:');
        console.log(`  Fecha inicio: ${fechaInicioOriginal} → ${formData.fechaInicio} (cambió: ${fechaInicioCambio})`);
        console.log(`  Fecha fin: ${fechaFinOriginal} → ${formData.fechaFin} (cambió: ${fechaFinCambio})`);
        
        if (tipoCreacion === 'individual') {
          // Para clases individuales, siempre enviar las fechas de clases
          const fechasValidas = fechasIndividuales.filter(fecha => fecha.trim() !== '');
          if (fechasValidas.length === 0) {
            mostrarNotificacion('Debe agregar al menos una fecha de clase.', 'error');
            return;
          }
          pagoData.fechasClases = fechasValidas;
        } else if (tipoCreacion === 'periodo') {
          // Solo incluir fechas de período si cambiaron
          if (fechaInicioCambio || fechaFinCambio) {
            if (!formData.fechaInicio || !formData.fechaFin) {
              mostrarNotificacion('Debe especificar fechas de inicio y fin.', 'error');
              return;
            }
            
            // Validar que la fecha de fin sea posterior a la de inicio
            const fechaInicio = new Date(formData.fechaInicio);
            const fechaFin = new Date(formData.fechaFin);
            if (fechaFin <= fechaInicio) {
              mostrarNotificacion('La fecha de fin debe ser posterior a la fecha de inicio.', 'error');
              return;
            }
            
            pagoData.fechaInicio = formData.fechaInicio;
            pagoData.fechaFin = formData.fechaFin;
            console.log('📅 Incluyendo fechas cambiadas en la actualización');
          } else {
            console.log('ℹ️  No se incluyen fechas - no hubo cambios');
          }
        }
      }

      if (editingPago) {
        console.log('🔄 Datos a enviar para actualización:', pagoData);
        console.log('📝 Link de factura en formData:', formData.linkFactura);
        console.log('📝 Link de factura en pagoData:', pagoData.linkFactura);
        await pagosService.actualizar(editingPago._id, pagoData);
        mostrarNotificacion('Pago actualizado exitosamente', 'success');
      } else {
        const response = await pagosService.crear(pagoData);
        const nuevoPago = response.data;
        
        // Mostrar información sobre las clases creadas
        let mensaje = 'Pago creado exitosamente';
        if (nuevoPago.clases && nuevoPago.clases.length > 0) {
          mensaje += ` - Se crearon ${nuevoPago.clases.length} clases automáticamente`;
        }
        if (pagoData.linkFactura) {
          mensaje += ' - Factura digital guardada';
        }
        mostrarNotificacion(mensaje, 'success');
      }
      
      await cargarDatos();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar pago:', error);
      
      // Manejo específico de errores del backend
      if (error.response?.data?.error === 'CLASES_REQUERIDAS') {
        mostrarNotificacion(error.response.data.message, 'error');
      } else if (error.response?.data?.message) {
        mostrarNotificacion(`Error: ${error.response.data.message}`, 'error');
      } else {
        mostrarNotificacion('Error al guardar el pago. Verifique que todos los campos estén completos.', 'error');
      }
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      try {
        await pagosService.eliminar(id);
        await cargarDatos();
        mostrarNotificacion('Pago eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error al eliminar pago:', error);
        mostrarNotificacion('Error al eliminar el pago', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      usuarioId: '',
      monto: '',
      fechaInicio: '',
      fechaFin: '',
      descripcion: '',
      linkFactura: ''
    });
    setEditingPago(null);
    setTipoCreacion('periodo');
    setFechasIndividuales(['']);
  };

  const handleEdit = async (pago) => {
    setEditingPago(pago);
    
    // Determinar el tipo de creación basado en los datos del pago
    const tipoEdicion = (pago.fechaInicio && pago.fechaFin) ? 'periodo' : 'individual';
    setTipoCreacion(tipoEdicion);
    
    setFormData({
      usuarioId: pago.usuario._id,
      monto: pago.monto,
      fechaInicio: pago.fechaInicio ? pago.fechaInicio.split('T')[0] : '',
      fechaFin: pago.fechaFin ? pago.fechaFin.split('T')[0] : '',
      descripcion: pago.descripcion || '',
      linkFactura: pago.linkFactura || ''
    });

    // Si es un pago de clases individuales, cargar las fechas
    if (tipoEdicion === 'individual') {
      try {
        const clasesResponse = await clasesService.obtenerPorPago(pago._id);
        const fechasClases = clasesResponse.data.map(clase => 
          new Date(clase.fecha).toISOString().split('T')[0]
        );
        setFechasIndividuales(fechasClases.length > 0 ? fechasClases : ['']);
      } catch (error) {
        console.error('Error al cargar fechas de clases:', error);
        setFechasIndividuales(['']);
      }
    } else {
      setFechasIndividuales(['']);
    }
    
    setShowModal(true);
  };

  const agregarFechaIndividual = () => {
    setFechasIndividuales([...fechasIndividuales, '']);
  };

  const eliminarFechaIndividual = (index) => {
    const nuevasFechas = fechasIndividuales.filter((_, i) => i !== index);
    setFechasIndividuales(nuevasFechas.length > 0 ? nuevasFechas : ['']);
  };

  const actualizarFechaIndividual = (index, fecha) => {
    const nuevasFechas = [...fechasIndividuales];
    nuevasFechas[index] = fecha;
    setFechasIndividuales(nuevasFechas);
  };

  const calcularDuracion = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 'N/A';
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin - inicio;
    const semanas = Math.ceil(diferencia / (1000 * 60 * 60 * 24 * 7));
    return semanas;
  };

  if (loading) {
    return (
      <LoadingSpinner 
        title="Cargando pagos..."
        subtitle="Obteniendo información de pagos y usuarios"
        showRenderMessage={true}
        size="medium"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Notificación temporal */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Pagos
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          ➕ Nuevo Pago
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Pagos del mes actual */}
      {pagosActuales.length > 0 && (
        <div className="mb-8">
          <details open className="border border-blue-200 rounded-lg bg-blue-50">
            <summary className="cursor-pointer bg-blue-100 hover:bg-blue-200 p-4 font-bold text-blue-900 flex justify-between items-center rounded-t-lg">
              <span className="flex items-center">
                📅 Pagos de {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                <span className="ml-3 bg-blue-600 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {pagosActuales.length}
                </span>
              </span>
              <span className="text-sm text-blue-700">Mes actual</span>
            </summary>
            
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pagosActuales.map((pago) => (
                  <PagoCard
                    key={pago._id}
                    pago={pago}
                    onEdit={handleEdit}
                    onEliminar={handleEliminar}
                  />
                ))}
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Pagos históricos organizados por mes (más recientes primero) */}
      {pagosHistoricos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            Historial de Pagos
            <span className="ml-3 text-sm text-gray-600 font-normal">
              ({pagosHistoricos.reduce((total, grupo) => total + grupo.pagos.length, 0)} pagos)
            </span>
          </h2>
          
          <div className="space-y-4">
            {pagosHistoricos.map((grupoMes) => (
              <details key={grupoMes.mesAnio} className="border border-gray-200 rounded-lg">
                <summary className="cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 font-medium text-gray-900 flex justify-between items-center">
                  <span className="capitalize">📆 {grupoMes.mesAnio}</span>
                  <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {grupoMes.pagos.length} {grupoMes.pagos.length === 1 ? 'pago' : 'pagos'}
                  </span>
                </summary>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {grupoMes.pagos.map((pago) => (
                      <PagoCard
                        key={pago._id}
                        pago={pago}
                        onEdit={handleEdit}
                        onEliminar={handleEliminar}
                      />
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay pagos */}
      {pagosActuales.length === 0 && pagosHistoricos.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">💰</span>
          </div>
          <p className="text-gray-600 text-lg font-medium">No hay pagos registrados</p>
          <p className="text-gray-500 text-sm mt-2">
            Crea el primer pago para comenzar a gestionar las clases
          </p>
        </div>
      )}

      {/* Modal para crear/editar pago */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingPago ? 'Editar Pago' : 'Nuevo Pago'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <select
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({...formData, usuarioId: e.target.value})}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario._id} value={usuario._id}>
                      {usuario.nombre} {usuario.apellido} ({usuario.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto ($)
                </label>
                <input
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
                  required
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="56200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de programación de clases
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="periodo"
                      checked={tipoCreacion === 'periodo'}
                      onChange={(e) => setTipoCreacion(e.target.value)}
                      className="mr-2"
                      disabled={editingPago}
                    />
                    Por período (semanal)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="individual"
                      checked={tipoCreacion === 'individual'}
                      onChange={(e) => setTipoCreacion(e.target.value)}
                      className="mr-2"
                      disabled={editingPago}
                    />
                    Clases individuales
                  </label>
                </div>
                
                {/* Información importante sobre las clases */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">💡</span>
                    <p className="text-sm text-blue-800">
                      <strong>Importante:</strong> Todo pago debe tener clases asociadas. 
                      {tipoCreacion === 'periodo' 
                        ? ' Se crearán clases automáticamente cada semana entre las fechas seleccionadas.'
                        : ' Debe especificar al menos una fecha de clase.'
                      }
                    </p>
                  </div>
                </div>
                
                {editingPago && (
                  <p className="text-sm text-gray-600 mb-4">
                    💡 Tipo detectado automáticamente. Para cambiar el tipo, elimine y cree un nuevo pago.
                  </p>
                )}
              </div>

              {(tipoCreacion === 'periodo' || editingPago) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de inicio
                    </label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                      required={tipoCreacion === 'periodo'}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de fin
                    </label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                      required={tipoCreacion === 'periodo'}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}

              {tipoCreacion === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fechas de clases <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Agregue las fechas específicas en que se realizarán las clases. Mínimo: 1 fecha.
                  </p>
                  {fechasIndividuales.map((fecha, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => actualizarFechaIndividual(index, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                        required
                      />
                      {fechasIndividuales.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarFechaIndividual(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Eliminar fecha"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={agregarFechaIndividual}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-400 hover:text-blue-600"
                  >
                    ➕ Agregar otra fecha
                  </button>
                  {fechasIndividuales.filter(f => f.trim() !== '').length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✅ {fechasIndividuales.filter(f => f.trim() !== '').length} fecha(s) programada(s)
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Descripción del pago..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link de Factura Digital (opcional)
                </label>
                <input
                  type="url"
                  value={formData.linkFactura}
                  onChange={(e) => setFormData({...formData, linkFactura: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="https://ejemplo.com/factura.pdf"
                />
                <p className="text-xs text-gray-500 mt-1">
                  📄 Enlace a la factura digital para descarga (Google Drive, Dropbox, etc.)
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingPago ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPagos;
