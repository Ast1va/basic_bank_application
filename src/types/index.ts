export interface Account {
  id: string;
  name: string;
  balance: number;
  userId: string; // yeni eklendi
}

export interface User {
  id: string;            // Firebase UID
  username: string;
  email: string;         // ✨ eklendi
  isAdmin?: boolean;
}


