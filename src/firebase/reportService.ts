import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './config';
import { Transaction } from '@/types/reports';

export const getUserTransactions = async (): Promise<Transaction[]> => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  if (!uid) {
    console.warn('Kullanıcı oturumu bulunamadı.');
    return [];
  }

  const txRef = collection(db, 'transactions');
  const q = query(
    txRef,
    where('from', '==', uid),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      from: data.from,
      to: data.to,
      amount: data.amount,
      note: data.note || '',
      timestamp: data.timestamp?.toDate?.() || new Date(),
    };
  });
};

// ✅ Yeni: Hem gelen hem giden verilerle özet dönen fonksiyon
export const getTransactionSummary = async () => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  if (!uid) {
    console.warn('Kullanıcı oturumu bulunamadı.');
    return null;
  }

  const txRef = collection(db, 'transactions');

  const fromQuery = query(txRef, where('from', '==', uid));
  const toQuery = query(txRef, where('to', '==', uid));

  const [fromSnap, toSnap] = await Promise.all([
    getDocs(fromQuery),
    getDocs(toQuery),
  ]);

  let totalSent = 0;
  let totalReceived = 0;
  const allMonths = new Set<string>();

  fromSnap.forEach((doc) => {
    const data = doc.data();
    totalSent += data.amount || 0;

    const timestamp = data.timestamp?.toDate?.();
    if (timestamp instanceof Date) {
      allMonths.add(`${timestamp.getFullYear()}-${timestamp.getMonth() + 1}`);
    }
  });

  toSnap.forEach((doc) => {
    const data = doc.data();
    totalReceived += data.amount || 0;

    const timestamp = data.timestamp?.toDate?.();
    if (timestamp instanceof Date) {
      allMonths.add(`${timestamp.getFullYear()}-${timestamp.getMonth() + 1}`);
    }
  });

  return {
    totalSent,
    totalReceived,
    transactionCount: fromSnap.size + toSnap.size,
    activeMonths: allMonths.size,
  };
};
