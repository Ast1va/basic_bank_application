import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection
} from 'firebase/firestore';
import { db } from './config';
import { getAuth } from 'firebase/auth';

/**
 * Kullanıcı için Firestore'da tek bir hesap oluşturur (eğer yoksa)
 */
export const createUserAccountIfNotExists = async (userId: string, name: string) => {
  const docRef = doc(db, 'accounts', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      balance: 0,
      name,
      disabled: false,
    });
  }
};

/**
 * Belirli bir kullanıcının hesabını getirir
 */
export const getUserAccount = async (
  userId: string
): Promise<{ balance: number; name: string }> => {
  const docRef = doc(db, 'accounts', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Hesap bulunamadı');
  return docSnap.data() as { balance: number; name: string };
};

/**
 * Admin: Hesabın devre dışı bırakılma durumunu güncelle
 */
export const updateAccountDisabledStatus = async (userId: string, disabled: boolean) => {
  const docRef = doc(db, 'accounts', userId);
  await updateDoc(docRef, { disabled });
};

/**
 * 🔒 Yalnızca admin kullanıcılar bakiyeyi güncelleyebilir
 */
export const updateUserBalance = async (userId: string, newBalance: number) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Admin e-posta kontrolü
  const adminEmails = ['admin@gmail.com'];

  if (!currentUser || !adminEmails.includes(currentUser.email || '')) {
    throw new Error('Yetkisiz işlem: sadece admin bakiye güncelleyebilir.');
  }

  const docRef = doc(db, 'accounts', userId);
  await updateDoc(docRef, { balance: newBalance });
};

/**
 * 🔒 Sadece admin paneli için: tüm hesapları listele
 */
export const getAllAccounts = async (): Promise<
  { id: string; balance: number; name?: string; disabled?: boolean }[]
> => {
  const snapshot = await getDocs(collection(db, 'accounts'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { balance: number; name?: string; disabled?: boolean }),
  }));
};
