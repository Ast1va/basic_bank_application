import React, { useEffect, useState } from 'react';
import { getUserTransactions } from '@/firebase/reportService';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useUserStore } from '@/store/useUserStore'; // 👈 eklendi

interface RecipientWithEmail {
  email: string;
  total: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

const TopRecipientsChart = () => {
  const { currentUser, loading: authLoading } = useUserStore(); // 👈 auth kontrolü
  const [data, setData] = useState<RecipientWithEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    const fetchAndGroup = async () => {
      try {
        const txs = await getUserTransactions();
        const totals: { [to: string]: number } = {};

        txs.forEach((tx) => {
          if (!totals[tx.to]) totals[tx.to] = 0;
          totals[tx.to] += tx.amount;
        });

        const topRecipients = Object.entries(totals)
          .map(([to, total]) => ({ to, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        const recipientIds = topRecipients.map((r) => r.to);

        if (recipientIds.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const accountsRef = collection(db, 'accounts');
        const q = query(accountsRef, where('__name__', 'in', recipientIds));
        const snapshot = await getDocs(q);

        const idToEmail: { [uid: string]: string } = {};
        snapshot.forEach((doc) => {
          idToEmail[doc.id] = doc.data().email;
        });

        const chartData: RecipientWithEmail[] = topRecipients.map((r) => ({
          email: idToEmail[r.to] || r.to,
          total: r.total,
        }));

        setData(chartData);
      } catch (err) {
        console.error('❌ Alıcı verileri alınamadı:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroup();
  }, [authLoading, currentUser]);

  if (authLoading || loading) return <p>Yükleniyor...</p>;
  if (data.length === 0) return <p>Hiç alıcı bulunamadı.</p>;

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">En Çok Para Gönderilen Alıcılar</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="email"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `₺${value}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopRecipientsChart;
