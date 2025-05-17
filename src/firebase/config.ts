import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCihtv84dDoFx6RhBnVtah-LDrz7CtsR2M",
  authDomain: "basic-bank-app-46cda.firebaseapp.com",
  projectId: "basic-bank-app-46cda",
  storageBucket: "basic-bank-app-46cda.appspot.com", // 🔧 düzeltme burada: `.app` değil `.appspot.com`
  messagingSenderId: "628844296826",
  appId: "1:628844296826:web:b92ae63a2b73c1467bd9c3",
  measurementId: "G-MGD424D3LS"
};

// Firebase uygulamasını başlat
export const app = initializeApp(firebaseConfig);

// Firestore servisi
export const db = getFirestore(app);
