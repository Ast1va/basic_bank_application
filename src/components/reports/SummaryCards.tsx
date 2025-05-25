import React, { useEffect, useState } from 'react';
import { getTransactionSummary } from '@/firebase/reportService';
import { useUserStore } from '@/store/useUserStore'; // 👈 eklendi

interface TransactionSummary {
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  activeMonths: number;
}

const SummaryCards = () => {
  const { currentUser, loading: authLoading } = useUserStore(); // 👈 auth senkronizasyonu
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser) return; // 👈 veri çekmeden önce auth kontrol

    const fetchSummary = async () => {
      try {
        const data = await getTransactionSummary();
        setSummary(data);
      } catch (error) {
        console.error('❌ Özet veriler alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [authLoading, currentUser]);

  if (authLoading || loading) return <p>Yükleniyor...</p>;
  if (!summary) return <p>Özet veriler alınamadı.</p>;

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

export default SummaryCards;
