import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, ViewStyle } from 'react-native';

type FadeInScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
  translateY?: number;
};

const isWeb = Platform.OS === 'web';

export default function FadeInScreen({
  children,
  style,
  duration = 280,
  translateY = 12,
}: FadeInScreenProps): React.JSX.Element {
  const opacity = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const offsetY = useRef(new Animated.Value(isWeb ? 0 : translateY)).current;

  useEffect(() => {
    if (isWeb) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(offsetY, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, opacity, offsetY]);

  if (isWeb) {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [{ translateY: offsetY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
