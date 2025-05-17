import { create } from 'zustand';
import { User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface UserStore {
  currentUser: User | null;
  users: User[]; // kullanıcılara göre id sabitleme
  login: (user: Omit<User, 'id'>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: null,
  users: [],
  login: (userWithoutId) => {
    const existingUser = get().users.find(
      (u) => u.username === userWithoutId.username
    );

    const id = existingUser ? existingUser.id : uuidv4();
    const newUser: User = {
      ...userWithoutId,
      id,
    };

    if (!existingUser) {
      set((state) => ({ users: [...state.users, newUser] }));
    }

    set({ currentUser: newUser });
  },
  logout: () => set({ currentUser: null }),
}));
