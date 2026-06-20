export interface User {
  id: number;
  email: string;
  role: string;
}

export interface ServerUser {
  id: number;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  id: number;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  username?: string;
  roles: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  currentPrice: number;
  description?: string;
  imageUrl?: string;
}

export interface CartItem {
  currencyId: string;
  code: string;
  amount: number;
  rate: number;
  total: number;
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
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

export interface Order {
  id: number;
  userId: number;
  userEmail: string;
  currencyId: number;
  currencyCode: string;
  amount: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'; 