import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';

/**
 * Kullanıcı için Firestore'da tek bir hesap oluşturur (eğer yoksa)
 */
export const createUserAccountIfNotExists = async (userId: string) => {
  const docRef = doc(db, 'accounts', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, { balance: 0 });
  }
};

/**
 * Belirli bir kullanıcının hesabını getirir
 */
export const getUserAccount = async (
  userId: string
): Promise<{ balance: number }> => {
  const docRef = doc(db, 'accounts', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Hesap bulunamadı');
  return docSnap.data() as { balance: number };
};

/**
 * Kullanıcının bakiyesini günceller
 */
export const updateUserBalance = async (userId: string, newBalance: number) => {
  const docRef = doc(db, 'accounts', userId);
  await updateDoc(docRef, { balance: newBalance });
};

/**
 * 🔒 Sadece admin paneli için: tüm hesapları listele
 */
export const getAllAccounts = async (): Promise<
  { id: string; balance: number }[]
> => {
  const snapshot = await getDocs(collection(db, 'accounts'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { balance: number }),
  }));
};

/**
 * Bir kullanıcı hesabını Firebase'den sil
 */
export const deleteAccountFromFirebase = async (userId: string) => {
  const docRef = doc(db, 'accounts', userId);
  await deleteDoc(docRef);
};
