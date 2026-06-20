export interface Currency {
  id: number;
  code: string;
  name: string;
  rate: number;
  baseCode: string;
}

export interface CartItem {
  currencyId: number;
  code: string;
  amount: number;
  rate: number;
  total: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  loading: boolean;
  error: string | null;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';

export interface AuthState {
  user: {
    id: number;
    email: string;
    role: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  username: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  id: number;
  email: string;
  roles: string[];
} 