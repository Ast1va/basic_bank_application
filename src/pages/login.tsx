import LoginForm from '@/components/LoginForm';
import Head from 'next/head';

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
