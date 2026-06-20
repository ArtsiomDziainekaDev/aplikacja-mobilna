import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  PanResponder,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter, useSegments } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useConnectivity } from '../hooks/useConnectivity';
import { logout } from '../store/slices/authSlice';
import { colors } from '../theme/colors';
import { TranslationKey, useI18n } from '../i18n';

export const SIDEBAR_WIDTH = 240;

const PROFILE_ROUTE = '/profile' as Href;

interface NavItem {
  labelKey: TranslationKey;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  path: Href;
}

const mainNavItems: NavItem[] = [
  { labelKey: 'nav.home', icon: 'home', path: '/(tabs)' },
  { labelKey: 'nav.crypto', icon: 'chart-line', path: '/(tabs)/crypto' },
  { labelKey: 'nav.news', icon: 'newspaper-variant-outline', path: '/(tabs)/news' },
];

const accountNavItems: NavItem[] = [
  { labelKey: 'nav.profile', icon: 'account', path: PROFILE_ROUTE },
];

const ADMIN_NAV_ITEM: NavItem = { labelKey: 'common.admin', icon: 'shield-account', path: '/admin' as Href };

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

export default function Sidebar({ isOpen, onClose, isDesktop }: SidebarProps): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments() as string[];
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isConnected = useConnectivity();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const slideAnim = useRef(new Animated.Value(isDesktop ? 0 : -SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isDesktop) {
      setIsVisible(true);
      return;
    }

    if (isOpen) {
      setIsVisible(true);
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
      return;
    }

    const animation = Animated.parallel([
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
    ]);
    animation.start(({ finished }) => {
      if (finished) setIsVisible(false);
    });
    return () => animation.stop();
  }, [isOpen, isDesktop, slideAnim, overlayAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dx < 0 && isOpen) {
          slideAnim.setValue(Math.max(-SIDEBAR_WIDTH, gestureState.dx));
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
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

  const handleNavClick = useCallback((path: Href) => {
    router.push(path);
    if (!isDesktop) onClose();
  }, [router, isDesktop, onClose]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      t('nav.logoutConfirmTitle'),
      t('nav.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('nav.logout'),
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            router.replace('/(auth)/login');
            if (!isDesktop) onClose();
          },
        },
      ],
    );
  }, [dispatch, router, isDesktop, onClose, t]);

  const isActive = useCallback((path: Href): boolean => {
    const target = typeof path === 'string' ? path : (path as { pathname?: string }).pathname ?? '';
    const routeName = target.replace(/^\//, '');

    if (routeName === 'settings') {
      return segments.includes('settings') || segments.includes('edit-profile');
    }
    if (routeName === 'admin') {
      return segments.includes('admin');
    }
    if (routeName === 'profile') {
      return segments.includes('profile');
    }
    if (target === '/' || target === '/(tabs)' || routeName === '(tabs)') {
      return segments.length === 1 && segments[0] === '(tabs)';
    }

    return segments.includes(routeName) || pathname === target || pathname.endsWith(`/${routeName}`);
  }, [pathname, segments]);

  const renderNavItems = (items: NavItem[]) =>
    items.map((item) => {
      const active = isActive(item.path);
      return (
        <TouchableOpacity
          key={item.labelKey}
          style={[styles.navItem, active && styles.navItemActive]}
          onPress={() => handleNavClick(item.path)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={active ? '#fff' : 'rgba(255,255,255,0.6)'}
          />
          <Text style={[styles.navText, active && styles.navTextActive]}>{t(item.labelKey)}</Text>
        </TouchableOpacity>
      );
    });

  const SidebarContent = (
    <View style={[styles.content, { paddingTop: insets.top }]}>
      <View style={[styles.logoSection, { marginTop: Platform.OS === 'ios' ? 12 : 24 }]}>
        <View>
          <Text style={styles.logoText}>{t('common.appName')}</Text>
          <Text style={styles.logoSubtext}>{t('nav.subtitle')}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t('nav.main').toUpperCase()}</Text>
      <View style={styles.navSection}>{renderNavItems(mainNavItems)}</View>

      <Text style={styles.sectionLabel}>{t('nav.account').toUpperCase()}</Text>
      <View style={styles.navSection}>
        {renderNavItems(accountNavItems)}
        {isAdmin && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.navItem, isActive(ADMIN_NAV_ITEM.path) && styles.navItemActive]}
              onPress={() => handleNavClick(ADMIN_NAV_ITEM.path)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={ADMIN_NAV_ITEM.icon}
                size={20}
                color={isActive(ADMIN_NAV_ITEM.path) ? '#fff' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.navText, isActive(ADMIN_NAV_ITEM.path) && styles.navTextActive]}>
                {t(ADMIN_NAV_ITEM.labelKey)}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={20} color="rgba(255,255,255,0.5)" />
          <Text style={styles.logoutText}>{t('nav.logout')}</Text>
        </TouchableOpacity>

        <View style={[styles.connectionStatus, !isConnected && styles.connectionStatusOffline]}>
          <Text style={styles.connectionStatusTitle}>{t('nav.connectionStatus')}</Text>
          <View style={styles.connectionStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? colors.success : colors.error },
              ]}
            />
            <Text style={styles.connectionStatusText}>
              {isConnected ? t('nav.online') : t('nav.offline')}
            </Text>
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

  if (!isVisible) {
    return null;
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
    marginBottom: 20,
    paddingHorizontal: 12,
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.1,
    marginBottom: 6,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  navSection: {
    marginBottom: 8,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  userCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 4,
    gap: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(233, 30, 140, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 140, 0.35)',
  },
  userAvatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  userEmail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  userSettingsBtn: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.06)',
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
  connectionStatus: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.15)',
  },
  connectionStatusOffline: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderColor: 'rgba(255, 82, 82, 0.2)',
  },
  connectionStatusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  connectionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectionStatusText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
});
