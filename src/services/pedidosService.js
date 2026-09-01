import { db } from "../config/firebase";
import { collection, addDoc, doc, runTransaction, getDoc, getDocs, query, where } from "firebase/firestore";

// 1. Registrar pedido de sucursal
export const registrarPedido = async (sucursal, fecha, turno, items) => {
  return await addDoc(collection(db, "pedidos"), {
    sucursal,
    fecha,
    turno, // "Mañana" o "Tarde"
    items,  // [{ productoId: "francés", cantidad: 80 }]
    estado: "PENDIENTE",
    createdAt: new Date()
  });
};

// 2. Procesar producción con CONTROL TRANSACCIONAL (Rollback si insumos insuficientes)
export const procesarProduccion = async (insumosAProcesar) => {
  return await runTransaction(db, async (transaction) => {
    for (const item of insumosAProcesar) {
      const insumoRef = doc(db, "insumos", item.insumoId);
      const insumoSnap = await transaction.get(insumoRef);

      if (!insumoSnap.exists()) {
        throw new Error(`Insumo ${item.insumoId} no existe`);
      }

      const stockActual = insumoSnap.data().stockActual;
      const nuevoStock = stockActual - item.cantidadRequerida;

      if (nuevoStock < 0) {
        throw new Error(`Stock insuficiente de ${insumoSnap.data().nombre}. Requerido: ${item.cantidadRequerida}, Disponible: ${stockActual}`);
      }

      // Descontar inventario
      transaction.update(insumoRef, { stockActual: nuevoStock });
    }
  });
};