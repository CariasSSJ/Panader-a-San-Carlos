import { db } from "../config/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  runTransaction, 
  serverTimestamp 
} from "firebase/firestore";
import { PRECIOS_PANES } from "../utils/facturaPdf";

// 1. Registrar pedido de sucursal (PENDIENTE_REVISION para ser verificado primero)
export const registrarPedido = async (sucursal, fecha, turno, items) => {
  return await addDoc(collection(db, "pedidos"), {
    sucursal,
    fecha,
    turno, // "Mañana" o "Tarde"
    items,  // [{ productoId: "frances", cantidad: 80 }]
    estado: "PENDIENTE_REVISION",  // Debe ser revisado antes
    createdAt: serverTimestamp()
  });
};

// 1.5 Actualizar un pedido (para revisión/edición)
export const actualizarPedido = async (pedidoId, datosActualizados) => {
  const pedidoRef = doc(db, "pedidos", pedidoId);
  return await runTransaction(db, async (transaction) => {
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists()) {
      throw new Error(`El pedido ${pedidoId} no existe.`);
    }

    transaction.update(pedidoRef, datosActualizados);
    return { exito: true };
  });
};

// 1.6 Eliminar un pedido (para rechazar)
export const eliminarPedido = async (pedidoId) => {
  const pedidoRef = doc(db, "pedidos", pedidoId);
  return await runTransaction(db, async (transaction) => {
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists()) {
      throw new Error(`El pedido ${pedidoId} no existe.`);
    }

    // Cambiar estado a RECHAZADO en lugar de eliminar
    transaction.update(pedidoRef, {
      estado: "RECHAZADO",
      fechaRechazo: serverTimestamp()
    });
    return { exito: true };
  });
};

// 1.7 Aprobar un pedido (cambiar a APROBADO)
export const aprobarPedido = async (pedidoId) => {
  const pedidoRef = doc(db, "pedidos", pedidoId);
  return await runTransaction(db, async (transaction) => {
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists()) {
      throw new Error(`El pedido ${pedidoId} no existe.`);
    }

    transaction.update(pedidoRef, {
      estado: "APROBADO",
      fechaAprobacion: serverTimestamp()
    });
    return { exito: true };
  });
};

