import {
  AppScreen,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  FAB,
  FilterChip,
  MoreButton,
  SearchBar,
  SectionDateHeader,
  uiStyles,
} from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { CalendarPlus, CheckCircle, Info, XCircle } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";

type FilterKey = "upcoming" | "pending" | "history";

type BookingItem = {
  id: string;
  uid: string;
  title: string | null;
  status: string;
  startTime: string | Date;
  eventType: { title: string } | null;
  attendees: { name: string | null }[];
};

function groupByDate(bookings: BookingItem[]) {
  const groups: { title: string; data: BookingItem[] }[] = [];
  const map = new Map<string, BookingItem[]>();

  for (const b of bookings) {
    const date = new Date(b.startTime).toLocaleDateString("sr-RS", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(b);
  }

  for (const [title, data] of map) {
    groups.push({ title, data });
  }
  return groups;
}

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function BookingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [search, setSearch] = useState("");
  const [activeBooking, setActiveBooking] = useState<BookingItem | null>(null);
  const [historyDate] = useState(() => startOfDay());

  const statsQuery = trpc.booking.dashboardStats.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });

  const upcomingQuery = trpc.booking.upcoming.useQuery(
    { skip: 0, take: 50 },
    { retry: false, enabled: filter === "upcoming" }
  );

  const filteredQuery = trpc.booking.listPaginated.useQuery(
    {
      skip: 0,
      take: 50,
      ...(filter === "pending" ? { status: "PENDING" as const } : {}),
      ...(filter === "history" ? { dateTo: historyDate } : {}),
    },
    { retry: false, enabled: filter !== "upcoming" }
  );

  const confirmMutation = trpc.booking.confirm.useMutation({
    onSuccess: () => invalidateAll(),
  });
  const rejectMutation = trpc.booking.reject.useMutation({
    onSuccess: () => invalidateAll(),
  });
  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => invalidateAll(),
  });

  function invalidateAll() {
    return Promise.all([
      utils.booking.upcoming.invalidate(),
      utils.booking.listPaginated.invalidate(),
      utils.booking.dashboardStats.invalidate(),
    ]);
  }

  const activeQuery = filter === "upcoming" ? upcomingQuery : filteredQuery;
  const allBookings = (activeQuery.data?.bookings ?? []) as BookingItem[];

  const bookings = useMemo(() => {
    if (!search.trim()) return allBookings;
    const q = search.toLowerCase();
    return allBookings.filter((b) => {
      const title = b.eventType?.title ?? b.title ?? "";
      const attendee = b.attendees[0]?.name ?? "";
      return title.toLowerCase().includes(q) || attendee.toLowerCase().includes(q);
    });
  }, [allBookings, search]);

  const grouped = useMemo(() => groupByDate(bookings), [bookings]);
  const flatData = useMemo(() => {
    const result: ({ type: "header"; title: string } | { type: "item"; booking: BookingItem })[] =
      [];
    for (const group of grouped) {
      result.push({ type: "header", title: group.title });
      for (const booking of group.data) {
        result.push({ type: "item", booking });
      }
    }
    return result;
  }, [grouped]);

  const handleRefresh = async () => {
    await Promise.all([statsQuery.refetch(), activeQuery.refetch()]);
  };

  const sheetActions: BottomSheetAction[] = activeBooking
    ? [
        ...(activeBooking.status === "PENDING"
          ? [
              {
                label: "Potvrdi",
                icon: <CheckCircle size={20} color={theme.colors.success} />,
                onPress: () => confirmMutation.mutate({ uid: activeBooking.uid }),
              },
              {
                label: "Odbij",
                icon: <XCircle size={20} color={theme.colors.destructive} />,
                onPress: () => rejectMutation.mutate({ uid: activeBooking.uid }),
                destructive: true,
              },
            ]
          : []),
        ...(activeBooking.status !== "CANCELLED" && activeBooking.status !== "REJECTED"
          ? [
              {
                label: "Otkaži",
                icon: <XCircle size={20} color={theme.colors.destructive} />,
                onPress: () => cancelMutation.mutate({ uid: activeBooking.uid }),
                destructive: true,
              },
            ]
          : []),
        {
          label: "Detalji",
          icon: <Info size={20} color={theme.colors.foreground} />,
          onPress: () => {},
        },
      ]
    : [];

  const statusLabel = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "Potvrđen";
      case "PENDING":
        return "Na čekanju";
      case "CANCELLED":
        return "Otkazan";
      case "REJECTED":
        return "Odbijen";
      default:
        return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return theme.colors.success;
      case "PENDING":
        return theme.colors.accent;
      case "CANCELLED":
      case "REJECTED":
        return theme.colors.destructive;
      default:
        return theme.colors.mutedForeground;
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
        listContent: { padding: theme.spacing.lg, paddingBottom: 140 },
        statsRow: { flexDirection: "row", gap: theme.spacing.sm },
        statPill: {
          flex: 1,
          alignItems: "center",
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 2,
        },
        filtersRow: { flexDirection: "row", gap: theme.spacing.sm },
        bookingItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        bookingContent: { flex: 1, gap: 2 },
        statusDot: {
          alignSelf: "flex-start",
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 2,
          borderRadius: theme.radius.full,
          marginTop: theme.spacing.xs,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: theme.spacing.xxl,
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <AppScreen>
      <FlatList
        data={flatData}
        keyExtractor={(item, index) =>
          item.type === "header" ? `h-${item.title}` : `b-${item.booking.id}`
        }
        refreshControl={
          <RefreshControl
            refreshing={statsQuery.isRefetching || activeQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[uiStyles.row, uiStyles.spaceBetween]}>
              <AppText variant="title">Termini</AppText>
            </View>

            {statsQuery.data && (
              <View style={styles.statsRow}>
                {(
                  [
                    { label: "Danas", value: statsQuery.data.todayBookings },
                    { label: "Predstojeći", value: statsQuery.data.upcomingBookings },
                    { label: "Usluge", value: statsQuery.data.eventTypes },
                  ] as const
                ).map(({ label, value }) => (
                  <View key={label} style={styles.statPill}>
                    <AppText variant="bodySm" style={{ fontWeight: "700" }}>
                      {value}
                    </AppText>
                    <AppText variant="caption" muted>
                      {label}
                    </AppText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.filtersRow}>
              {(
                [
                  { key: "upcoming", label: "Dolazeći" },
                  { key: "pending", label: "Na čekanju" },
                  { key: "history", label: "Istorija" },
                ] as const
              ).map(({ key, label }) => (
                <FilterChip
                  key={key}
                  label={label}
                  active={filter === key}
                  onPress={() => setFilter(key)}
                />
              ))}
            </View>

            <SearchBar value={search} onChangeText={setSearch} placeholder="Pretraži termine" />
          </View>
        }
        ListEmptyComponent={
          activeQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.centered}>
              <AppText variant="h2" centered>
                Nema termina
              </AppText>
              <AppText variant="bodySm" centered muted>
                Termini za izabrani filter će se pojaviti ovde.
              </AppText>
            </View>
          )
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return <SectionDateHeader title={item.title} />;
          }
          const booking = item.booking;
          const attendee = booking.attendees[0];
          const time = new Date(booking.startTime).toLocaleTimeString("sr-RS", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <View style={styles.bookingItem}>
              <View style={styles.bookingContent}>
                <AppText variant="body" style={{ fontWeight: "500" }}>
                  {booking.eventType?.title ?? booking.title ?? "Rezervacija"}
                </AppText>
                <AppText variant="bodySm" muted>
                  {attendee?.name ?? "Klijent"} · {time}
                </AppText>
                <View style={[styles.statusDot, { backgroundColor: statusColor(booking.status) }]}>
                  <AppText variant="caption" style={{ color: "#fff", fontWeight: "600" }}>
                    {statusLabel(booking.status)}
                  </AppText>
                </View>
              </View>
              <MoreButton onPress={() => setActiveBooking(booking)} />
            </View>
          );
        }}
      />

      <FAB
        onPress={() => {}}
        icon={<CalendarPlus size={20} color={theme.colors.primaryForeground} />}
        label="Zakaži termin"
      />

      <BottomSheet
        visible={!!activeBooking}
        title={activeBooking?.eventType?.title ?? activeBooking?.title ?? "Rezervacija"}
        actions={sheetActions}
        onClose={() => setActiveBooking(null)}
      />
    </AppScreen>
  );
}
