import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './config';
import { Transaction } from '@/types/reports';

// ✅ Kullanıcının sadece kendi işlemlerini çeker
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

// ✅ Özet verileri döner (toplam gönderim, alım, işlem sayısı)
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

// ✅ ADMIN: Tüm kullanıcıların toplam gönderdiği miktarı döner (e-posta bazlı)
export const getTotalSentPerUser = async (): Promise<{ email: string; total: number }[]> => {
  const transactionsSnap = await getDocs(collection(db, 'transactions'));

  const totalsByUid: Record<string, number> = {};

  transactionsSnap.forEach((doc) => {
    const data = doc.data();
    if (!data.from || typeof data.amount !== 'number') return;
    totalsByUid[data.from] = (totalsByUid[data.from] || 0) + data.amount;
  });

  const userIds = Object.keys(totalsByUid);
  if (userIds.length === 0) return [];

  const accountSnap = await getDocs(
    query(collection(db, 'accounts'), where('__name__', 'in', userIds))
  );

  const uidToEmail: Record<string, string> = {};
  accountSnap.forEach((doc) => {
    uidToEmail[doc.id] = doc.data().email;
  });

  return userIds.map((uid) => ({
    email: uidToEmail[uid] || uid,
    total: totalsByUid[uid],
  }));
};
