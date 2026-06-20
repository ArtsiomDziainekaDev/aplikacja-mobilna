import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Modal,
  Platform,
  Pressable,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FadeInScreen from '../components/FadeInScreen';
import haptics from '../utils/haptics';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { logout } from '../store/slices/authSlice';
import {
  loadProfile,
  saveProfile,
  updateSettings,
  updatePrivacy,
} from '../store/slices/profileSlice';
import type { AppLanguage, ProfileSettings } from '../types';
import { useI18n } from '../i18n';

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
  cancelLabel,
}: {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  cancelLabel: string;
}): React.JSX.Element {
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.96)).current;

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isWeb) return;
    if (visible) {
      Animated.parallel([
        Animated.timing(modalOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
      ]).start();
    } else {
      modalOpacity.setValue(0);
      modalScale.setValue(0.96);
    }
  }, [visible, modalOpacity, modalScale, isWeb]);

  const ModalBody = isWeb ? View : Animated.View;
  const modalBodyStyle = isWeb
    ? styles.modalContent
    : [styles.modalContent, { opacity: modalOpacity, transform: [{ scale: modalScale }] }];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <ModalBody style={modalBodyStyle}>
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
              <Text style={styles.modalCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
          </Pressable>
        </ModalBody>
      </Pressable>
    </Modal>
  );
}

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

const LANGUAGE_OPTIONS: PickerOption<AppLanguage>[] = [
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇵🇱 Polski', value: 'pl' },
  { label: '🇷🇺 Русский', value: 'ru' },
];

const EDIT_PROFILE_ROUTE = '/edit-profile' as Href;

function languageLabel(code: AppLanguage): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

export default function SettingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { language, setLanguage, t } = useI18n();
  const { settings, loaded } = useAppSelector((s) => s.profile);
  const { privacy } = settings;

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    if (!loaded) dispatch(loadProfile());
  }, [dispatch, loaded]);


  const commitSettings = useCallback(
    (nextSettings: ProfileSettings) => {
      dispatch(updateSettings(nextSettings));
      dispatch(saveProfile(nextSettings));
    },
    [dispatch],
  );

  useEffect(() => {
    if (loaded && settings.language !== language) {
      dispatch(updateSettings({ language }));
    }
  }, [dispatch, language, loaded, settings.language]);

  const handleLogout = useCallback(async () => {
    await haptics.warning();
    dispatch(logout());
    router.replace('/(auth)/login');
  }, [dispatch]);

  const handleEditProfile = useCallback(() => {
    void haptics.lightTap();
    router.push(EDIT_PROFILE_ROUTE);
  }, []);

  const handlePrivacyToggle = useCallback(
    (key: keyof typeof privacy) => {
      const nextSettings = {
        ...settings,
        privacy: {
          ...settings.privacy,
          [key]: !settings.privacy[key],
        },
      };
      dispatch(updatePrivacy({ [key]: nextSettings.privacy[key] }));
      dispatch(saveProfile(nextSettings));
    },
    [dispatch, settings],
  );

  return (
    <FadeInScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.headerTitle}>{t('settings.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('settings.manageAccount')}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('settings.account').toUpperCase()}</Text>
        <View style={styles.sectionCard}>
          <SettingsNavRow
            icon="account-edit"
            label={t('settings.editProfile')}
            subtitle={t('settings.namePhoto')}
            onPress={handleEditProfile}
          />
          <View style={styles.rowDivider} />
          <SettingsToggleRow
            icon="eye-off"
            label={t('settings.portfolioPrivacy')}
            value={!settings.privacy.showPortfolio}
            onToggle={() => handlePrivacyToggle('showPortfolio')}
          />
          <View style={styles.rowDivider} />
          <SettingsToggleRow
            icon="history"
            label={t('settings.activityPrivacy')}
            value={!settings.privacy.showActivity}
            onToggle={() => handlePrivacyToggle('showActivity')}
          />
        </View>

        <Text style={styles.sectionLabel}>{t('settings.preferences').toUpperCase()}</Text>
        <View style={styles.sectionCard}>
          <SettingsNavRow
            icon="translate"
            label={t('settings.language')}
            subtitle={languageLabel(language)}
            onPress={() => {
              void haptics.lightTap();
              setShowLanguagePicker(true);
            }}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>{t('settings.version')}</Text>
      </ScrollView>

      <PickerModal
        visible={showLanguagePicker}
        title={t('settings.language')}
        options={LANGUAGE_OPTIONS}
        selected={language}
        onSelect={(v) => {
          commitSettings({ ...settings, language: v });
          void setLanguage(v);
        }}
        onClose={() => setShowLanguagePicker(false)}
        cancelLabel={t('settings.cancel')}
      />
    </FadeInScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: 60 },

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

  versionText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.lg,
  },

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
