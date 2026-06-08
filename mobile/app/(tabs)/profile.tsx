import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useRedux';
import { logout } from '../../src/store/slices/authSlice';
import { fetchMyOrders } from '../../src/store/slices/ordersSlice';
import { loadProfile } from '../../src/store/slices/profileSlice';
import type { OrderDTO, OrderStatus } from '../../src/types';
import FadeInScreen from '../../src/components/FadeInScreen';
import haptics from '../../src/utils/haptics';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { getCryptoMeta } from '../../src/services/cryptoService';
import { isTranslationKey, Language, TranslationKey, useI18n } from '../../src/i18n';

interface Holding {
  symbol: string;
  icon: string;
  amount: number;
  value: number;
}

const SETTINGS_ROUTE = '/settings' as Href;
const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  pl: 'pl-PL',
  ru: 'ru-RU',
};

function statusStyle(s: OrderStatus): { bg: string; color: string } {
  switch (s) {
    case 'COMPLETED':
      return { bg: colors.successLight, color: colors.success };
    case 'CANCELLED':
      return { bg: colors.errorLight, color: colors.error };
    case 'PENDING_PAYMENT':
    case 'PENDING_CONFIRMATION':
      return { bg: colors.warningLight, color: colors.warning };
    default:
      return { bg: 'rgba(233,30,140,0.12)', color: colors.primary };
  }
}

function statusLabel(s: OrderStatus, t: (key: TranslationKey) => string): string {
  switch (s) {
    case 'COMPLETED': return t('common.completed');
    case 'CANCELLED': return t('admin.cancelled');
    case 'PENDING_PAYMENT': return t('admin.pendingPayment');
    case 'PENDING_CONFIRMATION': return t('admin.pendingConfirmation');
    case 'CONFIRMED': return t('admin.confirmed');
    case 'IN_PROGRESS': return t('admin.inProgress');
    case 'READY_FOR_PICKUP': return t('admin.readyForPickup');
    default: return String(s).replace(/_/g, ' ');
  }
}

