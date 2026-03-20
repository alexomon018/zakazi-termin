import {
  AppScreen,
  AppText,
  BottomSheet,
  FAB,
  QueryStateView,
  SearchBar,
  SectionDateHeader,
} from "@/components/atoms";
import { BookingListItem, BookingsFilterDropdown, filterLabel } from "@/components/molecules";
import { WEB_ORIGIN } from "@/lib/api-url";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useBookings } from "@/lib/use-bookings";
import { useMe } from "@/lib/use-me";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { CalendarDays, CalendarPlus, Menu } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { Alert, Pressable, RefreshControl, StyleSheet, View } from "react-native";

export default function BookingsScreen() {
  const { theme } = useTheme();
  useAuth();
  const meQuery = useMe();

  const {
    filter,
    setFilter,
    search,
    setSearch,
    activeBooking,
    setActiveBooking,
    filterPanelVisible,
    setFilterPanelVisible,
    flatData,
    activeQuery,
    statsQuery,
    sheetActions,
    handleRefresh,
  } = useBookings();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          gap: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        },
        topRow: { flexDirection: "row", justifyContent: "flex-end" },
        topControls: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        },
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
        listContent: { padding: theme.spacing.lg, paddingBottom: 140 },
        emptyIconWrap: {
          width: 84,
          height: 84,
          borderRadius: 42,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.primaryTint,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: theme.spacing.md,
        },
      }),
    [theme]
  );

  const emptyIcon = (
    <View style={styles.emptyIconWrap}>
      <CalendarDays size={34} color={theme.colors.primary} />
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: NonNullable<typeof flatData>[number] }) => {
      if (item.type === "header") {
        return <SectionDateHeader title={item.title} />;
      }
      const booking = item.booking;
      const time = new Date(booking.startTime).toLocaleTimeString("sr-RS", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return (
        <BookingListItem
          title={booking.eventType?.title ?? booking.title ?? "Rezervacija"}
          attendeeName={booking.attendees[0]?.name ?? "Klijent"}
          time={time}
          status={booking.status}
          onPress={() => router.push(`/booking/${booking.uid}`)}
          onMorePress={() => setActiveBooking(booking)}
        />
      );
    },
    [setActiveBooking]
  );

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.topControls}>
            <Pressable style={styles.filterPill} onPress={() => setFilterPanelVisible(true)}>
              <AppText variant="h2" style={{ fontWeight: "700" }}>
                {filterLabel(filter)}
              </AppText>
            </Pressable>
          </View>
        </View>
        <AppText variant="title">Zakazivanja</AppText>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Pretraži zakazivanja" />
      </View>
      <FlashList
        data={flatData}
        keyExtractor={(item) =>
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
        getItemType={(item) => item.type}
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
          ) : search.trim() ? (
            <QueryStateView
              state="empty"
              variant="inline"
              icon={emptyIcon}
              title="Nema rezultata"
              message="Nema zakazivanja koja odgovaraju vašoj pretrazi."
            />
          ) : (
            <QueryStateView
              state="empty"
              variant="inline"
              icon={emptyIcon}
              title="Nema zakazivanja"
              message="Čim neko zakaže termin kod vas, pojaviće se ovde."
            />
          )
        }
        renderItem={renderItem}
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

      <BookingsFilterDropdown
        visible={filterPanelVisible}
        selected={filter}
        onSelect={(key) => {
          setFilter(key);
          setFilterPanelVisible(false);
        }}
        onClose={() => setFilterPanelVisible(false)}
      />
    </AppScreen>
  );
}
