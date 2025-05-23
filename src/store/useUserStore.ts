import { create } from 'zustand';
import { User } from '@/types';

interface UserStore {
  currentUser: User | null;
  loading: boolean; // 👈 eklendi
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  loading: true, // başta senkronizasyon bekleniyor
  login: (user) => set({ currentUser: user, loading: false }),
  logout: () => set({ currentUser: null, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
