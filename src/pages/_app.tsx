import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { subscribeToAuthChangesAndSyncStore } from '@/firebase/authService';
import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast'; // 👈 Ekledik

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Firebase oturumunu yükleyip store'a yaz
    subscribeToAuthChangesAndSyncStore();
  }, []);

  return (
    <>
      <Toaster position="top-right" /> {/* 👈 Eklendi */}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
