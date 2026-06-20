import authReducer, { login, logout, clearError } from '../store/slices/authSlice';
import type { AuthState } from '../types';

jest.mock('../api/client', () => ({
  api: { post: jest.fn(), get: jest.fn() },
  getStoredToken: jest.fn(() => Promise.resolve(null)),
  setStoredToken: jest.fn(() => Promise.resolve()),
  clearStoredToken: jest.fn(() => Promise.resolve()),
}));

jest.mock('../utils/haptics', () => ({
  __esModule: true,
  default: {
    success: jest.fn(() => Promise.resolve()),
    warning: jest.fn(() => Promise.resolve()),
    error: jest.fn(() => Promise.resolve()),
  },
}));

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isAdmin: false,
  authChecked: false,
};

describe('authSlice reducer', () => {
  it('returns initial state for unknown action', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  it('sets loading on login.pending', () => {
    const action = { type: login.pending.type, meta: { arg: { email: 'a@b.com', password: 'x' }, requestId: '1' } };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('stores user and token on login.fulfilled', () => {
    const payload = {
      token: 'jwt',
      user: { id: 1, email: 'a@b.com', role: 'ROLE_USER' },
    };
    const action = { type: login.fulfilled.type, payload };
    const state = authReducer(initialState, action);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(payload.user);
    expect(state.token).toBe('jwt');
    expect(state.isAdmin).toBe(false);
  });

  it('flags admin when role is ROLE_ADMIN', () => {
    const action = {
      type: login.fulfilled.type,
      payload: { token: 't', user: { id: 1, email: 'a@b.com', role: 'ROLE_ADMIN' } },
    };
    const state = authReducer(initialState, action);
    expect(state.isAdmin).toBe(true);
  });

  it('stores error on login.rejected', () => {
    const action = { type: login.rejected.type, payload: 'Invalid credentials', error: {} };
    const state = authReducer({ ...initialState, loading: true }, action);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  it('clears auth state on logout.fulfilled', () => {
    const start: AuthState = {
      user: { id: 1, email: 'a@b.com', role: 'ROLE_USER' },
      token: 't',
      isAuthenticated: true,
      loading: false,
      error: null,
      isAdmin: false,
      authChecked: true,
    };
    const state = authReducer(start, { type: logout.fulfilled.type });
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('clears error via clearError action', () => {
    const start: AuthState = { ...initialState, error: 'oops' };
    const state = authReducer(start, clearError());
    expect(state.error).toBeNull();
  });
});
