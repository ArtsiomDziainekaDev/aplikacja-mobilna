/**
 * API client. Base URL from EXPO_PUBLIC_API_URL.
 * On web uses AsyncStorage for token; on native uses SecureStore.
 */
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

let onUnauthorized: (() => void) | null = null;

/** Rejestruje callback wywoływany przy 401/403 (np. logout). */
export function setOnUnauthorized(callback: () => void): void {
  onUnauthorized = callback;
}

export const getBaseURL = (): string => {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (url) return url.replace(/\/$/, '');
  if (typeof process !== 'undefined' && (process as unknown as { env?: Record<string, string> }).env?.EXPO_PUBLIC_API_URL) {
    return (process as unknown as { env: Record<string, string> }).env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return 'http://localhost:8081';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/** On web SecureStore is not supported; use AsyncStorage. On native use SecureStore. */
async function getStoredTokenImpl(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function setStoredTokenImpl(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function clearStoredTokenImpl(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const getStoredToken = getStoredTokenImpl;
export const setStoredToken = setStoredTokenImpl;
export const clearStoredToken = clearStoredTokenImpl;

api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // localtunnel (loca.lt) shows an interstitial without this header.
    if (config.baseURL?.includes('loca.lt') && config.headers) {
      config.headers['Bypass-Tunnel-Reminder'] = 'true';
    }
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const path = error.config?.url ?? '';
      if (!path.includes('/api/auth/signin') && !path.includes('/api/auth/signup') && !path.includes('/api/auth/check')) {
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  }
);
