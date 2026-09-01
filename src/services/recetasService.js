import { db } from "../config/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

// Definición de insumos base (según el enunciado)
export const INSUMOS_BASE = [
  { id: "harina_fuerza", nombre: "Harina de fuerza", unidad: "lbs", stockActual: 1000 },
  { id: "harina_suave", nombre: "Harina suave", unidad: "lbs", stockActual: 800 },
  { id: "vinagre", nombre: "Vinagre", unidad: "litros", stockActual: 100 },
  { id: "leche", nombre: "Leche", unidad: "litros", stockActual: 200 },
  { id: "jugo_fruta", nombre: "Jugo de fruta", unidad: "litros", stockActual: 150 },
  { id: "levadura_fresca", nombre: "Levadura fresca", unidad: "oz", stockActual: 300 },
  { id: "levadura_seca", nombre: "Levadura seca", unidad: "oz", stockActual: 300 },
  { id: "azucar", nombre: "Azúcar", unidad: "lbs", stockActual: 500 },
  { id: "sal", nombre: "Sal", unidad: "lbs", stockActual: 200 },
  { id: "huevo", nombre: "Huevo", unidad: "unidades", stockActual: 2000 }
];

// Recetas por defecto por cada tipo de pan (cantidades por unidad de pan)
export const RECETAS_POR_DEFECTO = {
  frances: [
    { insumoId: "harina_fuerza", cantidad: 0.1 }, // 0.1 lb por pan
    { insumoId: "levadura_seca", cantidad: 0.05 },
    { insumoId: "sal", cantidad: 0.02 }
  ],
  aleman: [
    { insumoId: "harina_suave", cantidad: 0.12 },
    { insumoId: "leche", cantidad: 0.05 },
    { insumoId: "azucar", cantidad: 0.03 },
    { insumoId: "huevo", cantidad: 0.5 }
  ],
  shecas: [
    { insumoId: "harina_fuerza", cantidad: 0.15 },
    { insumoId: "leche", cantidad: 0.08 },
    { insumoId: "azucar", cantidad: 0.05 },
    { insumoId: "levadura_fresca", cantidad: 0.04 }
  ]
  // Se pueden añadir más dinámicamente
};

// Cargar insumos iniciales en Firestore si la colección está vacía
export const inicializarInsumosYRecetas = async () => {
  for (const insumo of INSUMOS_BASE) {
    const ref = doc(db, "insumos", insumo.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, insumo);
    }
  }

  for (const [productoId, ingredientes] of Object.entries(RECETAS_POR_DEFECTO)) {
    const ref = doc(db, "recetas", productoId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { productoId, ingredientes });
    }
  }
};

// Obtener todas las recetas de Firestore
export const obtenerRecetas = async () => {
  const snapshot = await getDocs(collection(db, "recetas"));
  const recetas = {};
  snapshot.forEach(docSnap => {
    recetas[docSnap.id] = docSnap.data().ingredientes;
  });
  return recetas;
};

// Obtener inventario actual de insumos
export const obtenerInsumos = async () => {
  const snapshot = await getDocs(collection(db, "insumos"));
  const insumos = [];
  snapshot.forEach(docSnap => {
    insumos.push({ id: docSnap.id, ...docSnap.data() });
  });
  return insumos;
};