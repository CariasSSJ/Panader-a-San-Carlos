import { db } from "../config/firebase";
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, increment } from "firebase/firestore";


export const obtenerInsumos = async () => {
  const snapshot = await getDocs(collection(db, "insumos"));
  const insumos = [];
  snapshot.forEach(docSnap => {
    insumos.push({ id: docSnap.id, ...docSnap.data() });
  });
  return insumos;
};


export const agregarStockInsumo = async (insumoId, nombreInsumo, unidad, cantidadIngresada, proveedor) => {
  const insumoRef = doc(db, "insumos", insumoId);
  const insumoSnap = await getDoc(insumoRef);

  if (insumoSnap.exists()) {
    await updateDoc(insumoRef, {
      stockActual: increment(Number(cantidadIngresada)),
      ultimoProveedor: proveedor,
      ultimaActualizacion: new Date()
    });
  } else {
    await setDoc(insumoRef, {
      nombre: nombreInsumo,
      unidad: unidad,
      stockActual: Number(cantidadIngresada),
      ultimoProveedor: proveedor,
      ultimaActualizacion: new Date()
    });
  }
};


export const obtenerRecetas = async () => {
  const snapshot = await getDocs(collection(db, "recetas"));
  const recetas = {};
  snapshot.forEach(docSnap => {
    recetas[docSnap.id] = docSnap.data().ingredientes;
  });
  return recetas;
};


export const guardarRecetaProducto = async (productoId, ingredientes) => {
  const recetaRef = doc(db, "recetas", productoId);
  await setDoc(recetaRef, {
    productoId,
    ingredientes, 
    updatedAt: new Date()
  });
};


const normalizarCantidadesRecetas = async () => {
  const snapshot = await getDocs(collection(db, "recetas"));

  for (const recetaDoc of snapshot.docs) {
    const receta = recetaDoc.data();
    const ingredientes = receta.ingredientes || [];
    let necesitaActualizacion = false;

    const ingredientesNormalizados = ingredientes.map((ingrediente) => {
      const cantidad = Number(ingrediente.cantidad);
      if (cantidad === 0.005 || cantidad === 0.05) {
        necesitaActualizacion = true;
        return { ...ingrediente, cantidad: 0.5 };
      }
      return ingrediente;
    });

    if (necesitaActualizacion) {
      await updateDoc(doc(db, "recetas", recetaDoc.id), {
        ingredientes: ingredientesNormalizados,
        updatedAt: new Date()
      });
    }
  }
};

export const inicializarInsumosYRecetas = async () => {
  
  const INSUMOS_BASE = [
    { id: "harina_fuerza", nombre: "Harina de fuerza", unidad: "lbs", stockActual: 1000, ultimoProveedor: "Molinos Modernos" },
    { id: "harina_suave", nombre: "Harina suave", unidad: "lbs", stockActual: 800, ultimoProveedor: "Molinos Modernos" },
    { id: "leche", nombre: "Leche", unidad: "litros", stockActual: 200, ultimoProveedor: "Lacteos S.A." },
    { id: "azucar", nombre: "Azúcar", unidad: "lbs", stockActual: 500, ultimoProveedor: "Ingenio La Unión" },
    { id: "huevo", nombre: "Huevo", unidad: "unidades", stockActual: 2000, ultimoProveedor: "Avícola Central" },
    { id: "mantequilla", nombre: "Mantequilla / Manteca", unidad: "lbs", stockActual: 400, ultimoProveedor: "Lacteos S.A." },
    { id: "levadura", nombre: "Levadura", unidad: "lbs", stockActual: 100, ultimoProveedor: "Distribuidora El Sol" }
  ];

  for (const insumo of INSUMOS_BASE) {
    const ref = doc(db, "insumos", insumo.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, insumo);
    }
  }

  
  const RECETAS_BASE = [
    {
      productoId: "frances",
      ingredientes: [
        { insumoId: "harina_fuerza", cantidad: 0.12 },
        { insumoId: "azucar", cantidad: 0.2 },
        { insumoId: "levadura", cantidad: 0.5 }
      ]
    },
    {
      productoId: "aleman",
      ingredientes: [
        { insumoId: "harina_fuerza", cantidad: 0.10 },
        { insumoId: "harina_suave", cantidad: 0.5 },
        { insumoId: "mantequilla", cantidad: 0.2 },
        { insumoId: "azucar", cantidad: 0.2 }
      ]
    },
    {
      productoId: "shecas",
      ingredientes: [
        { insumoId: "harina_suave", cantidad: 0.15 },
        { insumoId: "azucar", cantidad: 0.4 },
        { insumoId: "leche", cantidad: 0.3 },
        { insumoId: "huevo", cantidad: 0.2 }
      ]
    },
    {
      productoId: "cubos",
      ingredientes: [
        { insumoId: "harina_fuerza", cantidad: 0.10 },
        { insumoId: "azucar", cantidad: 0.3 },
        { insumoId: "mantequilla", cantidad: 0.2 }
      ]
    },
    {
      productoId: "cachos",
      ingredientes: [
        { insumoId: "harina_suave", cantidad: 0.11 },
        { insumoId: "mantequilla", cantidad: 0.3 },
        { insumoId: "azucar", cantidad: 0.2 }
      ]
    },
    {
      productoId: "cortadas",
      ingredientes: [
        { insumoId: "harina_suave", cantidad: 0.10 },
        { insumoId: "azucar", cantidad: 0.3 },
        { insumoId: "huevo", cantidad: 0.2 }
      ]
    },
    {
      productoId: "batidas",
      ingredientes: [
        { insumoId: "harina_suave", cantidad: 0.8 },
        { insumoId: "huevo", cantidad: 0.3 },
        { insumoId: "leche", cantidad: 0.4 },
        { insumoId: "azucar", cantidad: 0.3 }
      ]
    },
    {
      productoId: "campechanas",
      ingredientes: [
        { insumoId: "harina_fuerza", cantidad: 0.14 },
        { insumoId: "mantequilla", cantidad: 0.4 },
        { insumoId: "azucar", cantidad: 0.3 }
      ]
    }
  ];

  for (const receta of RECETAS_BASE) {
    const recetaRef = doc(db, "recetas", receta.productoId);
    const snap = await getDoc(recetaRef);
    if (!snap.exists()) {
      await setDoc(recetaRef, {
        ...receta,
        updatedAt: new Date()
      });
    }
  }

  // Corrige recetas antiguas que fueron guardadas con 0.005 o 0.05 lbs.
  await normalizarCantidadesRecetas();
};
