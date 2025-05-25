import Head from 'next/head';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import TransferForm from '@/components/TransferForm';

const TransferPage = () => {
  const { currentUser, loading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push('/login');
    }
  }, [loading, currentUser, router]);

  if (!loading && !currentUser) return null;

  return (
    <div className="p-4">
      <Head>
        <title>Para Gönder | Basic Bank</title>
      </Head>

      {/* Başlık ve geri butonu */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Para Gönder</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition"
        >
          Ana Sayfaya Dön
        </button>
      </div>

      <TransferForm />
    </div>
  );
};

export default TransferPage;