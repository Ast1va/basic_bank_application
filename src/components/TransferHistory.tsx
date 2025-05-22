// src/components/TransferHistory.tsx
import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useUserStore } from '@/store/useUserStore';

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp?: { toDate: () => Date };
  note?: string; // 👈 açıklama alanı eklendi
}

const TransferHistory = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!currentUser) return;

      // Gelen ve giden işlemler
      const q1 = query(
        collection(db, 'transactions'),
        where('from', '==', currentUser.id),
        orderBy('timestamp', 'desc')
      );

      const q2 = query(
        collection(db, 'transactions'),
        where('to', '==', currentUser.id),
        orderBy('timestamp', 'desc')
      );

      const [sentSnap, receivedSnap] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const combined: Transaction[] = [];

      sentSnap.forEach((doc) => combined.push({ id: doc.id, ...doc.data() } as Transaction));
      receivedSnap.forEach((doc) => combined.push({ id: doc.id, ...doc.data() } as Transaction));

      // Benzersiz UID’leri topla
      const uids = new Set<string>();
      combined.forEach((t) => {
        uids.add(t.from);
        uids.add(t.to);
      });

      // UID'leri tek tek getDoc ile al
      const map: Record<string, string> = {};
      await Promise.all(
        Array.from(uids).map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'accounts', uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              map[uid] = data.email || 'Bilinmeyen';
            } else {
              map[uid] = 'Bilinmeyen';
            }
          } catch (err) {
            console.error(`UID ${uid} için veri alınamadı:`, err);
            map[uid] = 'Erişim yok';
          }
        })
      );

      setEmailMap(map);
      setTransactions(combined);
    };

    fetchTransfers();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Transfer Geçmişi</h3>
      {transactions.length === 0 ? (
        <p className="text-gray-500">Hiç işlem bulunamadı.</p>
      ) : (
        <ul className="space-y-2">
          {transactions
            .sort((a, b) => {
              const aTime = a.timestamp?.toDate().getTime() || 0;
              const bTime = b.timestamp?.toDate().getTime() || 0;
              return bTime - aTime;
            })
            .map((t) => {
              const isSender = t.from === currentUser.id;
              const otherUid = isSender ? t.to : t.from;
              const otherEmail = emailMap[otherUid] || 'Bilinmeyen';
              const dateStr = t.timestamp?.toDate().toLocaleString('tr-TR') || 'Zaman yok';

              return (
                <li key={t.id} className="border p-3 rounded shadow-sm bg-white">
                  <p className="text-sm">
                    {isSender ? (
                      <>
                        <span className="font-medium">{otherEmail}</span> kişisine{' '}
                        <span className="font-semibold text-red-600">{t.amount}₺</span> gönderildi
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{otherEmail}</span> kişisinden{' '}
                        <span className="font-semibold text-green-600">{t.amount}₺</span> geldi
                      </>
                    )}
                  </p>

                  {t.note && (
                    <p className="text-xs text-gray-600 italic mt-1">Açıklama: {t.note}</p>
                  )}

                  <p className="text-xs text-gray-500">{dateStr}</p>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

export default TransferHistory;
