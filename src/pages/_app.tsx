// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { subscribeToAuthChangesAndSyncStore } from '@/firebase/authService';
import '@/styles/globals.css'; 

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Firebase oturumunu yükleyip store'a yaz
    subscribeToAuthChangesAndSyncStore(); 
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
