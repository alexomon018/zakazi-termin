import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useEnsureTrial } from "@/lib/use-ensure-trial";

import { Redirect, Tabs } from "expo-router";
import { CalendarDays, Clock, Link2, MoreHorizontal } from "lucide-react-native";
import { ActivityIndicator, Platform, View } from "react-native";

export default function TabsLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const { isLoading: isTrialLoading } = useEnsureTrial();
  const { theme } = useTheme();

  if (isLoading || isTrialLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
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
