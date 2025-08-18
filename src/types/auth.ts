import type { User as FirebaseUser } from 'firebase/auth';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  phone?: string;
  cpf?: string;
  address?: string;
  photoURL?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  address?: string;
  role?: 'customer' | 'admin';
}

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}
