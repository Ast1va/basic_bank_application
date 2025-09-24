import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, DocumentData, Query } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface Summary {
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  activeMonths: number;
  avgTransactionAmount: number;
  topSender: { email: string; amount: number };
  dailyAverage: number;
}

interface DateRange {
  value: string;
  label: string;
  days: number;
}

const DATE_RANGES: DateRange[] = [
  { value: 'all', label: 'Tüm Zamanlar', days: 0 },
  { value: '7', label: 'Son 7 Gün', days: 7 },
  { value: '30', label: 'Son 30 Gün', days: 30 },
  { value: '90', label: 'Son 3 Ay', days: 90 },
  { value: '365', label: 'Son 1 Yıl', days: 365 },
];

const EnhancedAdminSummaryCards = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('30');
  const [previousPeriodChange, setPreviousPeriodChange] = useState<{
    transactions: number;
    volume: number;
  } | null>(null);

  const fetchGlobalSummary = async (range: string) => {
    try {
      setLoading(true);
      
      // Tarih filtresini hesapla
      let startDate: Date | null = null;
      let previousStartDate: Date | null = null;
      
      if (range !== 'all') {
        const days = parseInt(range);
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        
        // Önceki dönem için
        previousStartDate = new Date();
        previousStartDate.setDate(previousStartDate.getDate() - (days * 2));
        previousStartDate.setHours(0, 0, 0, 0);
      }

      // Ana dönem verileri
      let mainQuery: Query<DocumentData> = collection(db, 'transactions');
      if (startDate) {
        mainQuery = query(
          collection(db, 'transactions'),
          orderBy('timestamp', 'desc')
        );
      }
      
      const snapshot = await getDocs(mainQuery);
      
      // Önceki dönem verileri (karşılaştırma için)
      let previousSnapshot = null;
      if (previousStartDate && startDate) {
        const prevQuery = query(
          collection(db, 'transactions'),
          orderBy('timestamp', 'desc')
        );
        previousSnapshot = await getDocs(prevQuery);
      }

      let totalSent = 0;
      let totalReceived = 0;
      const allMonths = new Set<string>();
      const userTotals: Record<string, number> = {};
      const validTransactions: DocumentData[] = [];

      // Accounts bilgilerini al (email mapping için)
      const accountsSnap = await getDocs(collection(db, 'accounts'));
      const uidToEmail: Record<string, string> = {};
      accountsSnap.docs.forEach(doc => {
        const data = doc.data();
        uidToEmail[doc.id] = data.email || doc.id;
      });

      snapshot.forEach((doc) => {
        const data = doc.data();
        const amount = data.amount || 0;
        const timestamp = data.timestamp?.toDate?.();
        
        // Tarih filtresi kontrolü
        if (startDate && timestamp && timestamp < startDate) return;
        if (range === 'all' || !startDate || (timestamp && timestamp >= startDate)) {
          totalSent += amount;
          totalReceived += amount;
          validTransactions.push(data);

          // Kullanıcı bazlı toplam
          const fromEmail = uidToEmail[data.from] || data.from;
          userTotals[fromEmail] = (userTotals[fromEmail] || 0) + amount;

          if (timestamp instanceof Date) {
            const key = `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}`;
            allMonths.add(key);
          }
        }
      });

      // Önceki dönem karşılaştırması
      let previousTotal = 0;
      let previousCount = 0;
      
      if (previousSnapshot && startDate && previousStartDate) {
        previousSnapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate?.();
          
          if (timestamp && timestamp >= previousStartDate && timestamp < startDate) {
            previousTotal += data.amount || 0;
            previousCount++;
          }
        });
        
        const volumeChange = totalSent > 0 ? ((totalSent - previousTotal) / previousTotal * 100) : 0;
        const countChange = validTransactions.length > 0 ? 
          ((validTransactions.length - previousCount) / previousCount * 100) : 0;
          
        setPreviousPeriodChange({
          transactions: countChange,
          volume: volumeChange
        });
      } else {
        setPreviousPeriodChange(null);
      }

      // En çok gönderen kullanıcı
      const topSenderEntry = Object.entries(userTotals)
        .sort(([,a], [,b]) => b - a)[0];
      
      const topSender = topSenderEntry ? 
        { email: topSenderEntry[0], amount: topSenderEntry[1] } :
        { email: 'Yok', amount: 0 };

      // Günlük ortalama
      const days = range === 'all' ? Math.max(allMonths.size * 30, 1) : parseInt(range);
      const dailyAverage = totalSent / Math.max(days, 1);

      setSummary({
        totalSent,
        totalReceived,
        transactionCount: validTransactions.length,
        activeMonths: allMonths.size,
        avgTransactionAmount: validTransactions.length > 0 ? totalSent / validTransactions.length : 0,
        topSender,
        dailyAverage,
      });
    } catch (error) {
      console.error('Admin özet verisi alınamadı:', error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalSummary(selectedRange);
  }, [selectedRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatChangePercent = (change: number) => {
    const isPositive = change > 0;
    return (
      <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sistem Özeti</h2>
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="p-4 rounded-xl shadow bg-white animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!summary) return <p>Veri bulunamadı.</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sistem Özeti</h2>
        <select 
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          {DATE_RANGES.map(range => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl shadow bg-white text-center border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Toplam Gönderim</p>
          <p className="text-lg font-semibold text-blue-600">{formatCurrency(summary.totalSent)}</p>
          {previousPeriodChange && (
            <p className="mt-1">{formatChangePercent(previousPeriodChange.volume)}</p>
          )}
        </div>

        <div className="p-4 rounded-xl shadow bg-white text-center border-l-4 border-green-500">
          <p className="text-sm text-gray-500">İşlem Sayısı</p>
          <p className="text-lg font-semibold text-green-600">{summary.transactionCount.toLocaleString()}</p>
          {previousPeriodChange && (
            <p className="mt-1">{formatChangePercent(previousPeriodChange.transactions)}</p>
          )}
        </div>

        <div className="p-4 rounded-xl shadow bg-white text-center border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Ortalama İşlem</p>
          <p className="text-lg font-semibold text-purple-600">
            {formatCurrency(summary.avgTransactionAmount)}
          </p>
        </div>

        <div className="p-4 rounded-xl shadow bg-white text-center border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">Günlük Ortalama</p>
          <p className="text-lg font-semibold text-orange-600">
            {formatCurrency(summary.dailyAverage)}
          </p>
        </div>
      </div>

      {/* Ek bilgi kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl shadow bg-white">
          <p className="text-sm text-gray-500 mb-2">En Aktif Kullanıcı</p>
          <p className="font-medium">{summary.topSender.email}</p>
          <p className="text-sm text-blue-600">{formatCurrency(summary.topSender.amount)}</p>
        </div>

        <div className="p-4 rounded-xl shadow bg-white">
          <p className="text-sm text-gray-500 mb-2">Aktif Dönem</p>
          <p className="font-medium">{summary.activeMonths} ay</p>
          <p className="text-sm text-gray-600">Platform aktivitesi</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminSummaryCards;
