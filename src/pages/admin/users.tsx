import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';
import {
  getAllAccounts,
  updateUserBalance,
  updateAccountDisabledStatus,
  updateFirestoreAccountInfo,
} from '@/firebase/accountService';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/config';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  balance: number;
  name?: string;
  email?: string;
  disabled?: boolean;
  birthDate?: string;
  occupation?: string;
  avgIncome?: number;
}

const AdminUsersPage = () => {
  const router = useRouter();
  const { currentUser, loading } = useUserStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState<Account | null>(null);
  const [balanceEdits, setBalanceEdits] = useState<Record<string, string>>({});
  const [profileEdits, setProfileEdits] = useState<{
    birthDate: string;
    occupation: string;
    avgIncome: number;
  }>({ birthDate: '', occupation: '', avgIncome: 0 });
  const [loading_data, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchAccounts = async () => {
    try {
      const all = await getAllAccounts();
      setAccounts(all);
      setFilteredAccounts(all);

      const initial: Record<string, string> = {};
      all.forEach((acc) => {
        initial[acc.id] = acc.balance.toString();
      });
      setBalanceEdits(initial);
    } catch {
      toast.error('Hesaplar alınamadı!');
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
      fetchAccounts();
    }
  }, [currentUser, loading, router]);

  // Arama ve filtreleme
  useEffect(() => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(acc =>
        acc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(acc => {
        if (statusFilter === 'active') return !acc.disabled;
        if (statusFilter === 'disabled') return acc.disabled;
        return true;
      });
    }

    setFilteredAccounts(filtered);
  }, [searchTerm, statusFilter, accounts]);

  const handleBalanceUpdate = async (id: string) => {
    const parsed = parseFloat(balanceEdits[id]);
    if (isNaN(parsed)) {
      toast.error('Geçerli bir sayı giriniz.');
      return;
    }

    setUpdating(true);
    try {
      await updateUserBalance(id, parsed);
      await fetchAccounts();
      toast.success('Bakiye güncellendi!');
    } catch {
      toast.error('Bakiye güncelleme hatası!');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean | undefined) => {
    try {
      await updateAccountDisabledStatus(id, !currentStatus);
      await fetchAccounts();
      if (currentStatus) {
        toast.success('Hesap tekrar aktif edildi!');
      } else {
        toast('Hesap devre dışı bırakıldı.');
      }
    } catch {
      toast.error('Durum değiştirme hatası!');
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!email) {
      toast.error('Email adresi bulunamadı!');
      return;
    }

    const toastId = toast.loading('Şifre sıfırlama maili gönderiliyor...');
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`${email} adresine şifre sıfırlama maili gönderildi!`, { id: toastId });
    } catch {
      toast.error('Şifre sıfırlama maili gönderilemedi!', { id: toastId });
    }
  };

  const handleProfileEdit = (account: Account) => {
    setEditingUser(account);
    setProfileEdits({
      birthDate: account.birthDate || '',
      occupation: account.occupation || '',
      avgIncome: account.avgIncome || 0,
    });
  };

  const handleProfileUpdate = async () => {
    if (!editingUser) return;

    setUpdating(true);
    const toastId = toast.loading('Profil güncelleniyor...');

    try {
      await updateFirestoreAccountInfo(editingUser.id, profileEdits);
      await fetchAccounts();
      setEditingUser(null);
      toast.success('Profil bilgileri güncellendi!', { id: toastId });
    } catch {
      toast.error('Profil güncelleme hatası!', { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  if (!currentUser?.isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Head>
        <title>Kullanıcı Yönetimi | Admin</title>
      </Head>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
        <Link href="/admin">
          <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
            Admin Paneline Dön
          </button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Arama ve Filtreler</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Email veya ad ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-2 rounded flex-1"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">Tüm Hesaplar</option>
            <option value="active">Aktif Hesaplar</option>
            <option value="disabled">Devre Dışı Hesaplar</option>
          </select>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Toplam: {filteredAccounts.length} kullanıcı
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Kullanıcı Listesi</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bakiye</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Meslek</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aylık Gelir</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading_data ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Kullanıcı verileri yükleniyor...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{acc.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{acc.name || 'Belirtilmemiş'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={balanceEdits[acc.id]}
                          onChange={(e) =>
                            setBalanceEdits((prev) => ({ ...prev, [acc.id]: e.target.value }))
                          }
                          className="border px-2 py-1 rounded w-24 text-sm"
                        />
                        <button
                          onClick={() => handleBalanceUpdate(acc.id)}
                          disabled={updating}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Güncelle
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{acc.occupation || '-'}</td>
                    <td className="px-4 py-3 text-sm">{acc.avgIncome ? `₺${acc.avgIncome}` : '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        acc.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {acc.disabled ? 'Devre Dışı' : 'Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleStatusToggle(acc.id, acc.disabled)}
                          className={`px-2 py-1 rounded text-xs ${
                            acc.disabled ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white'
                          }`}
                        >
                          {acc.disabled ? 'Aktif Et' : 'Devre Dışı'}
                        </button>
                        <button
                          onClick={() => handleProfileEdit(acc)}
                          className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                        >
                          Profil Düzenle
                        </button>
                        <button
                          onClick={() => handlePasswordReset(acc.email || '')}
                          className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
                        >
                          Şifre Sıfırla
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Profil Düzenle - {editingUser.name || editingUser.email}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doğum Tarihi
                </label>
                <input
                  type="date"
                  value={profileEdits.birthDate}
                  onChange={(e) =>
                    setProfileEdits((prev) => ({ ...prev, birthDate: e.target.value }))
                  }
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meslek
                </label>
                <input
                  type="text"
                  value={profileEdits.occupation}
                  onChange={(e) =>
                    setProfileEdits((prev) => ({ ...prev, occupation: e.target.value }))
                  }
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Meslek giriniz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aylık Ortalama Gelir (₺)
                </label>
                <input
                  type="number"
                  value={profileEdits.avgIncome}
                  onChange={(e) =>
                    setProfileEdits((prev) => ({ ...prev, avgIncome: Number(e.target.value) }))
                  }
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Gelir giriniz"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                disabled={updating}
              >
                İptal
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded"
              >
                {updating ? 'Güncelleniyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;