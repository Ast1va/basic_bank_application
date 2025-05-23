import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { app } from './config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { useUserStore } from '@/store/useUserStore';

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
      throw err;
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

// ✅ Firebase listener (manuel kullanmak isteyenler için)
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ✅ Otomatik store senkronizasyon fonksiyonu
export const subscribeToAuthChangesAndSyncStore = () => {
  const setLoading = useUserStore.getState().setLoading;

  setLoading(true); // işlem başlarken beklemede

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;
      const email = user.email || '';

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const isAdmin = userSnap.exists() && userSnap.data().isAdmin === true;

      useUserStore.getState().login({
        id: uid,
        email,
        username: email,
        isAdmin,
      });
    } else {
      useUserStore.getState().logout();
    }

    setLoading(false); // her durumda bitir
  });
};
