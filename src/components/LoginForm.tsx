import { useState } from 'react';
import { loginUser } from '@/firebase/authService';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useUserStore } from '@/store/useUserStore';
import { FirebaseError } from 'firebase/app';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useUserStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await loginUser(email, password);
      const { uid, email: userEmail } = userCredential.user;

      // Hesap bilgilerini kontrol et (disabled kontrolü)
      const accountRef = doc(db, 'accounts', uid);
      const accountSnap = await getDoc(accountRef);

      if (accountSnap.exists() && accountSnap.data().disabled === true) {
        setError('Bu hesap devre dışı bırakılmış. Lütfen yöneticinizle iletişime geçin.');
        return;
      }

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const isAdmin = userSnap.exists() && userSnap.data().isAdmin === true;

      login({
        id: uid,
        email: userEmail || '',
        isAdmin,
        username: userEmail || '',
      });

      console.log('✅ Giriş sonrası userStore güncelleniyor:', {
        uid,
        email: userEmail,
        isAdmin,
      });

      router.push(isAdmin ? '/admin' : '/');
    } catch (err: unknown) {
    

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.');
            break;
          case 'auth/wrong-password':
            setError('Şifreniz yanlış.');
            break;
          case 'auth/invalid-email':
            setError('Geçerli bir e-posta adresi giriniz.');
            break;
          default:
            setError('Giriş sırasında bir hata oluştu.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Bilinmeyen bir hata oluştu.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-center">Giriş Yap</h2>

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
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        Giriş Yap
      </button>

      <button
        type="button"
        onClick={() => router.push('/register')}
        className="text-blue-600 underline w-full mt-2"
      >
        Hesabınız yok mu? Kayıt olun
      </button>
    </form>
  );
};

export default LoginForm;
