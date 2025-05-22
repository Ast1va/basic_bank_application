import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';
import {
  getAllAccounts,
  updateUserBalance,
  updateAccountDisabledStatus,
} from '@/firebase/accountService';
import { getAuth, signOut } from 'firebase/auth';
import { getAllTransactions } from '@/firebase/transferService';
import Head from 'next/head';

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
  timestamp?: { toDate: () => Date };
}

const AdminPage = () => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const all = await getAllAccounts();
      setAccounts(all);

      const initial: Record<string, string> = {};
      all.forEach((acc) => {
        initial[acc.id] = acc.balance.toString();
      });
      setEdited(initial);

      // UID → isim map'i oluştur
      const map: Record<string, string> = {};
      all.forEach((acc) => {
        map[acc.id] = acc.name || acc.id;
      });
      setEmailMap(map);
    } catch (error) {
      console.error('Hesaplar alınamadı:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const txs = await getAllTransactions();
      setTransactions(txs);
    } catch (error) {
      console.error('Transferler alınamadı:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (!currentUser.isAdmin) {
      router.push('/');
    } else {
      fetchAccounts();
      fetchTransactions();
    }
  }, [currentUser, router]);

  const handleLogout = async () => {
    setRedirecting(true);
    await signOut(getAuth());
    router.push('/login');
  };

  const handleUpdate = async (id: string) => {
    const parsed = parseFloat(edited[id]);
    if (isNaN(parsed)) {
      alert('Geçerli bir sayı giriniz.');
      return;
    }

    setUpdating(true);
    try {
      await updateUserBalance(id, parsed);
      await fetchAccounts();
    } catch (error) {
      console.error('Bakiye güncelleme hatası:', error);
    } finally {
      setUpdating(false);
    }
  };

  const toggleAccountStatus = async (id: string, currentStatus: boolean | undefined) => {
    try {
      await updateAccountDisabledStatus(id, !currentStatus);
      await fetchAccounts();
    } catch (error) {
      console.error('Durum değiştirme hatası:', error);
    }
  };

  if (!currentUser?.isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Head>
        <title>Admin Paneli | Basic Bank</title>
      </Head>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Paneli</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Çıkış
        </button>
      </div>

      <div className="space-y-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="border p-4 rounded space-y-2">
            <p className="text-sm text-gray-500">Kullanıcı ID: {acc.id}</p>
            <p className="text-base font-medium">Ad: {acc.name || 'Belirtilmemiş'}</p>
            <input
              type="number"
              value={edited[acc.id]}
              onChange={(e) =>
                setEdited((prev) => ({ ...prev, [acc.id]: e.target.value }))
              }
              className="border p-2 rounded w-40"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleUpdate(acc.id)}
                disabled={updating}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Bakiye Güncelle
              </button>
              <button
                onClick={() => toggleAccountStatus(acc.id, acc.disabled)}
                className={`${
                  acc.disabled ? 'bg-green-600' : 'bg-yellow-500'
                } text-white px-4 py-2 rounded`}
              >
                {acc.disabled ? 'Aktif Et' : 'Devre Dışı Bırak'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Transfer Geçmişi</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500">Hiç işlem bulunamadı.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx) => {
              const fromName = emailMap[tx.from] || tx.from;
              const toName = emailMap[tx.to] || tx.to;
              const dateStr = tx.timestamp?.toDate().toLocaleString('tr-TR') || '-';

              return (
                <li key={tx.id} className="text-sm border p-3 rounded shadow-sm bg-white">
                  <p>
                    <strong>{fromName}</strong> → <strong>{toName}</strong> kişisine{' '}
                    <span className="text-blue-600 font-semibold">{tx.amount}₺</span> gönderdi
                  </p>
                  <p className="text-xs text-gray-500">{dateStr}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {redirecting && (
        <p className="text-sm text-gray-600 text-center mt-4">
          Giriş sayfasına yönlendiriliyorsunuz...
        </p>
      )}
    </div>
  );
};

export default AdminPage;
