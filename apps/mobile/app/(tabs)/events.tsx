import { trpc } from "@/lib/trpc";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EventsScreen() {
  const eventsQuery = trpc.eventType.list.useQuery(undefined, {
    retry: false,
  });

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {eventsQuery.isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      )}

      {eventsQuery.data && eventsQuery.data.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nema usluga</Text>
          <Text style={styles.emptyText}>
            Kreirajte usluge na veb aplikaciji da bi se pojavile ovde.
          </Text>
        </View>
      )}

      {eventsQuery.data && eventsQuery.data.length > 0 && (
        <FlatList
          data={eventsQuery.data}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={eventsQuery.isRefetching}
              onRefresh={() => eventsQuery.refetch()}
              tintColor="#111827"
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDuration}>{item.length} min</Text>
              </View>
              {item.description && (
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
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
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  eventDuration: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
});
