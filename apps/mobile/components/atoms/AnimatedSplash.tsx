import { useTheme } from "@/lib/theme-context";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import animation from "../../hair-saloon-animation.json";

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
  backgroundColor?: string;
}

export function AnimatedSplash({ isReady, onFinish, backgroundColor }: AnimatedSplashProps) {
  const { theme } = useTheme();
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const animationFinished = useRef(false);
  const readyRef = useRef(isReady);
  readyRef.current = isReady;

  const fadeOut = useCallback(() => {
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinish();
    });
  }, [containerOpacity, onFinish]);

  const handleAnimationFinish = useCallback(() => {
    animationFinished.current = true;
    if (readyRef.current) fadeOut();
  }, [fadeOut]);

  useEffect(() => {
    if (isReady && animationFinished.current) fadeOut();
  }, [isReady, fadeOut]);

  const splashBackgroundColor = backgroundColor ?? theme.colors.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: splashBackgroundColor, opacity: containerOpacity },
      ]}
    >
      <LottieView
        source={animation}
        autoPlay
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        style={styles.animation}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  animation: {
    width: 250,
    height: 250,
  },
});
