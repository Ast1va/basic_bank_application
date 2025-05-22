// src/components/TransferForm.tsx
import { useState } from 'react';
import { sendMoney } from '@/firebase/transferService';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';

const TransferForm = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Kullanıcı bilgisi alınamadı.');
      return;
    }

    const auth = getAuth();
    const authUid = auth.currentUser?.uid;

    if (!authUid) {
      alert('Kullanıcı kimliği alınamadı.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const parsedAmount = parseFloat(amount);

    if (!trimmedEmail || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Geçerli bir e-posta ve tutar giriniz.');
      return;
    }

    if (trimmedEmail === auth.currentUser.email) {
      alert('Kendinize para gönderemezsiniz.');
      return;
    }

    setLoading(true);
    try {
      await sendMoney(authUid, trimmedEmail, parsedAmount);
      alert('Transfer başarılı!');
      setEmail('');
      setAmount('');
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Hata: ${err.message}`);
      } else {
        alert('Transfer sırasında bilinmeyen bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold text-center">Para Gönder</h2>

      <input
        type="email"
        placeholder="Alıcı e-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full"
        required
      />

      <input
        type="number"
        placeholder="Tutar (₺)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 rounded w-full"
        min="0.01"
        step="0.01"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
      >
        {loading ? 'Gönderiliyor...' : 'Gönder'}
      </button>
    </form>
  );
};

export default TransferForm;
