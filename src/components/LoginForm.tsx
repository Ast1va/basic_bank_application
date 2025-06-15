import { useState } from 'react';
import { loginUser } from '@/firebase/authService';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useUserStore } from '@/store/useUserStore';
import { FirebaseError } from 'firebase/app';
import PasswordResetForm from '@/components/forms/PasswordResetForm';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const router = useRouter();
  const login = useUserStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const toastId = toast.loading("Giriş yapılıyor...");

    try {
      const userCredential = await loginUser(email, password);
      const { uid, email: userEmail } = userCredential.user;

      // Hesap bilgilerini kontrol et (disabled kontrolü)
      const accountRef = doc(db, 'accounts', uid);
      const accountSnap = await getDoc(accountRef);

      if (accountSnap.exists() && accountSnap.data().disabled === true) {
        toast.error('Bu hesap devre dışı bırakılmış. Lütfen yöneticinizle iletişime geçin.', { id: toastId });
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

      if (isAdmin) {
        toast.success("Admin girişi başarılı!", { id: toastId });
      } else {
        toast.success("Başarıyla giriş yaptınız!", { id: toastId });
      }

      console.log('✅ Giriş sonrası userStore güncelleniyor:', {
        uid,
        email: userEmail,
        isAdmin,
      });

      router.push(isAdmin ? '/admin' : '/');
    } catch (err: unknown) {
      let errorMsg = 'Giriş başarısız oldu.';
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            errorMsg = 'E-posta yanlış.';
            break;
          case 'auth/wrong-password':
            errorMsg = 'Şifreniz yanlış.';
            break;
          case 'auth/invalid-email':
            errorMsg = 'Geçerli bir e-posta adresi giriniz.';
            break;
          default:
            errorMsg = 'Giriş başarısız oldu.';
        }
      }
      toast.error(errorMsg, { id: toastId });
    }
  };

  return (
    <>
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

        {/* Şifre inputu ve göz butonu */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full rounded pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            tabIndex={-1}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

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

        <button
          type="button"
          onClick={() => setShowResetForm(true)}
          className="text-blue-600 underline w-full mt-2"
        >
          Şifremi unuttum
        </button>
      </form>

      {showResetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <PasswordResetForm onClose={() => setShowResetForm(false)} />
        </div>
      )}
    </>
  );
};

export default LoginForm;
