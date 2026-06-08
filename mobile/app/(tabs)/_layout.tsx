import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector } from '../../src/hooks/useRedux';
import { colors } from '../../src/theme/colors';
import Sidebar, { SIDEBAR_WIDTH } from '../../src/components/Sidebar';

export default function MainLayout(): React.JSX.Element {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDesktop={isDesktop}
      />

      <View style={[styles.mainContent, isDesktop && { marginLeft: SIDEBAR_WIDTH }]}>
        {!isDesktop && (
          <TouchableOpacity
            style={[styles.floatingMenuBtn, { top: insets.top + 16 }]}
            onPress={() => setSidebarOpen(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.contentContainer}>
          <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.background,
  },
  floatingMenuBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 90,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
  },
});
