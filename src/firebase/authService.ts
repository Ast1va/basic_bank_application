import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app'; // 🔐 eklendi
import { app } from './config';

const auth = getAuth(app);

export const registerUser = async (email: string, password: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (user) {
    await updateProfile(user, {
      displayName: name,
    });
  }

  return user;
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw err; // Firebase hatasıysa doğrudan fırlat
    } else if (err instanceof Error) {
      throw new FirebaseError('auth/unknown', err.message);
    } else {
      throw new FirebaseError('auth/unknown', 'Bilinmeyen bir hata oluştu.');
    }
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
