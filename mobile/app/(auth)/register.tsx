import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/hooks/useRedux';
import { register, clearError } from '../../src/store/slices/authSlice';
import { useConnectivity } from '../../src/hooks/useConnectivity';
import haptics from '../../src/utils/haptics';
import FadeInScreen from '../../src/components/FadeInScreen';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { isTranslationKey, useI18n } from '../../src/i18n';

const { width } = Dimensions.get('window');

export default function RegisterScreen(): React.JSX.Element {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const isConnected = useConnectivity();
  const { t } = useI18n();
  const errorText = error && isTranslationKey(error) ? t(error) : error;

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(16)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  const handleRegister = useCallback(async () => {
    await haptics.lightTap();
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }
    if (!isConnected) {
      Alert.alert(t('common.noConnection'), t('auth.checkConnection'));
      return;
    }
    dispatch(clearError());
    const result = await dispatch(register({ username: username.trim(), email: email.trim(), password }));
    if (register.fulfilled.match(result)) {
      Alert.alert(t('common.success'), t('auth.accountCreated'), [
        { text: t('common.ok'), onPress: () => router.replace('/(auth)/login') },
      ]);
    }
  }, [username, email, password, dispatch, isConnected, t]);

  const pressIn = (): void => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const pressOut = (): void => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
      <FadeInScreen>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
          <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
          >
            <Animated.View
                style={[
                  styles.card,
                  { width: width > 400 ? 360 : width - spacing.lg * 2 },
                  {
                    opacity: cardOpacity,
                    transform: [{ translateY: cardTranslateY }],
                  },
                ]}
            >
              <Text style={styles.title}>{t('auth.createAccount')}</Text>
              {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
              <TextInput
                  style={styles.input}
                  placeholder={t('common.username')}
                  placeholderTextColor={colors.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  editable={!loading}
              />
              <TextInput
                  style={styles.input}
                  placeholder={t('common.email')}
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
              />
              <TextInput
                  style={styles.input}
                  placeholder={t('auth.passwordMin')}
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
              />
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    onPressIn={pressIn}
                    onPressOut={pressOut}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                  <Text style={styles.buttonText}>{loading ? t('auth.signingUp') : t('auth.createAccount')}</Text>
                </TouchableOpacity>
              </Animated.View>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity
                    style={styles.link}
                    onPress={async () => {
                      await haptics.lightTap();
                    }}
                    activeOpacity={0.85}
                >
                  <Text style={styles.linkText}>{t('auth.alreadyHaveAccount')}</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </FadeInScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.secondary,
    fontSize: 14,
  },
});
