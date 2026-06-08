import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FadeInScreen from '../src/components/FadeInScreen';
import haptics from '../src/utils/haptics';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { useAppDispatch, useAppSelector } from '../src/hooks/useRedux';
import { logout } from '../src/store/slices/authSlice';
import {
  loadProfile,
  saveProfile,
  updateSettings,
  updateNotifications,
  updatePrivacy,
} from '../src/store/slices/profileSlice';
import type { CurrencyDisplayCode, AppLanguage } from '../src/types';

/* ────────────────────── Change Password Modal ────────────────────── */

function ChangePasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(modalOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
      ]).start();
    } else {
      modalOpacity.setValue(0);
      modalScale.setValue(0.96);
    }
  }, [visible, modalOpacity, modalScale]);

  const handleSave = () => {
    void haptics.success();
    Alert.alert('Success', 'Password change is not connected to the backend yet — coming soon!');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalContent, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalSubtitle}>
              This feature will be available once the backend API endpoint is ready.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Text style={styles.modalSaveText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/* ────────────────────── Picker Modal ────────────────────── */

interface PickerOption<T extends string> {
  label: string;
  value: T;
}

function PickerModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}): React.JSX.Element {
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(modalOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
      ]).start();
    } else {
      modalOpacity.setValue(0);
      modalScale.setValue(0.96);
    }
  }, [visible, modalOpacity, modalScale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalContent, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.pickerList}>
              {options.map((opt) => {
                const isActive = opt.value === selected;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pickerItem, isActive && styles.pickerItemActive]}
                    onPress={() => {
                      void haptics.lightTap();
                      onSelect(opt.value);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, isActive && styles.pickerItemTextActive]}>
                      {opt.label}
                    </Text>
                    {isActive && (
                      <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/* ────────────────────── Settings Row Components ────────────────────── */

function SettingsNavRow({
  icon,
  label,
  onPress,
  subtitle,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  subtitle?: string;
}): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsRowIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingsRowInfo}>
        <Text style={styles.settingsRowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.settingsRowSubtitle}>{subtitle}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function SettingsToggleRow({
  icon,
  label,
  value,
  onToggle,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}): React.JSX.Element {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.settingsRowLabel, { flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(v) => {
          void haptics.lightTap();
          onToggle(v);
        }}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(233,30,140,0.4)' }}
        thumbColor={value ? colors.primary : 'rgba(255,255,255,0.5)'}
      />
    </View>
  );
}

/* ────────────────────── Currency & Language options ────────────────────── */

const CURRENCY_OPTIONS: PickerOption<CurrencyDisplayCode>[] = [
  { label: '$ US Dollar (USD)', value: 'USD' },
  { label: '€ Euro (EUR)', value: 'EUR' },
  { label: 'zł Polish Zloty (PLN)', value: 'PLN' },
  { label: '£ British Pound (GBP)', value: 'GBP' },
];

const LANGUAGE_OPTIONS: PickerOption<AppLanguage>[] = [
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇵🇱 Polski', value: 'pl' },
];

const EDIT_PROFILE_ROUTE = '/edit-profile' as Href;

function currencyLabel(code: CurrencyDisplayCode): string {
  return CURRENCY_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

function languageLabel(code: AppLanguage): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

/* ────────────────────── Main Settings Screen ────────────────────── */

export default function SettingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { settings, loaded } = useAppSelector((s) => s.profile);
  const { privacy } = settings;

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  /* Load settings on mount */
  useEffect(() => {
    if (!loaded) dispatch(loadProfile());
  }, [dispatch, loaded]);

  /* Persist settings whenever they change */
  const persistSettings = useCallback(() => {
    dispatch(saveProfile(settings));
  }, [dispatch, settings]);

  useEffect(() => {
    if (loaded) persistSettings();
  }, [settings, loaded, persistSettings]);

  const handleLogout = useCallback(async () => {
    await haptics.warning();
    dispatch(logout());
    router.replace('/(auth)/login');
  }, [dispatch]);

  const handleEditProfile = useCallback(() => {
    void haptics.lightTap();
    router.push(EDIT_PROFILE_ROUTE);
  }, []);

  const handleChangePassword = useCallback(() => {
    void haptics.lightTap();
    setShowPasswordModal(true);
  }, []);

  const handlePrivacyToggle = useCallback(
    (key: keyof typeof privacy) => {
      dispatch(updatePrivacy({ [key]: !privacy[key] }));
    },
    [dispatch, privacy],
  );

  /* Section header animation */
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  return (
    <FadeInScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              void haptics.lightTap();
              router.back();
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your account</Text>
          </View>
        </View>

        {/* ─── ACCOUNT ─── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          <SettingsNavRow
            icon="account-edit"
            label="Edit Profile"
            subtitle="Name, photo"
            onPress={handleEditProfile}
          />
          <View style={styles.rowDivider} />
          <SettingsNavRow
            icon="lock-reset"
            label="Change Password"
            onPress={handleChangePassword}
          />
          <View style={styles.rowDivider} />
          <SettingsToggleRow
            icon="eye-off"
            label="Hide Portfolio"
            value={!settings.privacy.showPortfolio}
            onToggle={() => handlePrivacyToggle('showPortfolio')}
          />
          <View style={styles.rowDivider} />
          <SettingsToggleRow
            icon="history"
            label="Hide Activity"
            value={!settings.privacy.showActivity}
            onToggle={() => handlePrivacyToggle('showActivity')}
          />
        </View>

        {/* ─── PREFERENCES ─── */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.sectionCard}>
          <SettingsToggleRow
            icon="bell-ring"
            label="Price Alerts"
            value={settings.notifications.priceAlerts}
            onToggle={(v) => dispatch(updateNotifications({ priceAlerts: v }))}
          />
          <View style={styles.rowDivider} />
          <SettingsToggleRow
            icon="cart-check"
            label="Order Updates"
            value={settings.notifications.orderUpdates}
            onToggle={(v) => dispatch(updateNotifications({ orderUpdates: v }))}
          />
          <View style={styles.rowDivider} />
          <SettingsToggleRow
            icon="newspaper"
            label="News Notifications"
            value={settings.notifications.news}
            onToggle={(v) => dispatch(updateNotifications({ news: v }))}
          />
          <View style={styles.rowDivider} />
          <SettingsNavRow
            icon="currency-usd"
            label="Currency Display"
            subtitle={currencyLabel(settings.currencyDisplay)}
            onPress={() => {
              void haptics.lightTap();
              setShowCurrencyPicker(true);
            }}
          />
          <View style={styles.rowDivider} />
          <SettingsNavRow
            icon="translate"
            label="Language"
            subtitle={languageLabel(settings.language)}
            onPress={() => {
              void haptics.lightTap();
              setShowLanguagePicker(true);
            }}
          />
        </View>

        {/* ─── SECURITY ─── */}
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.sectionCard}>
          <SettingsToggleRow
            icon="fingerprint"
            label="Biometric Login"
            value={settings.biometricLogin}
            onToggle={(v) => dispatch(updateSettings({ biometricLogin: v }))}
          />
        </View>

        {/* ─── LOG OUT ─── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Crypto Exchange v1.0.0</Text>
      </ScrollView>

      {/* Modals */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      <PickerModal
        visible={showCurrencyPicker}
        title="Currency Display"
        options={CURRENCY_OPTIONS}
        selected={settings.currencyDisplay}
        onSelect={(v) => dispatch(updateSettings({ currencyDisplay: v }))}
        onClose={() => setShowCurrencyPicker(false)}
      />
      <PickerModal
        visible={showLanguagePicker}
        title="Language"
        options={LANGUAGE_OPTIONS}
        selected={settings.language}
        onSelect={(v) => dispatch(updateSettings({ language: v }))}
        onClose={() => setShowLanguagePicker(false)}
      />
    </FadeInScreen>
  );
}

/* ────────────────────── Styles ────────────────────── */

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: 60 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  /* Section */
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: spacing.md,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 4,
  },

  /* Row */
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingsRowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(233,30,140,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsRowInfo: { flex: 1 },
  settingsRowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  settingsRowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },

  /* Log Out */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: spacing.lg,
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  /* Version */
  versionText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.lg,
  },

  /* Modal shared */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: 'rgba(40, 10, 70, 0.98)',
    borderRadius: 20,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  modalSaveText: { fontSize: 15, color: '#fff', fontWeight: '700' },

  /* Picker */
  pickerList: { marginBottom: spacing.md },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: colors.surfaceLight,
  },
  pickerItemActive: {
    backgroundColor: 'rgba(233,30,140,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(233,30,140,0.3)',
  },
  pickerItemText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  pickerItemTextActive: { color: colors.primary, fontWeight: '700' },
});
