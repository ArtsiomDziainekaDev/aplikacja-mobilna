import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CryptoItem, OrderDTO, OrderStatus } from '../types';

const CACHE_PREFIX = 'cache_';
const CACHE_CRYPTO = `${CACHE_PREFIX}crypto`;
const CACHE_ORDERS = `${CACHE_PREFIX}orders`;
const TTL_MS = 5 * 60 * 1000;

interface Cached<T> {
  data: T;
  timestamp: number;
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Cached<T>>;
    if (typeof parsed?.timestamp !== 'number') return null;
    if (Date.now() - parsed.timestamp > TTL_MS) return null;
    if (parsed.data === undefined) return null;
    return parsed.data as T;
  } catch {
    return null;
  }
}

async function setCached<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    /* zapis cache jest najlepiej-effort, brak miejsca nie powinien sypać UI */
  }
}

function isCryptoItem(value: unknown): value is CryptoItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.symbol === 'string' &&
    typeof v.name === 'string' &&
    typeof v.marketPrice === 'number' &&
    typeof v.sellPrice === 'number' &&
    typeof v.priceChangePercent24h === 'number'
  );
}

const ORDER_STATUSES: ReadonlyArray<OrderStatus> = [
  'PENDING_PAYMENT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
];

function isOrderDTO(value: unknown): value is OrderDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'number' &&
    typeof v.userId === 'number' &&
    typeof v.currencyCode === 'string' &&
    typeof v.amount === 'number' &&
    typeof v.totalPrice === 'number' &&
    typeof v.status === 'string' &&
    ORDER_STATUSES.includes(v.status as OrderStatus)
  );
}

function filterValid<T>(data: unknown, guard: (item: unknown) => item is T): T[] {
  if (!Array.isArray(data)) return [];
  return data.filter(guard);
}

export const offlineCache = {
  async getCrypto(): Promise<CryptoItem[]> {
    const cached = await getCached<unknown>(CACHE_CRYPTO);
    return filterValid(cached, isCryptoItem);
  },
  setCrypto: (data: CryptoItem[]) => setCached(CACHE_CRYPTO, data),
  async getOrders(): Promise<OrderDTO[]> {
    const cached = await getCached<unknown>(CACHE_ORDERS);
    return filterValid(cached, isOrderDTO);
  },
  setOrders: (data: OrderDTO[]) => setCached(CACHE_ORDERS, data),
};
