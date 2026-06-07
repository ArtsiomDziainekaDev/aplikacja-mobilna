import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineCache } from '../cache/offlineCache';
import type { CryptoItem } from '../types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const validCrypto: CryptoItem = {
  id: 'bitcoin',
  symbol: 'BTC',
  name: 'Bitcoin',
  marketPrice: 60000,
  sellPrice: 59000,
  priceChangePercent24h: 1.5,
};

describe('offlineCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCrypto returns empty array when storage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await offlineCache.getCrypto();
    expect(result).toEqual([]);
  });

  it('setCrypto persists data via AsyncStorage', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    await offlineCache.setCrypto([validCrypto]);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    const [key, raw] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(key).toBe('cache_crypto');
    const parsed = JSON.parse(raw);
    expect(parsed.data).toEqual([validCrypto]);
    expect(parsed.timestamp).toEqual(expect.any(Number));
  });

  it('getCrypto filters out malformed entries', async () => {
    const payload = {
      data: [validCrypto, { id: 1, symbol: 'ETH' }, null, 'broken'],
      timestamp: Date.now(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(payload));
    const result = await offlineCache.getCrypto();
    expect(result).toEqual([validCrypto]);
  });

  it('getCrypto returns empty array when cache is expired', async () => {
    const payload = {
      data: [validCrypto],
      timestamp: Date.now() - 10 * 60 * 1000,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(payload));
    const result = await offlineCache.getCrypto();
    expect(result).toEqual([]);
  });

  it('getOrders rejects items with unknown status', async () => {
    const payload = {
      data: [
        {
          id: 1, userId: 2, currencyCode: 'BTC', amount: 0.1, totalPrice: 6000,
          status: 'BOGUS', userEmail: 'a@b.com', createdAt: '', updatedAt: '',
        },
      ],
      timestamp: Date.now(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(payload));
    const result = await offlineCache.getOrders();
    expect(result).toEqual([]);
  });

  it('getCrypto recovers gracefully from invalid JSON', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not-json');
    const result = await offlineCache.getCrypto();
    expect(result).toEqual([]);
  });
});
