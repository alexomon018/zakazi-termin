import { useAuth } from "@/lib/auth-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profil</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Ime</Text>
            <Text style={styles.value}>{user?.name || "—"}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || "—"}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>Salon</Text>
            <Text style={styles.value}>{user?.salonName || "—"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Odjavite se</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginLeft: 16,
  },
  label: {
    fontSize: 16,
    color: "#374151",
  },
  value: {
    fontSize: 16,
    color: "#6b7280",
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
});