// 2. Procesar producción con CONTROL TRANSACCIONAL Y REGISTRO DE HISTORIAL
export const procesarProduccion = async ({
  sucursal = "CENTRAL",
  fecha = new Date().toISOString().split('T')[0],
  turno = "General",
  pedidos = [],
  insumosAProcesar = [],
  totalesPan = {},
  totalesInsumos = {}
}) => {
  // VALIDACIÓN DE ENTRADA
  if (!pedidos || pedidos.length === 0) {
    throw new Error("No hay pedidos para procesar");
  }

  const pedidosConId = pedidos.filter(p => p.id);
  if (pedidosConId.length === 0) {
    throw new Error("Los pedidos no tienen IDs válidos. No se pueden actualizar estados.");
  }

  console.log("🔵 Iniciando procesarProduccion con pedidos:", pedidosConId.map(p => p.id));

  try {
    // 1. FASE TRANSACCIONAL
    await runTransaction(db, async (transaction) => {
      
      // FASE 1: TODAS LAS LECTURAS (Reads)
      
      // Read 1: Insumos
      const lecturasInsumos = [];
      for (const item of insumosAProcesar) {
        const insumoRef = doc(db, "insumos", item.insumoId);
        const insumoSnap = await transaction.get(insumoRef);

        if (!insumoSnap.exists()) {
          throw new Error(`El insumo ${item.insumoId} no existe en la base de datos.`);
        }

        const insumoData = insumoSnap.data();
        const stockActual = insumoData.stockActual || 0;
        const nuevoStock = stockActual - item.cantidadRequerida;

        if (nuevoStock < 0) {
          throw new Error(
            `Stock insuficiente de "${insumoSnap.data().nombre}". ` +
            `Requerido: ${item.cantidadRequerida.toFixed(2)}, Disponible: ${stockActual.toFixed(2)}`
          );
        }

        lecturasInsumos.push({
          ref: insumoRef,
          insumoId: item.insumoId,
          nombre: insumoData.nombre || item.insumoId,
          nuevoStock,
          stockMinimo: insumoData.stockMinimo ?? 10
        });
      }

      // Read 2: Pedidos (Lectura previa requerida en transacciones de Firestore)
      const refsPedidos = [];
      for (const p of pedidosConId) {
        const pedidoRef = doc(db, "pedidos", p.id);
        const pedidoSnap = await transaction.get(pedidoRef);
        
        if (!pedidoSnap.exists()) {
          console.warn(`⚠️ El pedido ${p.id} no existe o fue eliminado.`);
        } else {
          refsPedidos.push(pedidoRef);
        }
      }

      console.log("📝 Pedidos a actualizar:", refsPedidos.length);

      // FASE 2: TODAS LAS ESCRITURAS (Writes)
      
      // Write 1: Actualizar Stock
      // Dentro de procesarProduccion (escrituras de la transacción):
      for (const itemActualizar of lecturasInsumos) {
        transaction.update(itemActualizar.ref, { 
          stockActual: itemActualizar.nuevoStock,
          ultimaSalidaProduccion: serverTimestamp()
        });

        // VERIFICACIÓN DE STOCK MÍNIMO PARA KEVIN
        if (itemActualizar.nuevoStock < itemActualizar.stockMinimo) {
          const alertaRef = doc(collection(db, "alertas_stock"));
          transaction.set(alertaRef, {
            insumoId: itemActualizar.insumoId,
            nombreInsumo: itemActualizar.nombre || itemActualizar.insumoId,
            stockActual: itemActualizar.nuevoStock,
            stockMinimo: itemActualizar.stockMinimo,
            mensaje: `⚠️ El insumo "${itemActualizar.nombre}" ha bajado a ${itemActualizar.nuevoStock.toFixed(2)}.`,
            leido: false,
            timestamp: serverTimestamp()
          });
        }
      }

      // Write 2: Cambiar estado del pedido a PROCESADO
      if (refsPedidos.length > 0) {
        for (const pRef of refsPedidos) {
          transaction.update(pRef, {
            estado: "PROCESADO",
            fechaProcesado: serverTimestamp()
          });
        }
        console.log("✅ Estados de pedidos actualizados a PROCESADO");
      } else {
        console.warn("⚠️ No hay pedidos para actualizar estados");
      }
    });

    // 2. FASE POST-TRANSACCIÓN: REGISTRAR EN HISTORIAL
    let totalMontoQ = 0;
    if (totalesPan && Object.keys(totalesPan).length > 0) {
      Object.entries(totalesPan).forEach(([prodId, cant]) => {
        const pUnitario = PRECIOS_PANES[prodId] || 1.00;
        totalMontoQ += Number(cant || 0) * pUnitario;
      });
    }

    const historialData = {
      sucursal,
      fechaProduccion: fecha,
      turno,
      totalesPan: totalesPan && Object.keys(totalesPan).length > 0 ? totalesPan : {},
      totalesInsumos: totalesInsumos && Object.keys(totalesInsumos).length > 0 ? totalesInsumos : {},
      totalMontoQ,
      totalPedidosProcesados: pedidosConId.length,
      fechaProcesado: new Date().toLocaleDateString('es-GT'),
      timestamp: serverTimestamp()
    };

    console.log("📊 Registrando historial:", historialData);

    const docRef = await addDoc(collection(db, "historial_despachos"), historialData);
    console.log("✅ Historial registrado con ID:", docRef.id);

    return { exito: true, historialId: docRef.id, pedidosActualizados: pedidosConId.length };
  } catch (error) {
    console.error("❌ Error en procesarProduccion:", error);
    throw error;
  }
};