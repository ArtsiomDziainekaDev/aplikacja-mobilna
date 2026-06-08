import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileSettings } from '../../types';

const STORAGE_KEY = '@crypto_profile_settings';
const CURRENCY_CODES = ['USD', 'EUR', 'PLN', 'GBP'] as const;
const APP_LANGUAGES = ['en', 'pl', 'ru'] as const;

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
};

interface ProfileState {
  settings: ProfileSettings;
  loaded: boolean;
}

const initialState: ProfileState = {
  settings: defaultSettings,
  loaded: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCurrencyDisplayCode(value: unknown): value is ProfileSettings['currencyDisplay'] {
  return typeof value === 'string' && CURRENCY_CODES.includes(value as ProfileSettings['currencyDisplay']);
}

function isAppLanguage(value: unknown): value is ProfileSettings['language'] {
  return typeof value === 'string' && APP_LANGUAGES.includes(value as ProfileSettings['language']);
}

function normalizeProfileSettings(value: unknown): ProfileSettings {
  if (!isRecord(value)) return defaultSettings;

  const notifications = isRecord(value.notifications) ? value.notifications : {};
  const privacy = isRecord(value.privacy) ? value.privacy : {};
  const currencyDisplay = isCurrencyDisplayCode(value.currencyDisplay)
    ? value.currencyDisplay
    : defaultSettings.currencyDisplay;
  const language = isAppLanguage(value.language)
    ? value.language
    : defaultSettings.language;

  return {
    displayName: typeof value.displayName === 'string' ? value.displayName : defaultSettings.displayName,
    avatarUri: typeof value.avatarUri === 'string' ? value.avatarUri : null,
    notifications: {
      priceAlerts: typeof notifications.priceAlerts === 'boolean'
        ? notifications.priceAlerts
        : defaultSettings.notifications.priceAlerts,
      orderUpdates: typeof notifications.orderUpdates === 'boolean'
        ? notifications.orderUpdates
        : defaultSettings.notifications.orderUpdates,
      news: typeof notifications.news === 'boolean'
        ? notifications.news
        : defaultSettings.notifications.news,
    },
    currencyDisplay,
    language,
    privacy: {
      showPortfolio: typeof privacy.showPortfolio === 'boolean'
        ? privacy.showPortfolio
        : defaultSettings.privacy.showPortfolio,
      showActivity: typeof privacy.showActivity === 'boolean'
        ? privacy.showActivity
        : defaultSettings.privacy.showActivity,
    },
  };
}

export const loadProfile = createAsyncThunk('profile/load', async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeProfileSettings(JSON.parse(raw));
    }
  } catch {
    /* Profile settings are local-only; fall back to defaults if storage is invalid. */
  }
  return defaultSettings;
});

export const saveProfile = createAsyncThunk(
  'profile/save',
  async (settings: ProfileSettings) => {
    const normalized = normalizeProfileSettings(settings);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateSettings(state, action: PayloadAction<Partial<ProfileSettings>>) {
      state.settings = normalizeProfileSettings({ ...state.settings, ...action.payload });
    },
    updateNotifications(
      state,
      action: PayloadAction<Partial<ProfileSettings['notifications']>>,
    ) {
      state.settings.notifications = {
        ...state.settings.notifications,
        ...action.payload,
      };
    },
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
