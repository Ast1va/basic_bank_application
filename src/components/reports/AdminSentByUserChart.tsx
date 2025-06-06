import React, { useEffect, useState } from 'react';
import { getTotalSentPerUser } from '@/firebase/reportService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useUserStore } from '@/store/useUserStore';

interface DataPoint {
  email: string;
  total: number;
}

const AdminSentByUserChart = () => {
  const { currentUser } = useUserStore();
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const totals = await getTotalSentPerUser();
        setData(totals);
      } catch (err) {
        console.error('❌ Admin gönderim verisi alınamadı:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!currentUser || currentUser.email !== 'admin@gmail.com') {
    return <p className="text-red-600">Bu grafiğe yalnızca admin erişebilir.</p>;
  }

  if (loading) return <p>Yükleniyor...</p>;
  if (data.length === 0) return <p>Hiç veri bulunamadı.</p>;

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">Kullanıcı Başına Toplam Gönderim</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="email" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip formatter={(value: number) => `₺${value}`} />
          <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AdminSentByUserChart;
