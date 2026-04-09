import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'warning' | 'success' | 'error';

export function useHaptics() {
  const trigger = async (type: HapticType): Promise<void> => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch {
      // Haptics are not available on web — silently ignore
    }
  };

  return { trigger };
}
