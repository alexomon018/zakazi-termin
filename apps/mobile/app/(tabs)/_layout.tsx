import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useEnsureTrial } from "@/lib/use-ensure-trial";
import { Redirect, Tabs } from "expo-router";
import { CalendarDays, Clock, Link2, MoreHorizontal } from "lucide-react-native";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

export default function TabsLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const { isReady, isLoading: isTrialLoading } = useEnsureTrial();
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

  if (!isReady) {
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.foreground,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 4,
          height: Platform.OS === "ios" ? 86 : 62,
          position: "absolute",
          left: 0,
          right: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginBottom: Platform.OS === "ios" ? 2 : 6,
        },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Usluge",
          tabBarLabel: "Usluge",
          tabBarIcon: ({ color, size }) => <Link2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Termini",
          tabBarLabel: "Termini",
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Dostupnost",
          tabBarLabel: "Dostupnost",
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
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
