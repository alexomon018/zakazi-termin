import {
  AppScreen,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  FAB,
  MoreButton,
  QueryStateView,
  SearchBar,
  SectionDateHeader,
} from "@/components/atoms";
import { API_URL, WEB_ORIGIN } from "@/lib/api-url";
import { useAuth } from "@/lib/auth-context";
import { statusColor, statusLabel } from "@/lib/booking-status";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useMe } from "@/lib/use-me";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { CalendarDays, CalendarPlus, CheckCircle, Info, Menu, XCircle } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, View } from "react-native";

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
  useAuth();
  const utils = trpc.useUtils();
  const meQuery = useMe();
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [search, setSearch] = useState("");
  const [activeBooking, setActiveBooking] = useState<BookingItem | null>(null);
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
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
    onSuccess: () => {
      setActiveBooking(null);
      invalidateAll();
    },
    onError: (error) => {
      setActiveBooking(null);
      Alert.alert("Greška", error.message || "Nije moguće potvrditi termin.");
    },
  });
  const rejectMutation = trpc.booking.reject.useMutation({
    onSuccess: () => {
      setActiveBooking(null);
      invalidateAll();
    },
    onError: (error) => {
      setActiveBooking(null);
      Alert.alert("Greška", error.message || "Nije moguće odbiti termin.");
    },
  });
  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      setActiveBooking(null);
      invalidateAll();
    },
    onError: (error) => {
      setActiveBooking(null);
      Alert.alert("Greška", error.message || "Nije moguće otkazati termin.");
    },
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

  const MODAL_DISMISS_DELAY = 350;

  const openBookingDetails = (uid: string) => {
    if (!uid) return;
    const url = `${API_URL}/booking/${encodeURIComponent(uid)}`;
    // Delay browser open so the BottomSheet modal fully dismisses first.
    // Opening WebBrowser while a Modal is animating out causes a freeze.
    setTimeout(() => WebBrowser.openBrowserAsync(url), MODAL_DISMISS_DELAY);
  };

  const handleRefresh = async () => {
    await Promise.all([statsQuery.refetch(), activeQuery.refetch()]);
  };

  const isMutating =
    confirmMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  const sheetActions: BottomSheetAction[] = activeBooking
    ? [
        ...(activeBooking.status === "PENDING"
          ? [
              {
                label: "Potvrdi",
                icon: <CheckCircle size={20} color={theme.colors.success} />,
                onPress: () => confirmMutation.mutate({ uid: activeBooking.uid }),
                disabled: isMutating,
              },
              {
                label: "Odbij",
                icon: <XCircle size={20} color={theme.colors.destructive} />,
                onPress: () => rejectMutation.mutate({ uid: activeBooking.uid }),
                destructive: true,
                disabled: isMutating,
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
                disabled: isMutating,
              },
            ]
          : []),
        {
          label: "Detalji",
          icon: <Info size={20} color={theme.colors.foreground} />,
          onPress: () => openBookingDetails(activeBooking.uid),
        },
      ]
    : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
        topRow: { flexDirection: "row", justifyContent: "flex-end" },
        topControls: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
        menuButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        filterPill: {
          height: 44,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        },
        title: {},
        filterOverlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.15)",
        },
        filterPanelWrap: {
          position: "absolute",
          top: 104,
          right: theme.spacing.lg,
          left: theme.spacing.xl * 2,
        },
        filterPanel: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          ...theme.shadow.md,
        },
        filterPanelTitle: {
          marginBottom: theme.spacing.sm,
        },
        filterOption: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: theme.radius.md,
          paddingVertical: 10,
          paddingHorizontal: 8,
        },
        listContent: { padding: theme.spacing.lg, paddingBottom: 140 },
        bookingItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: theme.spacing.md,
        },
        bookingContent: { flex: 1, gap: 3 },
        statusBadge: {
          alignSelf: "flex-start",
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          borderWidth: 1,
          marginTop: 4,
        },
        cardContainer: {
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          overflow: "hidden",
          marginBottom: theme.spacing.sm,
        },
        separator: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
          marginLeft: 16,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: theme.spacing.xxl,
          gap: theme.spacing.sm,
        },
        emptyIconWrap: {
          width: 84,
          height: 84,
          borderRadius: 42,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: theme.spacing.md,
        },
        emptyTitle: {
          marginBottom: theme.spacing.xs,
          maxWidth: 290,
          lineHeight: 32,
        },
        emptyMessage: { maxWidth: 300 },
      }),
    [theme]
  );

  const filterLabel = (value: FilterKey) => {
    switch (value) {
      case "upcoming":
        return "Dolazeći";
      case "pending":
        return "Na čekanju";
      case "history":
        return "Istorija";
      default:
        return value;
    }
  };

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: "upcoming", label: "Dolazeći" },
    { key: "pending", label: "Na čekanju" },
    { key: "history", label: "Istorija" },
  ];

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
            <View style={styles.topRow}>
              <View style={styles.topControls}>
                <Pressable
                  style={styles.menuButton}
                  onPress={() => router.push("/(tabs)/settings")}
                >
                  <Menu size={20} color={theme.colors.foreground} />
                </Pressable>
                <Pressable style={styles.filterPill} onPress={() => setFilterPanelVisible(true)}>
                  <AppText variant="h2" style={{ fontWeight: "700" }}>
                    {filterLabel(filter)}
                  </AppText>
                </Pressable>
              </View>
            </View>
            <AppText variant="title" style={styles.title}>
              Zakazivanja
            </AppText>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Pretraži zakazivanja" />
          </View>
        }
        ListEmptyComponent={
          activeQuery.isLoading ? (
            <QueryStateView state="loading" variant="inline" />
          ) : activeQuery.isError && !activeQuery.data ? (
            <QueryStateView
              state="error"
              variant="inline"
              message="Došlo je do greške prilikom učitavanja zakazivanja."
              onRetry={() => activeQuery.refetch()}
            />
          ) : (
            <View style={styles.centered}>
              <View style={styles.emptyIconWrap}>
                <CalendarDays size={34} color={theme.colors.mutedForeground} />
              </View>
              <AppText variant="title" centered style={styles.emptyTitle}>
                Nema zakazivanja
              </AppText>
              <AppText variant="body" centered muted style={styles.emptyMessage}>
                Čim neko zakaže termin kod vas, pojaviće se ovde.
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
          const color = statusColor(booking.status, theme);
          return (
            <View style={styles.bookingItem}>
              <View style={styles.bookingContent}>
                <AppText variant="body" style={{ fontWeight: "600" }}>
                  {booking.eventType?.title ?? booking.title ?? "Rezervacija"}
                </AppText>
                <AppText variant="bodySm" muted>
                  {attendee?.name ?? "Klijent"} · {time}
                </AppText>
                <View style={[styles.statusBadge, { borderColor: color }]}>
                  <AppText variant="caption" style={{ color, fontWeight: "600" }}>
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
        onPress={() => {
          const salonSlug = meQuery.data?.salonSlug;
          if (!salonSlug) {
            Alert.alert("Informacija", "Za zakazivanje termina koristite stranicu za rezervacije.");
            return;
          }
          WebBrowser.openBrowserAsync(`${WEB_ORIGIN}/${encodeURIComponent(salonSlug)}`);
        }}
        icon={<CalendarPlus size={20} color={theme.colors.primaryForeground} />}
        label="Zakaži termin"
      />

      <BottomSheet
        visible={!!activeBooking}
        title={activeBooking?.eventType?.title ?? activeBooking?.title ?? "Rezervacija"}
        actions={sheetActions}
        onClose={() => setActiveBooking(null)}
      />
      <Modal
        visible={filterPanelVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterPanelVisible(false)}
      >
        <Pressable style={styles.filterOverlay} onPress={() => setFilterPanelVisible(false)} />
        <View style={styles.filterPanelWrap} pointerEvents="box-none">
          <View style={styles.filterPanel}>
            <AppText variant="body" muted style={styles.filterPanelTitle}>
              Filtriraj po statusu
            </AppText>
            {filterOptions.map((option) => {
              const selected = option.key === filter;
              return (
                <Pressable
                  key={option.key}
                  style={styles.filterOption}
                  onPress={() => {
                    setFilter(option.key);
                    setFilterPanelVisible(false);
                  }}
                >
                  <AppText variant="h2">{option.label}</AppText>
                  {selected && <CheckCircle size={18} color={theme.colors.foreground} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
