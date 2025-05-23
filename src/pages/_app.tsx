// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { subscribeToAuthChangesAndSyncStore } from '@/firebase/authService'; // ✅ doğru fonksiyon
import '@/styles/globals.css'; // varsa kendi stil dosyan

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Firebase oturumunu yükleyip store'a yaz
    subscribeToAuthChangesAndSyncStore(); // ✅ artık argümansız
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
