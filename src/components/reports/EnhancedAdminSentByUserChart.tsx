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
  PieChart,
  Pie,
  Cell,
  TooltipProps,
} from 'recharts';
import { useUserStore } from '@/store/useUserStore';

interface DataPoint {
  email: string;
  total: number;
  displayEmail: string;
  percentage: number;
}

type ChartView = 'bar' | 'pie';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const EnhancedAdminSentByUserChart = () => {
  const { currentUser } = useUserStore();
  const [data, setData] = useState<DataPoint[]>([]);
  const [filteredData, setFilteredData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<ChartView>('bar');
  const [showTop, setShowTop] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const totals = await getTotalSentPerUser();
        const totalAmount = totals.reduce((sum, item) => sum + item.total, 0);
        
        const processedData: DataPoint[] = totals.map((item) => ({
          ...item,
          displayEmail: item.email.length > 20 ? item.email.substring(0, 17) + '...' : item.email,
          percentage: totalAmount > 0 ? (item.total / totalAmount) * 100 : 0,
        }));

        setData(processedData);
      } catch (err) {
        console.error('Admin gönderim verisi alınamadı:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtreleme
  useEffect(() => {
    let filtered = [...data];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Minimum tutar filtresi
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(item => item.total >= min);
      }
    }

    // Top N kullanıcı
    filtered = filtered
      .sort((a, b) => b.total - a.total)
      .slice(0, showTop);

    setFilteredData(filtered);
  }, [data, searchTerm, minAmount, showTop]);

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DataPoint;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{data.email}</p>
          <p className="text-blue-600">
            <span className="font-medium">Toplam:</span> ₺{data.total.toLocaleString()}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Oran:</span> %{data.percentage.toFixed(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: DataPoint) => {
    console.log('Clicked user:', data);
    // Modal açma veya detay sayfasına yönlendirme
  };

  if (!currentUser || currentUser.email !== 'admin@gmail.com') {
    return <p className="text-red-600">Bu grafiğe yalnızca admin erişebilir.</p>;
  }

  if (loading) return (
    <div className="bg-white p-4 rounded-xl shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );

  if (data.length === 0) return (
    <div className="bg-white p-4 rounded-xl shadow text-center py-8">
      <p className="text-gray-500">Hiç veri bulunamadı.</p>
    </div>
  );

  const totalAmount = filteredData.reduce((sum, item) => sum + item.total, 0);
  const avgAmount = filteredData.length > 0 ? totalAmount / filteredData.length : 0;

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Kullanıcı Başına Toplam Gönderim</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartView('bar')}
            className={`px-3 py-1 text-sm rounded ${
              chartView === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            📊 Sütun
          </button>
          <button
            onClick={() => setChartView('pie')}
            className={`px-3 py-1 text-sm rounded ${
              chartView === 'pie' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            🥧 Pasta
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Kullanıcı Ara</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Email ile ara..."
            className="w-full px-3 py-1 border rounded text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-1">Minimum Tutar</label>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="Min ₺"
            className="w-full px-3 py-1 border rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Gösterim Sayısı</label>
          <select
            value={showTop}
            onChange={(e) => setShowTop(Number(e.target.value))}
            className="w-full px-3 py-1 border rounded text-sm"
          >
            <option value={5}>İlk 5</option>
            <option value={10}>İlk 10</option>
            <option value={15}>İlk 15</option>
            <option value={20}>İlk 20</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-blue-50 rounded">
        <div className="text-center">
          <p className="text-sm text-gray-600">Toplam</p>
          <p className="font-semibold text-blue-600">₺{totalAmount.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Kullanıcı</p>
          <p className="font-semibold text-green-600">{filteredData.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Ortalama</p>
          <p className="font-semibold text-purple-600">₺{Math.round(avgAmount).toLocaleString()}</p>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Filtrelere uygun kullanıcı bulunamadı.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          {chartView === 'bar' ? (
            <BarChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayEmail" 
                tick={{ fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                onClick={handleBarClick}
                cursor="pointer"
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ email, percentage }) => `${email.split('@')[0]} (${percentage.toFixed(1)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="total"
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      )}

      {/* Top Users List */}
      <div className="mt-4 border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Detaylı Liste</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {filteredData.map((user, index) => (
            <div key={user.email} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
              <span className="font-medium">
                #{index + 1} {user.email}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-blue-600 font-semibold">₺{user.total.toLocaleString()}</span>
                <span className="text-gray-500">%{user.percentage.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminSentByUserChart;
