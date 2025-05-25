import React, { useEffect, useState } from 'react';
import { getTransactionSummary } from '@/firebase/reportService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useUserStore } from '@/store/useUserStore'; // 👈 auth store eklendi

const InOutComparisonChart = () => {
  const { currentUser, loading: authLoading } = useUserStore(); // 👈 kontrol
  const [data, setData] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    const fetchSummary = async () => {
      try {
        const summary = await getTransactionSummary();
        if (!summary) return;

        setData([
          { name: 'Gelen', amount: summary.totalReceived },
          { name: 'Giden', amount: summary.totalSent },
        ]);
      } catch (error) {
        console.error('❌ Gelen/giden verileri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [authLoading, currentUser]);

  if (authLoading || loading) return <p>Yükleniyor...</p>;
  if (data.length === 0) return <p>Veri bulunamadı.</p>;

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">Gelen vs Giden Para</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number | string) => `₺${value}`} />
          <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InOutComparisonChart;