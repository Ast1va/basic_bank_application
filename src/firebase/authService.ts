import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './config';

const auth = getAuth(app);

/**
 * Yeni kullanıcı kaydı (Register)
 */
export const registerUser = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Giriş yap (Login)
 */
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential; // 🔧 Tüm userCredential nesnesini döndür
};

/**
 * Çıkış yap (Logout)
 */
export const logoutUser = async () => {
  await signOut(auth);
};

/**
 * Oturum değişikliğini izleme (Login olup olmadığını takip et)
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
