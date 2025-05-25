import React, { useEffect, useState } from 'react';
import { getUserTransactions } from '@/firebase/reportService';
import { groupTransactionsByMonth } from '@/utils/groupTransactionsByMonth';
import { useUserStore } from '@/store/useUserStore'; // 👈 eklendi

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyTotal {
  month: string;
  total: number;
}

const MonthlySentChart = () => {
  const { currentUser, loading: authLoading } = useUserStore(); // 👈 auth kontrolü
  const [monthlyData, setMonthlyData] = useState<MonthlyTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser || typeof window === 'undefined') return;

    const fetchTransactions = async () => {
      try {
        const data = await getUserTransactions();
        const grouped = groupTransactionsByMonth(data);
        setMonthlyData(grouped);
      } catch (error) {
        console.error('❌ İşlem verileri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [authLoading, currentUser]);

  if (authLoading || loading) return <p>Yükleniyor...</p>;

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Aylık Gönderilen Para</h2>
      </div>

      {monthlyData.length === 0 ? (
        <p className="text-gray-500">Hiç işlem bulunamadı.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number | string) => `₺${value}`} />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MonthlySentChart;
