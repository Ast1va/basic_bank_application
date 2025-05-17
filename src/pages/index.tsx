import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getAuth, signOut } from 'firebase/auth';
import {
  createUserAccountIfNotExists,
  getUserAccount,
  updateUserBalance,
} from '@/firebase/accountService';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState<number>(0);
  const [newBalance, setNewBalance] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchUserAccount = async () => {
    if (!user) return;
    await createUserAccountIfNotExists(user.uid);
    const account = await getUserAccount(user.uid);
    setBalance(account.balance);
    setNewBalance(account.balance.toString());
  };

  useEffect(() => {
    if (user) fetchUserAccount();
  }, [user]);

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const parsed = parseFloat(newBalance);
      if (isNaN(parsed)) {
        alert('Geçerli bir sayı giriniz.');
        return;
      }

      await updateUserBalance(user!.uid, parsed);
      await fetchUserAccount();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p>Yükleniyor...</p>;
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Hoş geldin, {user.email}!</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Çıkış
        </button>
      </div>

      <div className="border p-4 rounded shadow">
        <p className="text-lg font-semibold">Bakiye: ₺{balance}</p>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Güncelle
          </button>
        </div>
      </div>
    </div>
  );
}
