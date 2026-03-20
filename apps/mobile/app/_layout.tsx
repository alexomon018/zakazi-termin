import { AnimatedSplash, ErrorBoundary } from "@/components/atoms";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { initErrorReporting } from "@/lib/error-reporting";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { TRPCProvider } from "@/lib/trpc";
import { Lato_400Regular, Lato_700Bold, Lato_900Black } from "@expo-google-fonts/lato";
import {
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from "@expo-google-fonts/open-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

SplashScreen.preventAutoHideAsync();

initErrorReporting();

function RootLayoutNav() {
  const { isLoading } = useAuth();
  const { theme, colorScheme } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
    Lato_900Black,
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });
  const [showSplash, setShowSplash] = useState(true);

  const isReady = !isLoading && (fontsLoaded || !!fontError);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <View style={rootStyles.container}>
      {isReady && (
        <>
          <Stack
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.foreground,
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="event-type/new" options={{ headerShown: false }} />
            <Stack.Screen name="event-type/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="schedule/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="setting/profile" options={{ headerShown: false }} />
            <Stack.Screen name="setting/appearance" options={{ headerShown: false }} />
            <Stack.Screen name="setting/out-of-office" options={{ headerShown: false }} />
            <Stack.Screen name="setting/calendar" options={{ headerShown: false }} />
            <Stack.Screen name="setting/team" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </>
      )}
      {showSplash && <AnimatedSplash isReady={isReady} onFinish={handleSplashFinish} />}
    </View>
  );
}

const rootStyles = StyleSheet.create({
  container: { flex: 1 },
});

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <TRPCProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <RootLayoutNav />
          </ErrorBoundary>
        </ThemeProvider>
      </TRPCProvider>
    </AuthProvider>
  );
}
