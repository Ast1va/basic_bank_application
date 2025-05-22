// src/pages/transfer.tsx
import Head from 'next/head';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import TransferForm from '@/components/TransferForm';

const TransferPage = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  return (
    <div className="p-4">
      <Head>
        <title>Para Gönder | Basic Bank</title>
      </Head>

      <TransferForm />
    </div>
  );
};

export default TransferPage;
