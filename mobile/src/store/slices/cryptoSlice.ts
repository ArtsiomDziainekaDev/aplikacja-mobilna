import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { offlineCache } from '../../cache/offlineCache';
import { fetchCryptoList, toCryptoView } from '../../services/cryptoService';
import type { CryptoItem, CryptoView } from '../../types';

interface CryptoState {
  list: CryptoView[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  lastUpdated: number | null;
}

const initialState: CryptoState = {
  list: [],
  loading: false,
  error: null,
  fromCache: false,
  lastUpdated: null,
};

interface FetchResult {
  data: CryptoItem[];
  fromCache: boolean;
}

export const fetchCrypto = createAsyncThunk<FetchResult, void, { rejectValue: string }>(
  'crypto/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchCryptoList();
      await offlineCache.setCrypto(data);
      return { data, fromCache: false };
    } catch (e) {
      const cached = await offlineCache.getCrypto();
      if (cached.length > 0) {
        return { data: cached, fromCache: true };
      }
      return rejectWithValue(e instanceof Error ? e.message : 'errors.crypto.fetchFailed');
    }
  }
);

const cryptoSlice = createSlice({
  name: 'crypto',
  initialState,
  reducers: {
    clearCryptoError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCrypto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCrypto.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data.map(toCryptoView);
        state.fromCache = action.payload.fromCache;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchCrypto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'errors.crypto.fetchFailed';
      });
  },
});

export const { clearCryptoError } = cryptoSlice.actions;
export default cryptoSlice.reducer;
