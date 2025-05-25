import React from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore'; // 👈 auth store'u eklendi

import MonthlySentChart from '@/components/reports/MonthlySentChart';
import TopRecipientsChart from '@/components/reports/TopRecipientsChart';
import InOutComparisonChart from '@/components/reports/InOutComparisonChart';
import SummaryCards from '@/components/reports/SummaryCards';
import ExportTransactionsButton from '@/components/reports/ExportTransactionsButton';

const ReportsPage = () => {
  const router = useRouter();
  const { loading, currentUser } = useUserStore(); // 👈 auth kontrolü

  // Eğer auth hâlâ yükleniyorsa, hiçbir bileşeni çalıştırma
  if (loading) return <p className="p-6">Oturum hazırlanıyor...</p>;

  // Eğer kullanıcı login değilse, login sayfasına yönlendir
  if (!currentUser) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Raporlama ve İstatistikler</h1>
        <div className="flex gap-2">
          <ExportTransactionsButton />
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>

      <SummaryCards />
      <MonthlySentChart />
      <TopRecipientsChart />
      <InOutComparisonChart />
    </div>
  );
};

export default ReportsPage;
