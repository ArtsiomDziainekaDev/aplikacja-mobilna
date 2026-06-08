import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FadeInScreen from '../components/FadeInScreen';
import haptics from '../utils/haptics';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { loadProfile, saveProfile, updateSettings } from '../store/slices/profileSlice';
import { useI18n } from '../i18n';

export default function EditProfileScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const { settings, loaded } = useAppSelector((s) => s.profile);
  const { user } = useAppSelector((s) => s.auth);

  const [displayName, setDisplayName] = useState(settings.displayName);
  const [avatarUri, setAvatarUri] = useState<string | null>(settings.avatarUri);
  const [isSaving, setIsSaving] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loaded) dispatch(loadProfile());
  }, [dispatch, loaded]);

  /* Sync from store when loaded */
  useEffect(() => {
    if (loaded) {
      setDisplayName(settings.displayName);
      setAvatarUri(settings.avatarUri);
    }
  }, [loaded, settings.displayName, settings.avatarUri]);

  const handlePickImage = useCallback(async () => {
    await haptics.lightTap();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('editProfile.permissionNeeded'), t('editProfile.permissionLibrary'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, [t]);

  const handleTakePhoto = useCallback(async () => {
    await haptics.lightTap();

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('editProfile.permissionNeeded'), t('editProfile.permissionCamera'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, [t]);

  const handleChoosePhoto = useCallback(() => {
    if (Platform.OS === 'web') {
      handlePickImage();
      return;
    }

    Alert.alert(t('editProfile.changePhoto'), t('editProfile.tapPhoto'), [
      { text: t('editProfile.takePhoto'), onPress: handleTakePhoto },
      { text: t('editProfile.chooseFromLibrary'), onPress: handlePickImage },
      ...(avatarUri ? [{ text: t('editProfile.removePhoto'), style: 'destructive' as const, onPress: () => setAvatarUri(null) }] : []),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  }, [handlePickImage, handleTakePhoto, avatarUri, t]);

  const handleSave = useCallback(async () => {
    const trimmedName = displayName.trim();
    if (displayName.length > 0 && trimmedName.length === 0) {
      Alert.alert(t('common.error'), t('editProfile.enterName'));
      return;
    }

    await haptics.success();
    setIsSaving(true);

    dispatch(updateSettings({ displayName: trimmedName, avatarUri }));
    await dispatch(
      saveProfile({
        ...settings,
        displayName: trimmedName,
        avatarUri,
      }),
    );

    setIsSaving(false);
    Alert.alert(t('common.success'), t('editProfile.saved'), [
      { text: t('common.ok'), onPress: () => router.back() },
    ]);
  }, [dispatch, displayName, avatarUri, settings, t]);

  const hasChanges =
    displayName.trim() !== settings.displayName || avatarUri !== settings.avatarUri;

  const pressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const pressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const email = user?.email ?? '';
  const avatarLetter = (displayName.trim() || email).charAt(0).toUpperCase() || '?';

  return (
    <FadeInScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('editProfile.subtitle')}</Text>
          </View>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleChoosePhoto}
            activeOpacity={0.8}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>{t('editProfile.tapPhoto')}</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>{t('editProfile.displayName')}</Text>
          <TextInput
            style={styles.textInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('editProfile.enterName')}
            placeholderTextColor={colors.textMuted}
            maxLength={40}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>{t('common.email')}</Text>
          <View style={styles.readOnlyField}>
            <MaterialCommunityIcons name="lock" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <Text style={styles.readOnlyText}>{email}</Text>
          </View>
          <Text style={styles.fieldHint}>{t('editProfile.emailLocked')}</Text>

          <Text style={styles.fieldLabel}>{t('editProfile.role')}</Text>
          <View style={styles.readOnlyField}>
            <MaterialCommunityIcons name="shield-account" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <Text style={styles.readOnlyText}>
              {user?.role ? user.role.replace('ROLE_', '') : t('editProfile.defaultRole')}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={!hasChanges || isSaving}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="content-save" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>
              {isSaving ? t('editProfile.saving') : t('editProfile.save')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </FadeInScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: 60 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.xl,
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

  /* Avatar */
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(233,30,140,0.4)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(233,30,140,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(233,30,140,0.4)',
  },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: '#fff' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a0533',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  /* Form */
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  readOnlyField: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 4,
  },
  readOnlyText: { fontSize: 15, color: colors.textMuted, fontWeight: '500' },
  fieldHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },

  /* Save */
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
