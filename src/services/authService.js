import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getIdTokenResult,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { app } from "../config/firebase";

export const auth = getAuth(app);

// 1. Iniciar sesión con Email y Contraseña
export const iniciarSesion = async (email, password) => {
  await setPersistence(auth, browserSessionPersistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const obtenerRolUsuario = async (user) => {
  const token = await getIdTokenResult(user);
  return token.claims.role === 'gerencia' ? 'gerencia' : 'empleado';
};

// 2. Cerrar sesión
export const cerrarSesion = async () => {
  await signOut(auth);
};

// 3. Escuchar cambios de estado de autenticación
export const observarUsuario = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      callback({ user, role: await obtenerRolUsuario(user) });
    } catch (error) {
      callback({ user, role: 'empleado' });
    }
  });
};