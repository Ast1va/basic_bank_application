import { useState } from 'react';
import { registerUser } from '@/firebase/authService';
import { createUserAccountIfNotExists } from '@/firebase/accountService';
import { useRouter } from 'next/router';
import { FirebaseError } from 'firebase/app'; // 🔹 Firebase hataları için

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // ⚠️ Geçersiz ad kontrolü
    if (name.trim().length < 2) {
      setError('Lütfen geçerli bir ad giriniz.');
      return;
    }

    // ⚠️ Şifre uzunluğu kontrolü
    if (password.length < 6) {
      setError('Şifreniz en az 6 karakter olmalı.');
      return;
    }

    try {
      const user = await registerUser(email, password, name);
      const uid = user.uid;

      await createUserAccountIfNotExists(uid, name);
      router.push('/');
    } catch (err: unknown) {
      // ⚠️ Firebase hata mesajlarını Türkçeleştir
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setError('Bu e-posta zaten kullanılıyor.');
            break;
          case 'auth/invalid-email':
            setError('Geçerli bir e-posta adresi giriniz.');
            break;
          case 'auth/weak-password':
            setError('Şifreniz çok zayıf. En az 6 karakter olmalı.');
            break;
          default:
            setError('Kayıt sırasında bir hata oluştu.');
        }
      } else if (err instanceof Error) {
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
        type="text"
        placeholder="Adınız"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />

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

      <p className="text-sm text-center">
        Zaten hesabın var mı?{' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-blue-600 underline"
        >
          Giriş yap
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;
