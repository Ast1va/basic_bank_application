import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';
import { getAuth, signOut } from 'firebase/auth';
import { getUserAccount } from '@/firebase/accountService';
import TransferHistory from '@/components/TransferHistory';
import NotificationButton from '@/components/NotificationButton';
import Head from 'next/head';

export default function HomePage() {
  const router = useRouter();
  const { currentUser, loading } = useUserStore();
  const [balance, setBalance] = useState<number>(0);
  const [name, setName] = useState<string>('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const fetchUserAccount = async () => {
      if (!currentUser) return;
      const account = await getUserAccount(currentUser.id);
      setBalance(account.balance);
      setName(account.name);
    };

    if (currentUser) fetchUserAccount();
  }, [currentUser, router]);

  const handleLogout = async () => {
    setRedirecting(true);
    await signOut(getAuth());
    router.push('/login');
  };

  const handleTransferRedirect = () => {
    router.push('/transfer');
  };

  const handleReportsRedirect = () => {
    router.push('/reports');
  };

  if (!loading && !currentUser) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <Head>
        <title>Ana Sayfa | Basic Bank</title>
      </Head>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Hoş geldin, {name || currentUser?.username}!
        </h1>
        <div className="flex items-center gap-2">
          <NotificationButton />
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="border p-4 rounded shadow bg-white mb-4">
        <p className="text-lg font-semibold">Bakiye: ₺{balance}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleTransferRedirect}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Para Gönder
          </button>

          {/* 📊 Raporlar butonu */}
          <button
            onClick={handleReportsRedirect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Raporları Görüntüle
          </button>
        </div>
      </div>

      <TransferHistory />

      {redirecting && (
        <p className="text-sm text-gray-600 text-center mt-4">
          Giriş sayfasına yönlendiriliyorsunuz...
        </p>
      )}
    </div>
  );
}
