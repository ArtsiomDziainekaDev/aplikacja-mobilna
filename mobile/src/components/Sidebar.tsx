import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { logout } from '../store/slices/authSlice';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');
export const SIDEBAR_WIDTH = 240;

interface NavItem {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  path: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Home', icon: 'home', path: '/' },
  { label: 'Crypto', icon: 'chart-line', path: '/crypto' },
  { label: 'News', icon: 'newspaper-variant-outline', path: '/news' },
  { label: 'Profile', icon: 'account', path: '/profile' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

export default function Sidebar({ isOpen, onClose, isDesktop }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s: any) => s.auth);
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(isDesktop ? 0 : -SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDesktop) return;

    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, isDesktop, slideAnim, overlayAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0 && isOpen) {
          slideAnim.setValue(Math.max(-SIDEBAR_WIDTH, gestureState.dx));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50 || gestureState.vx < -0.5) {
          onClose();
        } else if (isOpen) {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleNavClick = (path: string) => {
    // router.push is better for tabs structure, but since we are changing layout, router.push works
    router.push(path as any);
    if (!isDesktop) onClose();
  };

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  const SidebarContent = (
    <View style={[styles.content, { paddingTop: insets.top }]}>
      {/* Logo */}
      <View style={[styles.logoSection, { marginTop: Platform.OS === 'ios' ? 12 : 24 }]}>
        <View>
          <Text style={styles.logoText}>Crypto App</Text>
          <Text style={styles.logoSubtext}>Track & Calculate</Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navSection}>
        {mainNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => handleNavClick(item.path)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={active ? '#fff' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}

        {isAdmin && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.navItem, isActive('/admin') && styles.navItemActive]}
              onPress={() => handleNavClick('/admin')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="shield-account"
                size={20}
                color={isActive('/admin') ? '#fff' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.navText, isActive('/admin') && styles.navTextActive]}>Admin</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ flex: 1 }} />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={20} color="rgba(255,255,255,0.5)" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Market Status */}
        <View style={styles.marketStatus}>
          <Text style={styles.marketStatusTitle}>Market Status</Text>
          <View style={styles.marketStatusRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.marketStatusText}>Live Trading</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopSidebar}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={styles.fallbackBackground} />
        )}
        {SidebarContent}
      </View>
    );
  }

  // Mobile layout uses Animated Modal-like overlay
  if (!isOpen && (slideAnim as any)._value === -SIDEBAR_WIDTH) {
    return null; // completely hidden
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={[styles.mobileSidebar, { transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={styles.fallbackBackground} />
        )}
        {SidebarContent}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 99,
  },
  desktopSidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  mobileSidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 100,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  fallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 5, 51, 0.95)',
  },
  content: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  logoSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  navSection: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: colors.primary,
    // In React Native we can't easily do linear gradients without expo-linear-gradient on normal views,
    // so we use primary color, or a semi-transparent active background.
  },
  navText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
    marginLeft: 12,
  },
  navTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  bottomSection: {
    paddingHorizontal: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 12,
  },
  marketStatus: {
    backgroundColor: 'rgba(233, 30, 140, 0.15)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 140, 0.15)',
  },
  marketStatusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  marketStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00e676',
    marginRight: 6,
    shadowColor: '#00e676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  marketStatusText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
});
