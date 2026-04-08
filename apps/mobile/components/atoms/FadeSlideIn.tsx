import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, type ViewStyle } from "react-native";

interface FadeSlideInProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Fades and slides children up subtly every time the surrounding screen
 * gains focus. Intended as a lightweight tab-transition effect that needs
 * no navigator changes and no extra dependencies. Honors the OS
 * "Reduce Motion" accessibility setting by snapping to the final state.
 */
export function FadeSlideIn({
  children,
  style,
  duration = 280,
  offset = 12,
  enabled = true,
}: FadeSlideInProps) {
  const progress = useRef(new Animated.Value(enabled ? 0 : 1)).current;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        progress.setValue(1);
        return;
      }

      let cancelled = false;
      progress.setValue(0);

      AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          progress.setValue(1);
          return;
        }
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });

      return () => {
        cancelled = true;
      };
    }, [progress, duration, enabled])
  );

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
  });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
