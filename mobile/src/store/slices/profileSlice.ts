import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileSettings } from '../../types';

const STORAGE_KEY = '@crypto_profile_settings';

const defaultSettings: ProfileSettings = {
  displayName: '',
  avatarUri: null,
  notifications: {
    priceAlerts: true,
    orderUpdates: true,
    news: false,
  },
  currencyDisplay: 'USD',
  language: 'en',
  privacy: {
    showPortfolio: true,
    showActivity: true,
  },
  biometricLogin: false,
};

interface ProfileState {
  settings: ProfileSettings;
  loaded: boolean;
}

const initialState: ProfileState = {
  settings: defaultSettings,
  loaded: false,
};

/** Загружает настройки из AsyncStorage при старте. */
export const loadProfile = createAsyncThunk('profile/load', async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    /* Если не удалось прочитать — возвращаем defaults. */
  }
  return defaultSettings;
});

/** Сохраняет настройки в AsyncStorage. */
export const saveProfile = createAsyncThunk(
  'profile/save',
  async (settings: ProfileSettings) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return settings;
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    /** Обновить одно или несколько полей настроек (shallow merge). */
    updateSettings(state, action: PayloadAction<Partial<ProfileSettings>>) {
      state.settings = { ...state.settings, ...action.payload };
    },
    /** Обновить вложенные поля notifications. */
    updateNotifications(
      state,
      action: PayloadAction<Partial<ProfileSettings['notifications']>>,
    ) {
      state.settings.notifications = {
        ...state.settings.notifications,
        ...action.payload,
      };
    },
    /** Обновить вложенные поля privacy. */
    updatePrivacy(
      state,
      action: PayloadAction<Partial<ProfileSettings['privacy']>>,
    ) {
      state.settings.privacy = {
        ...state.settings.privacy,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.loaded = true;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { updateSettings, updateNotifications, updatePrivacy } =
  profileSlice.actions;
export default profileSlice.reducer;
