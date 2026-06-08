import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { checkAuth, logout } from '../src/store/slices/authSlice';
import { setOnUnauthorized } from '../src/api/client';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { useAppDispatch } from '../src/hooks/useRedux';
import { PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../src/theme/colors';
import { I18nProvider } from '../src/i18n';

function RootLayoutNav(): React.JSX.Element {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    setOnUnauthorized(() => store.dispatch(logout()));
  }, []);

  return (
    <I18nProvider>
      <ErrorBoundary>
        <StatusBar style="light" />
        <Provider store={store}>
          <PaperProvider
            theme={{
              dark: true,
              colors: {
                primary: colors.primary,
                background: colors.background,
                surface: colors.surface,
                error: colors.error,
              },
            }}
          >
            <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent' } }}>
              <LinearGradient
                colors={['#4a148c', '#1a0533', '#880e4f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              >
                <RootLayoutNav />
              </LinearGradient>
            </ThemeProvider>
          </PaperProvider>
        </Provider>
      </ErrorBoundary>
    </I18nProvider>
  );
}
