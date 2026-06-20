import { store } from '../store';

describe('store', () => {
  it('should have auth, crypto, orders reducers', () => {
    const state = store.getState();
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('crypto');
    expect(state).toHaveProperty('orders');
  });
});
