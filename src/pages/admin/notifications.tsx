import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';
import { sendNotificationToEmail } from '@/firebase/notificationService'; // ✅ yeni fonksiyon
import Head from 'next/head';
import Link from 'next/link';

const AdminNotificationsPage = () => {
  const router = useRouter();
  const { currentUser, loading } = useUserStore();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push('/login');
    } else if (!currentUser.isAdmin) {
      router.push('/');
    }
  }, [currentUser, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendNotificationToEmail(message.trim(), email || undefined);
      setMessage('');
      setEmail('');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (!loading && !currentUser?.isAdmin) return null;

  return (
    <div className="max-w-xl mx-auto p-6">
      <Head>
        <title>Bildirim Gönder | Admin</title>
      </Head>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bildirim Gönder</h1>
        <Link href="/admin">
          <button className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded">
            Admin Paneline Dön
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Bildirim mesajı"
          className="w-full p-2 border rounded"
          rows={4}
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Kullanıcı e-posta adresi (isteğe bağlı)"
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Gönder
        </button>

        {status === 'success' && (
          <p className="text-sm text-green-600 mt-2">Bildirim gönderildi ✅</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-600 mt-2">Bir hata oluştu ❌</p>
        )}
      </form>
    </div>
  );
};

export default AdminNotificationsPage;
