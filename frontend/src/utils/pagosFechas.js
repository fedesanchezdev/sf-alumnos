// Utilidades para fechas en pagos
export const esMesActual = (fecha) => {
  const fechaObj = new Date(fecha);
  const ahora = new Date();
  
  return fechaObj.getFullYear() === ahora.getFullYear() && 
         fechaObj.getMonth() === ahora.getMonth();
};

export const obtenerMesAnio = (fecha) => {
  const fechaObj = new Date(fecha);
  const opciones = { year: 'numeric', month: 'long' };
  return fechaObj.toLocaleDateString('es-ES', opciones);
};

export const obtenerAnio = (fecha) => {
  const fechaObj = new Date(fecha);
  return fechaObj.getFullYear();
};

export const agruparPagosPorMes = (pagos) => {
  const pagosActuales = [];
  const pagosHistoricos = [];

  pagos.forEach(pago => {
    if (esMesActual(pago.fechaPago)) {
      pagosActuales.push(pago);
    } else {
      const mesAnio = obtenerMesAnio(pago.fechaPago);
      
      // Buscar si ya existe este mes/año en el array
      let grupoMes = pagosHistoricos.find(grupo => grupo.mesAnio === mesAnio);
      
      if (!grupoMes) {
        grupoMes = {
          mesAnio: mesAnio,
          fecha: new Date(pago.fechaPago), // Para ordenamiento
          pagos: []
        };
        pagosHistoricos.push(grupoMes);
      }
      
      grupoMes.pagos.push(pago);
    }
  });

  // Ordenar grupos históricos por fecha (más recientes primero)
  pagosHistoricos.sort((a, b) => b.fecha - a.fecha);

  return { pagosActuales, pagosHistoricos };
};

export const ordenarAniosDesc = (pagosHistoricos) => {
  return Object.keys(pagosHistoricos)
    .sort((a, b) => parseInt(b) - parseInt(a)) // Más recientes primero (2025, 2024, 2023...)
    .reduce((acc, anio) => {
      acc[anio] = pagosHistoricos[anio];
      return acc;
    }, {});
};

export const ordenarMesesDesc = (mesesObj) => {
  const mesesOrdenados = {};
  
  // Crear array de entradas y ordenar por fecha
  const entradas = Object.entries(mesesObj).sort((a, b) => {
    // Convertir "mes año" a fecha para comparar
    const fechaA = new Date(a[0] + ' 1'); // "enero 2025 1"
    const fechaB = new Date(b[0] + ' 1'); // "febrero 2025 1"
    return fechaB - fechaA; // Orden descendente
  });
  
  // Reconstruir objeto ordenado
  entradas.forEach(([mesAnio, pagos]) => {
    mesesOrdenados[mesAnio] = pagos;
  });
  
  return mesesOrdenados;
};
