import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; 


export const suscribirAlertasRuta = (callback, onError) => {
  const q = query(
    collection(db, 'incidentes_ruta'),
    orderBy('fecha_reporte', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const incidentes = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const fechaReporte = data.fecha_reporte;
        const fecha = typeof fechaReporte?.toDate === 'function'
          ? fechaReporte.toDate()
          : fechaReporte instanceof Date
            ? fechaReporte
            : fechaReporte
              ? new Date(fechaReporte)
              : null;

        return {
          id: docSnap.id,
          ...data,
          fecha_reporte: fecha && !Number.isNaN(fecha.getTime()) ? fecha : null,
        };
      });
      callback(incidentes);
    },
    (error) => {
      console.error('Error al escuchar alertas de ruta:', error);
      onError(error);
    }
  );
};


export const marcarAlertaResuelta = async (idIncidente) => {
  try {
    const docRef = doc(db, 'incidentes_ruta', idIncidente);
    await updateDoc(docRef, {
      estado: 'RESUELTA',
      fecha_resolucion: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error("Error al resolver la alerta:", error);
    return { success: false, error };
  }
};
