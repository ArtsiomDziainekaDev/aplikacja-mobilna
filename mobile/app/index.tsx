import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/hooks/useRedux';

/**
 * Ekran startowy — przekierowuje do logowania lub do zakładek w zależności od stanu auth.
 */
export default function Index(): React.JSX.Element {
  const { authChecked, isAuthenticated } = useAppSelector((s) => s.auth);

  if (!authChecked) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});
