import LottieView from "lottie-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import animation from "../../hair-saloon-animation.json";

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    lottieRef.current?.play();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const timeout = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isReady, containerOpacity, onFinish]);

  const backgroundColor = "#BA3678";

  return (
    <Animated.View style={[styles.container, { backgroundColor, opacity: containerOpacity }]}>
      <LottieView
        ref={lottieRef}
        source={animation}
        autoPlay
        loop={false}
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
