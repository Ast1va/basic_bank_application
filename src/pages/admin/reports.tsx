import React from 'react';
import Head from 'next/head';
import { useUserStore } from '@/store/useUserStore';
import Link from 'next/link';
import  EnhancedAdminSummaryCards from '@/components/reports/EnhancedAdminSummaryCards';
import AdminExportPage from '@/components/reports/AdminExportPage';
import EnhancedAdminSentByUserChart from '@/components/reports/EnhancedAdminSentByUserChart';

const AdminReportsPage = () => {
  const { currentUser } = useUserStore();

  if (!currentUser || currentUser.email !== 'admin@gmail.com') {
    return <p className="text-red-600 p-4">Bu sayfaya sadece admin erişebilir.</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <Head>
        <title>Admin Raporlar | Basic Bank</title>
      </Head>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tüm Kullanıcı Raporları</h1>
        <Link href="/admin">
          <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded border text-sm">
            Admin Paneline Dön
          </button>
        </Link>
      </div>

      {/* Sadece admin için e-posta ile CSV ve Excel çıktısı */}
      <AdminExportPage />

      <EnhancedAdminSentByUserChart />
      < EnhancedAdminSummaryCards />
    </div>
  );
};

export default AdminReportsPage;
