import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { TRPCProvider } from "@/lib/trpc";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading } = useAuth();
  const { theme, colorScheme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
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
        <Stack.Screen
          name="event-type/new"
          options={{ headerShown: true, title: "Nova usluga", headerBackTitle: "Usluge" }}
        />
        <Stack.Screen
          name="event-type/[id]"
          options={{ headerShown: true, title: "Uredi uslugu", headerBackTitle: "Usluge" }}
        />
        <Stack.Screen
          name="schedule/[id]"
          options={{ headerShown: true, title: "Uredi raspored", headerBackTitle: "Dostupnost" }}
        />
        <Stack.Screen
          name="setting/profile"
          options={{ headerShown: true, title: "Profil", headerBackTitle: "Više" }}
        />
        <Stack.Screen
          name="setting/appearance"
          options={{ headerShown: true, title: "Izgled", headerBackTitle: "Više" }}
        />
        <Stack.Screen
          name="setting/out-of-office"
          options={{ headerShown: true, title: "Odsustvo", headerBackTitle: "Više" }}
        />
        <Stack.Screen
          name="setting/calendar"
          options={{ headerShown: true, title: "Kalendar", headerBackTitle: "Više" }}
        />
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
