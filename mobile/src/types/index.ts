export interface User {
  id: number;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  id: number;
  email: string;
  roles: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  /** True once the initial token check (checkAuth) has settled. Guards against redirecting before auth is known. */
  authChecked: boolean;
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

export interface CryptoItem {
  id: string;
  symbol: string;
  name: string;
  marketPrice: number;
  sellPrice: number;
  priceChangePercent24h: number;
  volume24h?: number;
}

export interface CryptoView extends CryptoItem {
  icon: string;
  chartColor: string;
  volume24h: number;
}

export interface OrderDTO {
  id: number;
  userId: number;
  userEmail: string;
  currencyCode: string;
  amount: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CreateOrderRequest {
  currencyCode: string;
  amount: number;
}

export interface CurrencyItem {
  id: number;
  code: string;
  name: string;
  currentPrice: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string | null;
  publishedAt: string;
  tags: string[];
}

export type AppLanguage = 'en' | 'pl' | 'ru';

export interface ProfileSettings {
  displayName: string;
  avatarUri: string | null;
  language: AppLanguage;
  privacy: {
    showPortfolio: boolean;
    showActivity: boolean;
  };
}
