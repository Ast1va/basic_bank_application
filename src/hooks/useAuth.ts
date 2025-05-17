import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { app } from '@/firebase/config';

const auth = getAuth(app);

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup
  }, []);

  return { user, loading };
};
