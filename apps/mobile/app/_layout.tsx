import { AuthProvider, useAuth } from "@/lib/auth-context";
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
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading } = useAuth();
  const { theme, colorScheme } = useTheme();
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
    Lato_900Black,
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return null;
  }

  return (
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
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TRPCProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </TRPCProvider>
    </AuthProvider>
  );
}
