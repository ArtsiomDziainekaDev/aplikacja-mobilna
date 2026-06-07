import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import { offlineCache } from '../../cache/offlineCache';
import type { OrderDTO, CreateOrderRequest } from '../../types';
import haptics from '../../utils/haptics';

interface OrdersState {
  myOrders: OrderDTO[];
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  fromCache?: boolean;
}

const initialState: OrdersState = {
  myOrders: [],
  loading: false,
  error: null,
  createLoading: false,
};

export const fetchMyOrders = createAsyncThunk<
  { data: OrderDTO[]; fromCache: boolean },
  void,
  { rejectValue: string }
>(
  'orders/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<OrderDTO[]>('/api/orders/my');
      await offlineCache.setOrders(data);
      return { data, fromCache: false };
    } catch (e) {
      const cached = await offlineCache.getOrders();
      if (cached.length > 0) {
        return { data: cached, fromCache: true };
      }
      return rejectWithValue(e instanceof Error ? e.message : 'Błąd pobierania zamówień');
    }
  }
);

export const createOrder = createAsyncThunk<OrderDTO, CreateOrderRequest, { rejectValue: string }>(
  'orders/create',
  async (body, { rejectWithValue }) => {
    if (!body.currencyCode || !Number.isFinite(body.amount) || body.amount <= 0) {
      await haptics.error();
      return rejectWithValue('Nieprawidłowa kwota zamówienia');
    }
    try {
      const { data } = await api.post<OrderDTO>('/api/orders', body);
      await haptics.success();
      return data;
    } catch (e) {
      await haptics.error();
      if (e && typeof e === 'object' && 'response' in e) {
        const res = (e as { response?: { data?: unknown } }).response;
        const data = res?.data;
        if (typeof data === 'string' && data.trim()) return rejectWithValue(data.trim());
        if (data && typeof data === 'object' && typeof (data as { message?: string }).message === 'string') {
          return rejectWithValue((data as { message: string }).message);
        }
      }
      return rejectWithValue(e instanceof Error ? e.message : 'Błąd tworzenia zamówienia');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrdersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders = action.payload.data;
        state.fromCache = action.payload.fromCache;
        state.error = null;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Błąd';
      })
      .addCase(createOrder.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.createLoading = false;
        state.myOrders = [action.payload, ...state.myOrders];
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.createLoading = false;
        state.error = (action.payload as string) || 'Błąd';
      });
  },
});

export const { clearOrdersError } = ordersSlice.actions;
export default ordersSlice.reducer;
