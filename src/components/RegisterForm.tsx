import { useState } from 'react';
import { registerUser } from '@/firebase/authService';
import { useRouter } from 'next/router';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      await registerUser(email, password);
      router.push('/'); // kayıt sonrası anasayfaya yönlendir
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Kayıt sırasında bilinmeyen bir hata oluştu.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-center">Kayıt Ol</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />

      <input
        type="password"
        placeholder="Şifre (min 6 karakter)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
      >
        Kayıt Ol
      </button>
    </form>
  );
};

export default RegisterForm;
