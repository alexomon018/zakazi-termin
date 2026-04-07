import { useAuth } from "@/lib/auth-context";
import { clearSession } from "@/lib/session-cache-registry";
import { useTheme } from "@/lib/theme-context";
import { useMe } from "@/lib/use-me";

import { Tabs, router, useSegments } from "expo-router";
import { CalendarDays, Clock, Link2, MoreHorizontal } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

export default function TabsLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const meQuery = useMe();
  const segments = useSegments();

  useEffect(() => {
    if (!isAuthenticated || meQuery.isLoading) return;
    const data = meQuery.data;
    if (!data) {
      clearSession();
      return;
    }

    const isOwner = data.membership?.role === "OWNER";
    const missingName = !data.name?.trim();
    const missingSalonName = isOwner && !data.salonName?.trim();

    const currentPath = `/${segments.join("/")}`;
    if ((missingName || missingSalonName) && !currentPath.startsWith("/setting/profile")) {
      router.replace("/setting/profile");
    }
  }, [isAuthenticated, meQuery.isLoading, meQuery.data, segments]);

  const loadingStyle = useMemo(
    () => ({
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      backgroundColor: theme.colors.background,
    }),
    [theme.colors.background]
  );

  if (isLoading || meQuery.isLoading) {
    return (
      <View style={loadingStyle}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.foreground,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "600", fontSize: 17 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: 4,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginBottom: Platform.OS === "ios" ? 0 : 8,
        },
        tabBarItemStyle: { paddingTop: 3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Termini",
          tabBarLabel: "Termini",
          tabBarIcon: ({ color, size }) => <Link2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          headerShown: false,
          title: "Zakazivanja",
          tabBarLabel: "Zakazivanja",
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          headerShown: false,
          title: "Dostupnost",
          tabBarLabel: "Dostupnost",
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: "Više",
          tabBarLabel: "Više",
          tabBarIcon: ({ color, size }) => <MoreHorizontal size={size} color={color} />,
        }}
      />
      {/* Hidden tabs — these files exist but are not shown in tab bar */}
      <Tabs.Screen name="events" options={{ href: null }} />
    </Tabs>
  );
}
