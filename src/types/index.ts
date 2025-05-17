export interface Account {
  id: string;
  name: string;
  balance: number;
  userId: string; // yeni eklendi
}

export interface User {
  id: string;
  username: string;
  isAdmin?: boolean;
}

