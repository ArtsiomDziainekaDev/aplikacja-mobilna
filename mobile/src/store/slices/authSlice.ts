import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, clearStoredToken, getStoredToken, setStoredToken } from '../../api/client';
import type { AuthState, LoginCredentials, RegisterCredentials, LoginResponse } from '../../types';
import haptics from '../../utils/haptics';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isAdmin: false,
};

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    const token = await getStoredToken();
    if (!token) return rejectWithValue('no_token');
    try {
      const response = await api.get<LoginResponse>('/api/auth/check');
      const d = response.data;
      if (typeof d?.id !== 'number' || typeof d?.email !== 'string' || !d.email) {
        await clearStoredToken();
        return rejectWithValue('invalid_user_payload');
      }
      return {
        user: {
          id: d.id,
          email: d.email,
          role: d.roles?.length ? d.roles[0] : 'ROLE_USER',
        },
        token,
      };
    } catch {
      await clearStoredToken();
      return rejectWithValue('invalid');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/signin', credentials);
      const { token, id, email, roles } = response.data;
      if (!token) return rejectWithValue('errors.auth.missingToken');
      if (typeof id !== 'number' || typeof email !== 'string' || !email) {
        return rejectWithValue('errors.auth.invalidServerResponse');
      }
      await setStoredToken(token);
      await haptics.success();
      return {
        token,
        user: {
          id,
          email,
          role: roles?.length ? roles[0] : 'ROLE_USER',
        },
      };
    } catch (err: unknown) {
      await haptics.error();
      let message = 'errors.auth.loginFailed';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response;
        const data = res?.data;
        if (typeof data === 'string' && data.trim()) message = data.trim();
        else if (data && typeof data === 'object' && typeof (data as { message?: string }).message === 'string') {
          message = (data as { message: string }).message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
        if (message === 'Network Error' || message.includes('network') || message.includes('ECONNREFUSED')) {
          message = 'errors.auth.network';
        } else if (message.includes('timeout') || message.includes('exceeded')) {
          message = 'errors.auth.timeout';
        }
      }
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      await api.post('/api/auth/signup', credentials);
      await haptics.success();
      return { message: 'auth.accountCreated' };
    } catch (err: unknown) {
      await haptics.error();
      let message = 'errors.auth.registerFailed';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response;
        const data = res?.data;
        if (typeof data === 'string' && data.trim()) {
          message = data.trim();
        } else if (data && typeof data === 'object' && typeof (data as { message?: string }).message === 'string') {
          message = (data as { message: string }).message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
        if (message === 'Network Error' || message.includes('network') || message.includes('ECONNREFUSED')) {
          message = 'errors.auth.network';
        } else if (message.includes('timeout') || message.includes('exceeded')) {
          message = 'errors.auth.timeout';
        }
      }
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await clearStoredToken();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.user.role === 'ROLE_ADMIN';
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'errors.auth.loginFailed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'errors.auth.registerFailed';
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.user.role === 'ROLE_ADMIN';
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
