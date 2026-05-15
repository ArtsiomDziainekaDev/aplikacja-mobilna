import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useRedux';
import { logout } from '../../src/store/slices/authSlice';
import { fetchMyOrders } from '../../src/store/slices/ordersSlice';
import type { OrderDTO, OrderStatus } from '../../src/types';
import FadeInScreen from '../../src/components/FadeInScreen';
import haptics from '../../src/utils/haptics';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

const HOLDINGS = [
  { symbol: 'BTC', icon: '₿', amount: 1.75, value: 109375, color: '#f7931a' },
  { symbol: 'ETH', icon: 'Ξ', amount: 8.2, value: 33062, color: '#627eea' },
  { symbol: 'SOL', icon: '◎', amount: 120, value: 17760, color: '#00e5a0' },
];

const MOCK_ACTIVITY = [
  { type: 'Bought', symbol: 'BTC', date: '2026-05-05 14:30', value: 31250 },
  { type: 'Sold', symbol: 'ETH', date: '2026-05-04 09:15', value: 10080 },
  { type: 'Bought', symbol: 'SOL', date: '2026-05-05 16:45', value: 7400 },
];

const TOTAL_PORTFOLIO = 160197;
const TOTAL_PROFIT = 8750;

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

function statusLabel(s: OrderStatus): string {
  switch (s) {
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    case 'PENDING_PAYMENT': return 'Pending';
    case 'PENDING_CONFIRMATION': return 'Confirming';
    default: return s.replace(/_/g, ' ');
  }
}

function OrderCard({ item, index }: { item: OrderDTO; index: number }): React.JSX.Element {
  const { bg, color } = statusStyle(item.status);
  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay: Math.min(index * 60, 500), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, delay: Math.min(index * 60, 500), useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, index]);

  const isBuy = (item.totalPrice ?? 0) > 0;

  return (
    <Animated.View style={[styles.orderCard, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.orderCardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.typeIcon, { backgroundColor: isBuy ? colors.successLight : colors.errorLight }]}>
            <MaterialCommunityIcons
              name={isBuy ? 'trending-up' : 'trending-down'}
              size={16}
              color={isBuy ? colors.success : colors.error}
            />
          </View>
          <View>
            <Text style={styles.orderId}>#ORD-{String(item.id).padStart(3, '0')}</Text>
            <Text style={styles.currencyCode}>{item.currencyCode}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color }]}>{statusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{item.amount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
          <Text style={[styles.value, styles.priceValue]}>
            ${item.totalPrice?.toFixed(2) ?? '—'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.dateValue}>{date}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((s) => s.auth);
  const { myOrders, loading, error, fromCache } = useAppSelector((s) => s.orders);

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
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab, loadOrders]);

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Profile & Orders</Text>
            <Text style={styles.headerSubtitle}>Manage your account and track your trades</Text>
          </View>
        </View>

        {/* Profile Card (Full width now, removed maxWidth) */}
        <Animated.View
          style={[
            styles.profileCard,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
          ]}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {user?.email?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.email?.split('@')[0] ?? 'John Crypto'}
              </Text>
              <Text style={styles.email}>{user?.email ?? 'john.crypto@example.com'}</Text>
            </View>
            <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="cog" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            <View style={styles.badgeVerified}>
              <MaterialCommunityIcons name="check-circle" size={12} color={colors.success} />
              <Text style={styles.badgeVerifiedText}>Verified Account</Text>
            </View>
            {user?.role ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role.replace('ROLE_', '')}</Text>
              </View>
            ) : (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Pro Trader</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <View style={styles.statLabel}>
                <MaterialCommunityIcons name="wallet" size={13} color={colors.textMuted} />
                <Text style={styles.statLabelText}>Total Portfolio</Text>
              </View>
              <Text style={styles.statValue}>
                ${TOTAL_PORTFOLIO.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.stat, styles.statBorder]}>
              <View style={styles.statLabel}>
                <MaterialCommunityIcons name="trending-up" size={13} color={colors.textMuted} />
                <Text style={styles.statLabelText}>Total Profit</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.success }]}>
                +${TOTAL_PROFIT.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.stat, styles.statBorder]}>
              <View style={styles.statLabel}>
                <MaterialCommunityIcons name="percent" size={13} color={colors.textMuted} />
                <Text style={styles.statLabelText}>Profit %</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.success }]}>
                +7.5%
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Custom Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'portfolio' && styles.tabBtnActive]}
            onPress={() => setActiveTab('portfolio')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
              Portfolio Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('orders')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              Order History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'portfolio' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Holdings</Text>
            <View style={[styles.profileCard, { paddingVertical: spacing.sm }]}>
              {HOLDINGS.map((h, index) => (
                <View 
                  key={h.symbol} 
                  style={[
                    styles.holdingRow, 
                    index < HOLDINGS.length - 1 && styles.borderBottom
                  ]}
                >
                  <View style={styles.holdingInfoWrapper}>
                    <Text style={styles.holdingIconPlain}>{h.icon}</Text>
                    <View style={styles.holdingInfo}>
                      <Text style={styles.holdingSymbol}>{h.symbol}</Text>
                      <Text style={styles.holdingAmount}>{h.amount} {h.symbol}</Text>
                    </View>
                  </View>
                  <Text style={styles.holdingValue}>${h.value.toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Recent Activity</Text>
            <View style={[styles.profileCard, { paddingVertical: spacing.sm }]}>
              {MOCK_ACTIVITY.map((activity, index) => {
                const isBuy = activity.type === 'Bought';
                return (
                  <View 
                    key={index} 
                    style={[
                      styles.holdingRow, 
                      index < MOCK_ACTIVITY.length - 1 && styles.borderBottom
                    ]}
                  >
                    <View style={styles.holdingInfoWrapper}>
                      <MaterialCommunityIcons
                        name={isBuy ? 'trending-up' : 'trending-down'}
                        size={20}
                        color={isBuy ? colors.success : colors.error}
                        style={{ marginRight: 12, width: 24, textAlign: 'center' }}
                      />
                      <View style={styles.holdingInfo}>
                        <Text style={styles.holdingSymbol}>{activity.type} {activity.symbol}</Text>
                        <Text style={styles.holdingAmount}>{activity.date}</Text>
                      </View>
                    </View>
                    <Text style={[styles.holdingValue, { color: isBuy ? colors.success : colors.error }]}>
                      {isBuy ? '' : ''}${activity.value.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order History</Text>
            {fromCache && (
              <View style={styles.offlineBanner}>
                <MaterialCommunityIcons name="cloud-off-outline" size={14} color={colors.warning} />
                <Text style={styles.offlineText}>Cached data (offline)</Text>
              </View>
            )}
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : error && myOrders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : myOrders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="receipt" size={64} color={colors.textMuted} />
                <Text style={styles.emptyText}>No orders yet</Text>
              </View>
            ) : (
              myOrders.map((order, index) => (
                <OrderCard key={order.id} item={order} index={index} />
              ))
            )}
          </View>
        )}

        {/* Actions */}
        {user?.role === 'ROLE_ADMIN' && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/admin')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="shield-account" size={20} color="#fff" />
            <Text style={styles.adminButtonText}>Admin Panel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
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
    // Removed maxWidth to match the frontend and allow it to expand properly
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
  badgeVerified: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.successLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(0,230,118,0.2)',
  },
  badgeVerifiedText: { fontSize: 11, color: colors.success, fontWeight: '600' },
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

  // Order styles
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