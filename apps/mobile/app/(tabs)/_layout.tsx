import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Rezervacije",
          tabBarLabel: "Rezervacije",
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Usluge",
          tabBarLabel: "Usluge",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Podešavanja",
          tabBarLabel: "Podešavanja",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    paddingTop: 4,
    height: Platform.OS === "ios" ? 88 : 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
});
