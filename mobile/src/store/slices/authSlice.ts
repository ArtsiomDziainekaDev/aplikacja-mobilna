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
      if (!token) return rejectWithValue('Brak tokenu w odpowiedzi');
      if (typeof id !== 'number' || typeof email !== 'string' || !email) {
        return rejectWithValue('Nieprawidłowa odpowiedź serwera (brak id/email)');
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
      let message = 'Błąd logowania';
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
          message = 'Brak połączenia z serwerem. Uruchom backend (docker compose up). Na emulatorze Android: EXPO_PUBLIC_API_URL=http://10.0.2.2:8081. Na telefonie w Wi‑Fi: adres IP komputera (ipconfig), np. http://192.168.1.5:8081. Potem: npx expo start -c';
        } else if (message.includes('timeout') || message.includes('exceeded')) {
          message = 'Serwer nie odpowiada. 1) Backend działa? (docker compose up) 2) Na telefonie w Wi‑Fi w pliku mobile/.env ustaw EXPO_PUBLIC_API_URL=http://IP_KOMPUTERA:8081 (ipconfig → IPv4). 3) Uruchom ponownie: npx expo start -c';
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
      return { message: 'Konto utworzone. Zaloguj się.' };
    } catch (err: unknown) {
      await haptics.error();
      let message = 'Błąd rejestracji';
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
          message = 'Brak połączenia z serwerem. Uruchom backend (docker compose up) i ustaw EXPO_PUBLIC_API_URL: na emulatorze Android — http://10.0.2.2:8081, na urządzeniu — http://IP_KOMPUTERA:8081.';
        } else if (message.includes('timeout') || message.includes('exceeded')) {
          message = 'Serwer nie odpowiada w czasie. Upewnij się, że backend działa (docker compose up) i spróbuj ponownie.';
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
        state.error = (action.payload as string) || action.error.message || 'Błąd logowania';
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
        state.error = (action.payload as string) || 'Błąd rejestracji';
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
