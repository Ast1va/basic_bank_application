import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';
import { getAllTransactions } from '@/firebase/transferService';
import { getAllAccounts } from '@/firebase/accountService';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver'; // kullanılmadığı için kaldırıldı

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  note?: string;
  timestamp?: { toDate: () => Date };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Account {
  id: string;
  balance: number;
  name?: string;
  disabled?: boolean;
}

interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  todayTransactions: number;
  todayVolume: number;
  avgTransactionAmount: number;
}

const AdminTransactionsPage = () => {
  const router = useRouter();
  const { currentUser, loading } = useUserStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalVolume: 0,
    todayTransactions: 0,
    todayVolume: 0,
    avgTransactionAmount: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const itemsPerPage = 20;

  const fetchData = async () => {
    try {
      // Transfer verilerini çek
      const txs = await getAllTransactions();
      setTransactions(txs);

      // Email mapping için accounts'ları çek
      const accounts = await getAllAccounts();
      const mapping: Record<string, string> = {};
      accounts.forEach((acc) => {
        mapping[acc.id] = acc.name || acc.id; // email kaldırıldı
      });
      setEmailMap(mapping);

      // İstatistikleri hesapla
      const totalVolume = txs.reduce((sum, tx) => sum + tx.amount, 0);
      const avgAmount = txs.length > 0 ? totalVolume / txs.length : 0;

      // Bugünkü işlemler
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTxs = txs.filter(tx => {
        const txDate = tx.timestamp?.toDate();
        return txDate && txDate >= today;
      });
      const todayVolume = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);

      setStats({
        totalTransactions: txs.length,
        totalVolume,
        todayTransactions: todayTxs.length,
        todayVolume,
        avgTransactionAmount: avgAmount,
      });

    } catch {
      toast.error('Transfer verileri alınamadı!');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push('/login');
    } else if (!currentUser.isAdmin) {
      router.push('/');
    } else {
      fetchData();
    }
  }, [currentUser, loading, router]);

  // Filtreleme
  useEffect(() => {
    let filtered = transactions;

    // Arama filtresi (gönderen/alıcı)
    if (searchTerm) {
      filtered = filtered.filter(tx => {
        const fromEmail = emailMap[tx.from] || tx.from;
        const toEmail = emailMap[tx.to] || tx.to;
        return (
          fromEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          toEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.note?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Tarih filtresi
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = filtered.filter(tx => {
        const txDate = tx.timestamp?.toDate();
        return txDate && txDate >= filterDate && txDate < nextDay;
      });
    }

    // Tutar filtresi
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(tx => tx.amount >= min);
      }
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(tx => tx.amount <= max);
      }
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, dateFilter, minAmount, maxAmount, transactions, emailMap]);

  // Sayfalama
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Export fonksiyonu
  const handleExport = async () => {
    const toastId = toast.loading('Excel hazırlanıyor...');
    try {
      const exportData = filteredTransactions.map(tx => ({
        'Transfer ID': tx.id,
        'Gönderen': emailMap[tx.from] || tx.from,
        'Alıcı': emailMap[tx.to] || tx.to,
        'Tutar (₺)': tx.amount,
        'Açıklama': tx.note || '',
        'Tarih': tx.timestamp?.toDate().toLocaleString('tr-TR') || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transferler');
      XLSX.writeFile(wb, `admin-transferler-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Excel dosyası indirildi!', { id: toastId });
    } catch {
      toast.error('Export işlemi başarısız!', { id: toastId });
    }
  };

  if (!currentUser?.isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Head>
        <title>Transfer Yönetimi | Admin</title>
      </Head>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transfer Yönetimi</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={loadingData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Excel İndir
          </button>
          <Link href="/admin">
            <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
              Admin Paneline Dön
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Toplam Transfer</p>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Toplam Hacim</p>
          <p className="text-2xl font-bold">₺{stats.totalVolume.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Bugünkü Transfer</p>
          <p className="text-2xl font-bold">{stats.todayTransactions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Bugünkü Hacim</p>
          <p className="text-2xl font-bold">₺{stats.todayVolume.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Ortalama Tutar</p>
          <p className="text-2xl font-bold">₺{Math.round(stats.avgTransactionAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Filtreler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Email, kullanıcı adı veya açıklama ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <input
            type="number"
            placeholder="Min tutar"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <input
            type="number"
            placeholder="Max tutar"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
              setMinAmount('');
              setMaxAmount('');
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Filtreleri Temizle
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {filteredTransactions.length} transfer gösteriliyor
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tarih</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Gönderen</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Alıcı</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tutar</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Açıklama</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingData ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Veriler yükleniyor...
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Transfer bulunamadı.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const fromName = emailMap[tx.from] || tx.from;
                  const toName = emailMap[tx.to] || tx.to;
                  const dateStr = tx.timestamp?.toDate().toLocaleString('tr-TR') || '-';

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{dateStr}</td>
                      <td className="px-4 py-3 text-sm font-medium">{fromName}</td>
                      <td className="px-4 py-3 text-sm font-medium">{toName}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        ₺{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tx.note ? (
                          <span className="italic">&quot;{tx.note}&quot;</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {tx.id.slice(0, 8)}...
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Sayfa {currentPage} / {totalPages} ({filteredTransactions.length} toplam kayıt)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactionsPage;
