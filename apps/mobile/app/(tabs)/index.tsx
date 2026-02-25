import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookingsScreen() {
  const { user } = useAuth();

  // This will work once tRPC is connected to a running backend
  // For now, it gracefully handles the case when the backend is unavailable
  const bookingsQuery = trpc.booking.list.useQuery(undefined, {
    retry: false,
  });

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>
          Dobrodošli{user?.name ? `, ${user.name}` : ""}
        </Text>
        {user?.salonName && (
          <Text style={styles.salonText}>{user.salonName}</Text>
        )}
      </View>

      {bookingsQuery.isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      )}

      {bookingsQuery.error && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            Nije moguće učitati rezervacije.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => bookingsQuery.refetch()}
          >
            <Text style={styles.retryText}>Pokušajte ponovo</Text>
          </Pressable>
        </View>
      )}

      {bookingsQuery.data && bookingsQuery.data.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nema rezervacija</Text>
          <Text style={styles.emptyText}>
            Vaše rezervacije će se pojaviti ovde.
          </Text>
        </View>
      )}

      {bookingsQuery.data && bookingsQuery.data.length > 0 && (
        <FlatList
          data={bookingsQuery.data}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={bookingsQuery.isRefetching}
              onRefresh={() => bookingsQuery.refetch()}
              tintColor="#111827"
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <Text style={styles.bookingTitle}>
                {item.title || "Rezervacija"}
              </Text>
              <Text style={styles.bookingMeta}>{item.attendeeName}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  welcomeCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  salonText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#111827",
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bookingCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  bookingMeta: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
});
