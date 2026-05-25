import type { OrderStatus, CryptoItem, CryptoView, OrderDTO } from '../types';

describe('types', () => {
  it('OrderStatus is string union', () => {
    const s: OrderStatus = 'COMPLETED';
    expect(s).toBe('COMPLETED');
  });

  it('CryptoItem shape includes priceChangePercent24h', () => {
    const c: CryptoItem = {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      marketPrice: 40000,
      sellPrice: 34000,
      priceChangePercent24h: 1.5,
    };
    expect(c.symbol).toBe('BTC');
    expect(c.priceChangePercent24h).toBe(1.5);
  });

  it('CryptoView extends CryptoItem with UI metadata', () => {
    const v: CryptoView = {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      marketPrice: 40000,
      sellPrice: 34000,
      priceChangePercent24h: 1.5,
      icon: '₿',
      chartColor: '#f7931a',
      volume24h: 1_000_000,
    };
    expect(v.icon).toBe('₿');
  });

  it('OrderDTO shape', () => {
    const o: OrderDTO = {
      id: 1,
      userId: 1,
      userEmail: 'a@b.com',
      currencyCode: 'BTC',
      amount: 0.1,
      totalPrice: 4000,
      status: 'PENDING_PAYMENT',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    expect(o.currencyCode).toBe('BTC');
  });
});
