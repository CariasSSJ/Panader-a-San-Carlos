import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcoN0XSaXguGdxfmFVxsJrX_eZe-bNhh4",
  authDomain: "panaderia-san-carlos.firebaseapp.com",
  projectId: "panaderia-san-carlos",
  storageBucket: "panaderia-san-carlos.firebasestorage.app",
  messagingSenderId: "1082884379025",
  appId: "1:1082884379025:web:0627f3036483aafacd8a30",
  measurementId: "G-W29BM4M9BP"
};

// 1. Inicializar Firebase y exportar 'app'
export const app = initializeApp(firebaseConfig);

// 2. Inicializar Firestore y exportar 'db'
export const db = getFirestore(app);