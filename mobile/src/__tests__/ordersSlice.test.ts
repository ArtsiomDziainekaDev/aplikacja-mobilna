import ordersReducer, { fetchMyOrders, createOrder, clearOrdersError } from '../store/slices/ordersSlice';
import type { OrderDTO } from '../types';

jest.mock('../api/client', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../cache/offlineCache', () => ({
  offlineCache: {
    getOrders: jest.fn(() => Promise.resolve([])),
    setOrders: jest.fn(() => Promise.resolve()),
    getCrypto: jest.fn(() => Promise.resolve([])),
    setCrypto: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../utils/haptics', () => ({
  __esModule: true,
  default: {
    success: jest.fn(() => Promise.resolve()),
    warning: jest.fn(() => Promise.resolve()),
    error: jest.fn(() => Promise.resolve()),
  },
}));

const order: OrderDTO = {
  id: 7,
  userId: 1,
  userEmail: 'a@b.com',
  currencyCode: 'BTC',
  amount: 0.1,
  totalPrice: 6000,
  status: 'PENDING_PAYMENT',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('ordersSlice reducer', () => {
  it('starts with empty list', () => {
    const state = ordersReducer(undefined, { type: '@@INIT' });
    expect(state.myOrders).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.createLoading).toBe(false);
  });

  it('sets loading on fetchMyOrders.pending', () => {
    const state = ordersReducer(undefined, { type: fetchMyOrders.pending.type });
    expect(state.loading).toBe(true);
  });

  it('stores orders on fetchMyOrders.fulfilled', () => {
    const state = ordersReducer(undefined, {
      type: fetchMyOrders.fulfilled.type,
      payload: { data: [order], fromCache: false },
    });
    expect(state.myOrders).toHaveLength(1);
    expect(state.myOrders[0].id).toBe(7);
    expect(state.fromCache).toBe(false);
  });

  it('marks fromCache when payload says so', () => {
    const state = ordersReducer(undefined, {
      type: fetchMyOrders.fulfilled.type,
      payload: { data: [order], fromCache: true },
    });
    expect(state.fromCache).toBe(true);
  });

  it('stores error on fetchMyOrders.rejected', () => {
    const state = ordersReducer(undefined, {
      type: fetchMyOrders.rejected.type,
      payload: 'Offline',
    });
    expect(state.error).toBe('Offline');
  });

  it('sets createLoading on createOrder.pending', () => {
    const state = ordersReducer(undefined, { type: createOrder.pending.type });
    expect(state.createLoading).toBe(true);
  });

  it('prepends new order on createOrder.fulfilled', () => {
    const existing: OrderDTO = { ...order, id: 1, status: 'COMPLETED' };
    const state = ordersReducer(
      { myOrders: [existing], loading: false, error: null, createLoading: true, fromCache: false },
      { type: createOrder.fulfilled.type, payload: order }
    );
    expect(state.createLoading).toBe(false);
    expect(state.myOrders[0].id).toBe(7);
    expect(state.myOrders[1].id).toBe(1);
  });

  it('stores error on createOrder.rejected', () => {
    const state = ordersReducer(undefined, {
      type: createOrder.rejected.type,
      payload: 'Invalid amount',
    });
    expect(state.createLoading).toBe(false);
    expect(state.error).toBe('Invalid amount');
  });

  it('clears error via clearOrdersError', () => {
    const state = ordersReducer(
      { myOrders: [], loading: false, error: 'fail', createLoading: false, fromCache: false },
      clearOrdersError()
    );
    expect(state.error).toBeNull();
  });
});

describe('createOrder thunk validation', () => {
  it('rejects when amount is not positive', async () => {
    const dispatch = jest.fn();
    const getState = jest.fn();
    const thunkAction = createOrder({ currencyCode: 'BTC', amount: 0 });
    const result = await thunkAction(dispatch, getState, undefined);
    expect(createOrder.rejected.match(result)).toBe(true);
    if (createOrder.rejected.match(result)) {
      expect(result.payload).toBe('Nieprawidłowa kwota zamówienia');
    }
  });
});
