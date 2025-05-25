// src/components/TransferForm.tsx
import { useState } from 'react';
import { sendMoney } from '@/firebase/transferService';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'next/router';

const TransferForm = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Kullanıcı bilgisi alınamadı.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const parsedAmount = parseFloat(amount);

    if (!trimmedEmail || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Geçerli bir e-posta ve tutar giriniz.');
      return;
    }

    if (trimmedEmail === currentUser.email) {
      alert('Kendinize para gönderemezsiniz.');
      return;
    }

    setLoading(true);
    try {
      await sendMoney(currentUser.id, trimmedEmail, parsedAmount, note);
      alert('Transfer başarılı!');
      setEmail('');
      setAmount('');
      setNote('');
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

      <input
        type="text"
        placeholder="Açıklama (isteğe bağlı)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="border p-2 rounded w-full"
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
