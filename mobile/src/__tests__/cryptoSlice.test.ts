import cryptoReducer, { fetchCrypto, clearCryptoError } from '../store/slices/cryptoSlice';
import type { CryptoItem } from '../types';

jest.mock('../services/cryptoService', () => {
  const actual = jest.requireActual('../services/cryptoService');
  return {
    ...actual,
    fetchCryptoList: jest.fn(),
  };
});

jest.mock('../cache/offlineCache', () => ({
  offlineCache: {
    getCrypto: jest.fn(() => Promise.resolve([])),
    setCrypto: jest.fn(() => Promise.resolve()),
    getOrders: jest.fn(() => Promise.resolve([])),
    setOrders: jest.fn(() => Promise.resolve()),
  },
}));

const sample: CryptoItem[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', marketPrice: 60000, sellPrice: 59000, priceChangePercent24h: 1.5 },
];

describe('cryptoSlice reducer', () => {
  it('starts with empty list', () => {
    const state = cryptoReducer(undefined, { type: '@@INIT' });
    expect(state.list).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.fromCache).toBe(false);
  });

  it('sets loading on fetchCrypto.pending', () => {
    const state = cryptoReducer(undefined, { type: fetchCrypto.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('maps payload to CryptoView on fulfilled and stores fromCache flag', () => {
    const action = {
      type: fetchCrypto.fulfilled.type,
      payload: { data: sample, fromCache: true },
    };
    const state = cryptoReducer(undefined, action);
    expect(state.loading).toBe(false);
    expect(state.list).toHaveLength(1);
    expect(state.list[0].symbol).toBe('BTC');
    expect(state.list[0].icon).toBe('₿');
    expect(state.list[0].volume24h).toBe(0);
    expect(state.fromCache).toBe(true);
    expect(state.lastUpdated).toEqual(expect.any(Number));
  });

  it('stores error string on rejected', () => {
    const action = { type: fetchCrypto.rejected.type, payload: 'Network down' };
    const state = cryptoReducer(undefined, action);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network down');
  });

  it('clears error via clearCryptoError', () => {
    const state = cryptoReducer(
      { list: [], loading: false, error: 'old', fromCache: false, lastUpdated: null },
      clearCryptoError()
    );
    expect(state.error).toBeNull();
  });
});
