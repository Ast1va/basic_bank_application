import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';
import { getAllAccounts } from '@/firebase/accountService';
import { getAuth, signOut } from 'firebase/auth';
import { getAllTransactions } from '@/firebase/transferService';
import NotificationButton from '@/components/NotificationButton';
import Link from 'next/link';
import Head from 'next/head';
import toast from 'react-hot-toast';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Account {
  id: string;
  balance: number;
  name?: string;
  disabled?: boolean;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  note?: string;
  timestamp?: { toDate: () => Date };
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  totalTransactions: number;
  todayTransactions: number;
  totalTransferVolume: number;
  todayTransferVolume: number;
}

const AdminPage = () => {
  const router = useRouter();
  const { currentUser, loading } = useUserStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    disabledUsers: 0,
    totalTransactions: 0,
    todayTransactions: 0,
    totalTransferVolume: 0,
    todayTransferVolume: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [redirecting, setRedirecting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Kullanıcı verilerini çek
      const accounts = await getAllAccounts();
      const transactions = await getAllTransactions();

      // Email mapping oluştur
      const emailMapping: Record<string, string> = {};
      accounts.forEach((acc) => {
        emailMapping[acc.id] = acc.name || acc.id;
      });
      setEmailMap(emailMapping);

      // İstatistikleri hesapla
      const activeUsers = accounts.filter(acc => !acc.disabled).length;
      const disabledUsers = accounts.filter(acc => acc.disabled).length;
      const totalTransferVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Bugünkü işlemler
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTxs = transactions.filter(tx => {
        const txDate = tx.timestamp?.toDate();
        return txDate && txDate >= today;
      });
      const todayVolume = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);

      setStats({
        totalUsers: accounts.length,
        activeUsers,
        disabledUsers,
        totalTransactions: transactions.length,
        todayTransactions: todayTxs.length,
        totalTransferVolume,
        todayTransferVolume: todayVolume,
      });

      // Son 10 işlemi göster
      setRecentTransactions(transactions.slice(0, 10));
    } catch {
      toast.error('Dashboard verileri alınamadı!');
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
      fetchDashboardData();
    }
  }, [currentUser, loading, router]);

  const handleLogout = async () => {
    setRedirecting(true);
    await signOut(getAuth());
    toast('Hesaptan çıkış yapıldı.');
    router.push('/login');
  };

  if (!currentUser?.isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Head>
        <title>Admin Paneli | Basic Bank</title>
      </Head>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <NotificationButton />
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Çıkış
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Aktif Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              <p className="text-xs text-gray-500">{stats.disabledUsers} devre dışı</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Toplam Transfer</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              <p className="text-xs text-gray-500">Bugün: {stats.todayTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xl">💸</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Transfer Hacmi</p>
              <p className="text-2xl font-bold text-gray-900">₺{stats.totalTransferVolume.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Bugün: ₺{stats.todayTransferVolume.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/users">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className="font-medium">Kullanıcı Yönetimi</span>
            </button>
          </Link>

          <Link href="/admin/notifications">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2">
              <span className="text-2xl">📢</span>
              <span className="font-medium">Bildirim Gönder</span>
            </button>
          </Link>

          <Link href="/admin/reports">
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2">
              <span className="text-2xl">📈</span>
              <span className="font-medium">Raporlar</span>
            </button>
          </Link>

          <button
            onClick={() => fetchDashboardData()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2"
          >
            <span className="text-2xl">🔄</span>
            <span className="text-sm opacity-90">Dashboard güncelle</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Son Transferler</h2>
            <Link href="/admin/transactions" className="text-blue-600 hover:text-blue-700 text-sm">
              Tümünü Gör →
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {loadingData ? (
            <p className="text-center text-gray-500">Veriler yükleniyor...</p>
          ) : recentTransactions.length === 0 ? (
            <p className="text-center text-gray-500">Henüz işlem bulunamadı.</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => {
                const fromName = emailMap[tx.from] || tx.from;
                const toName = emailMap[tx.to] || tx.to;
                const dateStr = tx.timestamp?.toDate().toLocaleString('tr-TR') || '-';

                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{fromName}</span> → <span className="font-medium">{toName}</span>
                      </p>
                      {tx.note && (
                        <p className="text-xs text-gray-600 mt-1">‘{tx.note}’</p>
                      )}
                      <p className="text-xs text-gray-500">{dateStr}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">₺{tx.amount}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {redirecting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-center">Giriş sayfasına yönlendiriliyorsunuz...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;