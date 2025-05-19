import RegisterForm from '@/components/RegisterForm';
import Head from 'next/head'; // ✅ Head eklendi

export default function RegisterPage() {
  return (
    <div className="p-4">
      <Head>
        <title>Kayıt Ol | Basic Bank</title>
      </Head>
      <RegisterForm />
    </div>
  );
}
