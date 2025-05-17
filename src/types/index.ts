export interface Account {
  id: string;
  name: string;
  balance: number;
  userId: string;
}

export interface User {
  id: string;            // Firebase UID
  username: string;
  email: string;
  isAdmin?: boolean;
}
