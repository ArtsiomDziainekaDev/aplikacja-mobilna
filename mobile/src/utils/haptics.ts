import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

async function runImpact(style: Haptics.ImpactFeedbackStyle): Promise<void> {
  if (!isSupported) return;
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Silently ignore haptic failures - UX enhancement only.
  }
}

async function runNotification(type: Haptics.NotificationFeedbackType): Promise<void> {
  if (!isSupported) return;
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // Silently ignore haptic failures - UX enhancement only.
  }
}

export const haptics = {
  lightTap: () => runImpact(Haptics.ImpactFeedbackStyle.Light),
  mediumTap: () => runImpact(Haptics.ImpactFeedbackStyle.Medium),
  heavyTap: () => runImpact(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => runNotification(Haptics.NotificationFeedbackType.Success),
  warning: () => runNotification(Haptics.NotificationFeedbackType.Warning),
  error: () => runNotification(Haptics.NotificationFeedbackType.Error),
};

export default haptics;