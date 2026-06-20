import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';
import axiosInstance from '../../api/axios';
import type { AuthState, LoginCredentials, RegisterCredentials, LoginResponse } from '../../types';

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
  async () => {
    const response = await axiosInstance.get('/api/auth/check');
    if (!response.data) {
      throw new Error('Brak danych użytkownika');
    }
    return response.data;
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<LoginResponse>('/api/auth/signin', credentials);
      const { token, id, email, roles } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userId', id.toString());
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return {
        token,
        user: {
          id,
          email,
          role: roles && roles.length > 0 ? roles[0] : 'ROLE_USER'
        }
      };
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        if (error.response.status === 403) {
          throw new Error('Sesja wygasła');
        }
        throw new Error(error.response.data.message || 'Błąd autoryzacji');
      }
      throw new Error('Błąd sieci');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials) => {
    const response = await axiosInstance.post('/api/auth/signup', credentials);
    
    // Serwer zwraca wiadomość o sukcesie, nie token
    return {
      message: response.data || 'Rejestracja przebiegła pomyślnie'
    };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      delete axiosInstance.defaults.headers.common['Authorization'];
    },
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
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.user.role === 'ROLE_ADMIN';
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Błąd logowania';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Nie logujemy automatycznie po rejestracji
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Błąd podczas rejestracji';
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          role: action.payload.roles && action.payload.roles.length > 0 
            ? action.payload.roles[0] 
            : 'ROLE_USER'
        };
        state.isAuthenticated = true;
        state.isAdmin = action.payload.roles?.includes('ROLE_ADMIN') || false;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.error = null;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        delete axiosInstance.defaults.headers.common['Authorization'];
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 