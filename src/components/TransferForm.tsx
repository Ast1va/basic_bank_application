import { useState } from 'react';
import { sendMoney } from '@/firebase/transferService';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

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
      toast.error('Kullanıcı bilgisi alınamadı.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const parsedAmount = parseFloat(amount);

    if (!trimmedEmail || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Geçerli bir e-posta ve tutar giriniz.');
      return;
    }

    if (trimmedEmail === currentUser.email) {
      toast.error('Kendinize para gönderemezsiniz.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Transfer gönderiliyor...');
    try {
      await sendMoney(currentUser.id, trimmedEmail, parsedAmount, note);
      toast.success('Transfer başarılı!', { id: toastId });
      setEmail('');
      setAmount('');
      setNote('');
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Hata: ${err.message}`, { id: toastId });
      } else {
        toast.error('Transfer sırasında bilinmeyen bir hata oluştu.', { id: toastId });
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
