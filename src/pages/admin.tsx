import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';
import { getAllAccounts, updateUserBalance } from '@/firebase/accountService';
import { getAuth, signOut } from 'firebase/auth';

const AdminPage = () => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);
  const [accounts, setAccounts] = useState<{ id: string; balance: number }[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState(false);

  const fetchAccounts = async () => {
    try {
      const all = await getAllAccounts();
      setAccounts(all);
      const initial: Record<string, string> = {};
      all.forEach((acc) => {
        initial[acc.id] = acc.balance.toString();
      });
      setEdited(initial);
    } catch (error) {
      console.error('Hesaplar alınamadı:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (!currentUser.isAdmin) {
      router.push('/');
    } else {
      fetchAccounts();
    }
  }, [currentUser]);

  const handleLogout = async () => {
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
      console.error('Güncelleme hatası:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (!currentUser?.isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
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
          <div
            key={acc.id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-gray-500">Kullanıcı ID: {acc.id}</p>
              <input
                type="number"
                value={edited[acc.id]}
                onChange={(e) =>
                  setEdited((prev) => ({ ...prev, [acc.id]: e.target.value }))
                }
                className="border p-2 rounded w-40 mt-1"
              />
            </div>
            <button
              onClick={() => handleUpdate(acc.id)}
              disabled={updating}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Güncelle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
