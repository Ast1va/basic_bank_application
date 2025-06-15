import { useState } from 'react';
import { registerUser } from '@/firebase/authService';
import { createUserAccountIfNotExists } from '@/firebase/accountService';
import { useRouter } from 'next/router';
import { FirebaseError } from 'firebase/app';
import toast from 'react-hot-toast';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      toast.error('Lütfen geçerli bir ad giriniz.');
      return;
    }

    if (password.length < 6) {
      toast.error('Şifreniz en az 6 karakter olmalı.');
      return;
    }

    try {
      const user = await registerUser(email, password, name);
      const uid = user.uid;

      await createUserAccountIfNotExists(uid, name);
      toast.success("Kayıt başarılı! Giriş yapabilirsiniz.");
      router.push('/login');
    } catch (err: unknown) {
      let errorMsg = 'Kayıt başarısız oldu.';
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMsg = 'Bu e-posta zaten kullanılıyor. Giriş yapmayı deneyin.';
            break;
          case 'auth/invalid-email':
            errorMsg = 'Geçerli bir e-posta adresi giriniz.';
            break;
          case 'auth/weak-password':
            errorMsg = 'Şifreniz çok zayıf. En az 6 karakter olmalı.';
            break;
          case 'auth/too-many-requests':
            errorMsg = 'Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin.';
            break;
          case 'auth/network-request-failed':
            errorMsg = 'İnternet bağlantınızda sorun olabilir.';
            break;
          default:
            errorMsg = 'Kayıt başarısız oldu.';
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      toast.error(errorMsg);
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

      {/* 👁️ Şifre inputu ve göz butonu */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Şifre (min 6 karakter)"
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

      {/* Eski hata mesajı kaldırıldı, her şey toast ile bildiriliyor */}

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
