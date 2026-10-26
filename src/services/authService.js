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


export const iniciarSesion = async (email, password) => {
  await setPersistence(auth, browserSessionPersistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const obtenerRolUsuario = async (user) => {
  const token = await getIdTokenResult(user);
  return token.claims.role === 'gerencia' ? 'gerencia' : 'empleado';
};


export const cerrarSesion = async () => {
  await signOut(auth);
};


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
