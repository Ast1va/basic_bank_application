import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface Summary {
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  activeMonths: number;
}

const AdminSummaryCards = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalSummary = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'transactions'));

        let totalSent = 0;
        let totalReceived = 0;
        const allMonths = new Set<string>();

        snapshot.forEach((doc) => {
          const data = doc.data();
          const amount = data.amount || 0;
          const from = data.from;
          const to = data.to;
          const timestamp = data.timestamp?.toDate?.();

          if (from) totalSent += amount;
          if (to) totalReceived += amount;

          if (timestamp instanceof Date) {
            const key = `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}`;
            allMonths.add(key);
          }
        });

        setSummary({
          totalSent,
          totalReceived,
          transactionCount: snapshot.size,
          activeMonths: allMonths.size,
        });
      } catch (error) {
        console.error('Admin özet verisi alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalSummary();
  }, []);

  if (loading) return <p>Yükleniyor...</p>;
  if (!summary) return <p>Veri bulunamadı.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 rounded-xl shadow bg-white text-center">
        <p className="text-sm text-gray-500">Toplam Gönderim</p>
        <p className="text-lg font-semibold text-blue-600">₺{summary.totalSent}</p>
      </div>

      <div className="p-4 rounded-xl shadow bg-white text-center">
        <p className="text-sm text-gray-500">Toplam Alım</p>
        <p className="text-lg font-semibold text-green-600">₺{summary.totalReceived}</p>
      </div>

      <div className="p-4 rounded-xl shadow bg-white text-center">
        <p className="text-sm text-gray-500">İşlem Sayısı</p>
        <p className="text-lg font-semibold">{summary.transactionCount}</p>
      </div>

      <div className="p-4 rounded-xl shadow bg-white text-center">
        <p className="text-sm text-gray-500">Aktif Aylar</p>
        <p className="text-lg font-semibold">{summary.activeMonths}</p>
      </div>
    </div>
  );
};

export default AdminSummaryCards;
