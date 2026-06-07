/**
 * Pojedyncze źródło danych o kryptowalutach.
 *
 * Lista cen (`/api/crypto`) idzie przez backend — backend agreguje Binance,
 * dolicza sellPrice (z konfigurowalnym discountem) i zwraca volume24h.
 * Historyczne świeczki (klines) backend nie udostępnia, więc dla wykresów
 * mamy osobny helper, który jawnie woła Binance — to nie miesza się
 * z głównym kontraktem danych.
 */
import { api } from '../api/client';
import type { CryptoItem, CryptoView } from '../types';

interface CryptoMeta {
  icon: string;
  chartColor: string;
}

const CRYPTO_META: Record<string, CryptoMeta> = {
  BTC: { icon: '₿', chartColor: '#f7931a' },
  ETH: { icon: 'Ξ', chartColor: '#627eea' },
  BNB: { icon: '◆', chartColor: '#f3ba2f' },
  SOL: { icon: '◎', chartColor: '#00e5a0' },
  XRP: { icon: '✕', chartColor: '#00aae4' },
  ADA: { icon: '₳', chartColor: '#0033ad' },
  DOGE: { icon: 'Ð', chartColor: '#c2a633' },
  AVAX: { icon: '▲', chartColor: '#e84142' },
  DOT: { icon: '●', chartColor: '#e6007a' },
  MATIC: { icon: '⬡', chartColor: '#8247e5' },
  LINK: { icon: '⬢', chartColor: '#375bd2' },
  UNI: { icon: '🦄', chartColor: '#ff007a' },
  LTC: { icon: 'Ł', chartColor: '#bfbbbb' },
  ATOM: { icon: '⚛', chartColor: '#6f7390' },
  FIL: { icon: '⨎', chartColor: '#42c1ca' },
};

const DEFAULT_META: CryptoMeta = { icon: '◇', chartColor: '#888888' };

export function getCryptoMeta(symbol: string): CryptoMeta {
  return CRYPTO_META[symbol] ?? DEFAULT_META;
}

export function toCryptoView(item: CryptoItem): CryptoView {
  const meta = getCryptoMeta(item.symbol);
  return {
    ...item,
    icon: meta.icon,
    chartColor: meta.chartColor,
    volume24h: item.volume24h ?? 0,
  };
}

/** Walidacja kształtu obiektu z backendu / cache. */
export function isCryptoItem(value: unknown): value is CryptoItem {
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

export async function fetchCryptoList(): Promise<CryptoItem[]> {
  const { data } = await api.get<CryptoItem[]>('/api/crypto');
  if (!Array.isArray(data)) return [];
  return data.filter(isCryptoItem);
}

export type TimeFilter = '1H' | '24H' | '7D' | '1M' | '1Y';

export interface KlinePoint {
  timestamp: number;
  close: number;
}

export function klineParamsFor(filter: TimeFilter): { interval: string; limit: number } {
  switch (filter) {
    case '1H': return { interval: '1m', limit: 60 };
    case '24H': return { interval: '1h', limit: 24 };
    case '7D': return { interval: '4h', limit: 42 };
    case '1M': return { interval: '1d', limit: 30 };
    case '1Y': return { interval: '1w', limit: 52 };
  }
}

/**
 * Świeczki dla wykresu — Binance public endpoint, bez autoryzacji.
 * Backend nie udostępnia historycznych świeczek, więc to jedyne miejsce,
 * gdzie sięgamy do zewnętrznego API z aplikacji mobilnej.
 */
export async function fetchKlines(symbol: string, filter: TimeFilter): Promise<KlinePoint[]> {
  const { interval, limit } = klineParamsFor(filter);
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Binance klines: ${resp.status}`);
  const raw = await resp.json();
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((k: unknown): k is unknown[] => Array.isArray(k) && k.length >= 5)
    .map((k) => ({
      timestamp: Number(k[0]),
      close: Number(k[4]),
    }))
    .filter((p) => Number.isFinite(p.timestamp) && Number.isFinite(p.close));
}
