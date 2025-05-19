// src/pages/login.tsx
import LoginForm from '@/components/LoginForm';
import Head from 'next/head'; // ✅ Head eklendi

const LoginPage = () => {
  return (
    <div className="max-w-sm mx-auto mt-10">
      <Head>
        <title>Giriş Yap | Basic Bank</title>
      </Head>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
