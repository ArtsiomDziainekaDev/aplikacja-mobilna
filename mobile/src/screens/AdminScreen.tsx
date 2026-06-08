import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector } from '../hooks/useRedux';
import { api } from '../api/client';
import FadeInScreen from '../components/FadeInScreen';
import haptics from '../utils/haptics';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { OrderStatus } from '../types';
import { TranslationKey, useI18n } from '../i18n';

interface AdminOrder {
  id: number;
  userId: number;
  userEmail: string;
  currencyCode: string;
  amount: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL_KEYS: Record<OrderStatus, TranslationKey> = {
  PENDING_PAYMENT: 'admin.pendingPayment',
  PENDING_CONFIRMATION: 'admin.pendingConfirmation',
  CONFIRMED: 'admin.confirmed',
  IN_PROGRESS: 'admin.inProgress',
  READY_FOR_PICKUP: 'admin.readyForPickup',
  COMPLETED: 'common.completed',
  CANCELLED: 'admin.cancelled',
};

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
];

export default function AdminScreen(): React.JSX.Element | null {
  const isAdmin = useAppSelector((s) => s.auth.isAdmin);
  const { t } = useI18n();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusModalOrder, setStatusModalOrder] = useState<AdminOrder | null>(null);

  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (statusModalOrder) {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }),
      ]).start();
    } else {
      modalOpacity.setValue(0);
      modalScale.setValue(0.96);
    }
  }, [statusModalOrder, modalOpacity, modalScale]);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setError(null);
      const res = await api.get<AdminOrder[]>('/api/admin/orders');
      setOrders(res.data ?? []);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(msg || t('admin.errorLoading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        router.replace('/(tabs)');
        return;
      }
      fetchOrders(false);
    }, [isAdmin, fetchOrders])
  );

  const updateStatus = useCallback(async (orderId: number, newStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      await api.put(`/api/admin/orders/${orderId}/status`, { newStatus });
      await haptics.success();
      await fetchOrders(false);
    } catch (e: unknown) {
      await haptics.error();
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      Alert.alert(t('admin.errorTitle'), msg || t('admin.statusChangeFailed'));
    } finally {
      setUpdatingId(null);
    }
  }, [fetchOrders, t]);

  const openStatusModal = useCallback((order: AdminOrder) => {
    void haptics.mediumTap();
    setStatusModalOrder(order);
  }, []);

  const closeStatusModal = useCallback(() => {
    void haptics.lightTap();
    setStatusModalOrder(null);
  }, []);

  const onSelectStatus = useCallback(
    async (newStatus: OrderStatus) => {
      if (!statusModalOrder) return;
      closeStatusModal();
      await updateStatus(statusModalOrder.id, newStatus);
    },
    [statusModalOrder, closeStatusModal, updateStatus]
  );

  if (!isAdmin) {
    return null;
  }

  const renderItem = ({ item }: { item: AdminOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.label}>{t('admin.user')}</Text>
        <Text style={styles.value}>{item.userEmail}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>{t('admin.currencyAmount')}</Text>
        <Text style={styles.value}>{item.currencyCode} — {item.amount}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>{t('admin.sum')}</Text>
        <Text style={styles.value}>{(item.totalPrice ?? 0).toFixed(2)} PLN</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>{t('common.status')}</Text>
        <Text style={styles.statusText}>{t(STATUS_LABEL_KEYS[item.status])}</Text>
      </View>
      <TouchableOpacity
        style={[styles.statusButton, updatingId === item.id && styles.statusButtonDisabled]}
        onPress={() => openStatusModal(item)}
        disabled={updatingId === item.id}
      >
        {updatingId === item.id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
            <Text style={styles.statusButtonText}>{t('admin.updateStatus')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <FadeInScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={async () => {
              await haptics.lightTap();
              router.back();
            }}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('admin.title')}</Text>
        </View>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={async () => {
                await haptics.lightTap();
                fetchOrders(false);
              }}
            >
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchOrders(true)}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>{t('admin.empty')}</Text>
              </View>
            }
          />
        )}

        <Modal
          visible={statusModalOrder !== null}
          transparent
          animationType="fade"
          onRequestClose={closeStatusModal}
        >
          <Pressable style={styles.modalOverlay} onPress={closeStatusModal}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity: modalOpacity,
                  transform: [{ scale: modalScale }],
                },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Text style={styles.modalTitle}>
                  {t('admin.orderStatusTitle', { id: statusModalOrder?.id ?? '' })}
                </Text>
                <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                  {STATUS_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.modalOption}
                      onPress={() => onSelectStatus(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalOptionText}>{t(STATUS_LABEL_KEYS[s])}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalCancel} onPress={closeStatusModal}>
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </View>
    </FadeInScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: spacing.md,
  },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  errorBanner: {
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    alignItems: 'center',
  },
  errorText: { color: colors.warning, fontSize: 14 },
  retryText: { color: colors.primary, fontWeight: '600', marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: colors.textSecondary },
  value: { fontSize: 14, color: colors.text, fontWeight: '600' },
  statusText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: spacing.sm,
  },
  statusButtonDisabled: { opacity: 0.7 },
  statusButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalScroll: { maxHeight: 320 },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.sm,
  },
  modalOptionText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  modalCancel: {
    marginTop: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
});
