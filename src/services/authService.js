import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { app } from "../config/firebase";

export const auth = getAuth(app);

// 1. Iniciar sesión con Email y Contraseña
export const iniciarSesion = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// 2. Cerrar sesión
export const cerrarSesion = async () => {
  await signOut(auth);
};

// 3. Escuchar cambios de estado de autenticación
export const observarUsuario = (callback) => {
  return onAuthStateChanged(auth, callback);
};