function buildHoldings(orders: OrderDTO[]): Holding[] {
  const map = new Map<string, Holding>();
  for (const o of orders) {
    if (o.status !== 'COMPLETED') continue;
    const meta = getCryptoMeta(o.currencyCode);
    const current = map.get(o.currencyCode);
    if (current) {
      current.amount += o.amount;
      current.value += o.totalPrice ?? 0;
    } else {
      map.set(o.currencyCode, {
        symbol: o.currencyCode,
        icon: meta.icon,
        amount: o.amount,
        value: o.totalPrice ?? 0,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

function OrderCard({
  item,
  index,
  language,
  t,
}: {
  item: OrderDTO;
  index: number;
  language: Language;
  t: (key: TranslationKey) => string;
}): React.JSX.Element {
  const { bg, color } = statusStyle(item.status);
  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(LOCALE_BY_LANGUAGE[language], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay: Math.min(index * 60, 500), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, delay: Math.min(index * 60, 500), useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, index]);

  return (
    <Animated.View style={[styles.orderCard, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.orderCardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.typeIcon}>
            <MaterialCommunityIcons name="cart-outline" size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.orderId}>#ORD-{String(item.id).padStart(3, '0')}</Text>
            <Text style={styles.currencyCode}>{item.currencyCode}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color }]}>{statusLabel(item.status, t)}</Text>
        </View>
      </View>

      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('common.amount')}</Text>
          <Text style={styles.value}>{item.amount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('common.total')}</Text>
          <Text style={[styles.value, styles.priceValue]}>
            ${item.totalPrice?.toFixed(2) ?? '—'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('common.date')}</Text>
          <Text style={styles.dateValue}>{date}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { language, t } = useI18n();
  const { user } = useAppSelector((s) => s.auth);
  const { myOrders, loading, error, fromCache } = useAppSelector((s) => s.orders);
  const { settings, loaded: profileLoaded } = useAppSelector((s) => s.profile);

  const [activeTab, setActiveTab] = useState<'portfolio' | 'orders'>('portfolio');

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  const loadOrders = useCallback(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!profileLoaded) dispatch(loadProfile());
  }, [dispatch, profileLoaded]);

  const holdings = useMemo(() => buildHoldings(myOrders), [myOrders]);
  const recentOrders = useMemo(
    () => [...myOrders]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 5),
    [myOrders]
  );
  const totalPortfolio = useMemo(
    () => holdings.reduce((sum, h) => sum + h.value, 0),
    [holdings]
  );
  const completedCount = useMemo(
    () => myOrders.filter((o) => o.status === 'COMPLETED').length,
    [myOrders]
  );
  const displayName = settings.displayName.trim() || user?.email?.split('@')[0] || t('profile.guest');
  const avatarLetter = (displayName || user?.email || '?').charAt(0).toUpperCase();
  const showPortfolio = settings.privacy.showPortfolio;
  const showActivity = settings.privacy.showActivity;
  const orderErrorText = error && isTranslationKey(error) ? t(error) : error;

  useEffect(() => {
    if (!showActivity && activeTab === 'orders') setActiveTab('portfolio');
  }, [activeTab, showActivity]);

  const handleLogout = async (): Promise<void> => {
    await haptics.warning();
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <FadeInScreen>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 70 }]}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('profile.subtitle')}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.profileCard,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
          ]}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {settings.avatarUri ? (
                <Image source={{ uri: settings.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.email}>{user?.email ?? t('profile.notSignedIn')}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push(SETTINGS_ROUTE)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cog" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.badges}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role ? user.role.replace('ROLE_', '') : t('profile.guest')}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <View style={styles.statLabel}>
                <MaterialCommunityIcons name="wallet" size={13} color={colors.textMuted} />
                <Text style={styles.statLabelText}>{t('profile.totalPortfolio')}</Text>
              </View>
              <Text style={styles.statValue}>
                {showPortfolio ? `$${totalPortfolio.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••'}
              </Text>
            </View>
            <View style={[styles.stat, styles.statBorder]}>
              <View style={styles.statLabel}>
                <MaterialCommunityIcons name="check-circle-outline" size={13} color={colors.textMuted} />
                <Text style={styles.statLabelText}>{t('profile.completed')}</Text>
              </View>
              <Text style={styles.statValue}>{completedCount}</Text>
            </View>
            <View style={[styles.stat, styles.statBorder]}>
              <View style={styles.statLabel}>
                <MaterialCommunityIcons name="receipt" size={13} color={colors.textMuted} />
                <Text style={styles.statLabelText}>{t('common.orders')}</Text>
              </View>
              <Text style={styles.statValue}>{myOrders.length}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'portfolio' && styles.tabBtnActive]}
            onPress={() => setActiveTab('portfolio')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
              {t('profile.portfolioOverview')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('orders')}
            activeOpacity={0.8}
            disabled={!showActivity}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              {t('profile.orderHistory')}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'portfolio' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.holdings')}</Text>
            {!showPortfolio ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="eye-off-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('profile.portfolioHidden')}</Text>
                <Text style={styles.emptySubtext}>{t('profile.portfolioHiddenHint')}</Text>
              </View>
            ) : loading && myOrders.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : holdings.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="wallet-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('profile.noCompletedOrders')}</Text>
                <Text style={styles.emptySubtext}>{t('profile.placeOrderHint')}</Text>
              </View>
            ) : (
              <View style={[styles.profileCard, { paddingVertical: spacing.sm }]}>
                {holdings.map((h, index) => (
                  <View
                    key={h.symbol}
                    style={[
                      styles.holdingRow,
                      index < holdings.length - 1 && styles.borderBottom,
                    ]}
                  >
                    <View style={styles.holdingInfoWrapper}>
                      <Text style={styles.holdingIconPlain}>{h.icon}</Text>
                      <View style={styles.holdingInfo}>
                        <Text style={styles.holdingSymbol}>{h.symbol}</Text>
                        <Text style={styles.holdingAmount}>{h.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {h.symbol}</Text>
                      </View>
                    </View>
                    <Text style={styles.holdingValue}>${h.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                  </View>
                ))}
              </View>
            )}

            {showActivity && (
              <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>{t('profile.recentActivity')}</Text>
            )}
            {!showActivity ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="eye-off-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('profile.activityHidden')}</Text>
                <Text style={styles.emptySubtext}>{t('profile.activityHiddenHint')}</Text>
              </View>
            ) : recentOrders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="history" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('profile.noRecentActivity')}</Text>
              </View>
            ) : (
              <View style={[styles.profileCard, { paddingVertical: spacing.sm }]}>
                {recentOrders.map((order, index) => {
                  const meta = getCryptoMeta(order.currencyCode);
                  const statusInfo = statusStyle(order.status);
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString(LOCALE_BY_LANGUAGE[language], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—';
                  return (
                    <View
                      key={order.id}
                      style={[
                        styles.holdingRow,
                        index < recentOrders.length - 1 && styles.borderBottom,
                      ]}
                    >
                      <View style={styles.holdingInfoWrapper}>
                        <Text style={styles.holdingIconPlain}>{meta.icon}</Text>
                        <View style={styles.holdingInfo}>
                          <Text style={styles.holdingSymbol}>{t('common.order')} {order.currencyCode}</Text>
                          <Text style={styles.holdingAmount}>{dateStr}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.holdingValue}>
                          ${(order.totalPrice ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.holdingAmount, { color: statusInfo.color }]}>
                          {statusLabel(order.status, t)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : showActivity ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.orderHistory')}</Text>
            {fromCache && (
              <View style={styles.offlineBanner}>
                <MaterialCommunityIcons name="cloud-off-outline" size={14} color={colors.warning} />
                <Text style={styles.offlineText}>{t('profile.cached')}</Text>
              </View>
            )}
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : orderErrorText && myOrders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorText}>{orderErrorText}</Text>
              </View>
            ) : myOrders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="receipt" size={64} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('profile.noOrders')}</Text>
              </View>
            ) : (
              myOrders.map((order, index) => (
                <OrderCard key={order.id} item={order} index={index} language={language} t={t} />
              ))
            )}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="eye-off-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t('profile.activityHidden')}</Text>
            <Text style={styles.emptySubtext}>{t('profile.activityHiddenHint')}</Text>
          </View>
        )}

        {user?.role === 'ROLE_ADMIN' && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/admin')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="shield-account" size={20} color="#fff" />
            <Text style={styles.adminButtonText}>{t('profile.adminPanel')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </FadeInScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  profileCard: {
    backgroundColor: colors.surface, borderRadius: 20,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
    width: '100%',
  },
  avatarWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    backgroundColor: 'rgba(233, 30, 140, 0.5)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: { fontSize: 24, fontWeight: '700', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  badges: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  roleBadge: {
    backgroundColor: colors.surfaceLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  roleText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md,
  },
  stat: { flex: 1 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: spacing.sm },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  statLabelText: { fontSize: 11, color: colors.textMuted },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.text },

  tabsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },

  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  holdingInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  holdingIconPlain: {
    fontSize: 22,
    color: '#fff',
    width: 32,
    textAlign: 'center',
    marginRight: 8,
  },
  holdingInfo: { flex: 1 },
  holdingSymbol: { fontSize: 15, fontWeight: '700', color: '#fff' },
  holdingAmount: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  holdingValue: { fontSize: 15, fontWeight: '700', color: '#fff' },

  emptySubtext: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: spacing.md },

  orderCard: {
    backgroundColor: colors.surface, borderRadius: 18,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  orderCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(233,30,140,0.12)',
  },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.text },
  currencyCode: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  rows: { gap: 6, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, color: colors.textMuted },
  value: { fontSize: 13, color: colors.text, fontWeight: '600' },
  priceValue: { fontWeight: '700' },
  dateValue: { fontSize: 13, color: colors.textSecondary },
  loadingContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: spacing.xl },
  emptyText: { color: colors.textSecondary, marginTop: spacing.md, fontSize: 16 },
  errorText: { color: colors.error, textAlign: 'center', marginTop: spacing.md, fontSize: 15 },
  offlineBanner: {
    backgroundColor: colors.warningLight, padding: spacing.sm, borderRadius: 8, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  offlineText: { color: colors.warning, fontSize: 12, fontWeight: '500' },

  adminButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.secondary,
    paddingVertical: 14, borderRadius: 14, marginBottom: spacing.md,
  },
  adminButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.errorLight, borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)',
  },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});