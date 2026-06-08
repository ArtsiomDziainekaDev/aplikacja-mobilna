import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Language, useI18n } from '../i18n';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LANGUAGE_OPTIONS: Array<{ label: string; value: Language }> = [
  { label: 'EN', value: 'en' },
  { label: 'PL', value: 'pl' },
  { label: 'RU', value: 'ru' },
];

export default function AuthLanguageSelector(): React.JSX.Element {
  const { language, setLanguage, t } = useI18n();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('settings.language')}</Text>
      <View style={styles.options}>
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.value === language;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, isActive && styles.optionActive]}
              onPress={() => {
                if (!isActive) void setLanguage(option.value);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#fff',
  },
});
