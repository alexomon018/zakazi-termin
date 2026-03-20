import { getTheme } from "@/lib/theme";
import { Calendar } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, useColorScheme } from "react-native";

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const colorScheme = useColorScheme();
  const mode = colorScheme === "dark" ? "dark" : "light";
  const { colors } = getTheme(mode);

  const containerOpacity = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(0.85)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [iconScale, iconOpacity]);

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
    }, 200);

    return () => clearTimeout(timeout);
  }, [isReady, containerOpacity, onFinish]);

  const isDark = mode === "dark";
  const backgroundColor = isDark ? colors.background : colors.primary;
  const iconContainerBg = isDark ? colors.primary : "rgba(255, 255, 255, 0.2)";
  const iconColor = isDark ? colors.primaryForeground : "#FFFFFF";
  const textColor = isDark ? colors.foreground : "#FFFFFF";

  return (
    <Animated.View style={[styles.container, { backgroundColor, opacity: containerOpacity }]}>
      <Animated.View
        style={[styles.content, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}
      >
        <Animated.View style={[styles.iconBox, { backgroundColor: iconContainerBg }]}>
          <Calendar size={28} color={iconColor} />
        </Animated.View>
        <Animated.Text style={[styles.title, { color: textColor }]}>Salonko</Animated.Text>
      </Animated.View>
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
  content: {
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
});
