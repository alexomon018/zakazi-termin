import type { BottomSheetAction } from "@/components/atoms";
import type { FilterKey } from "@/components/molecules/BookingsFilterDropdown";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { CheckCircle, Info, RefreshCw, XCircle } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert } from "react-native";

export type BookingItem = {
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

const MODAL_DISMISS_DELAY = 350;

export function useBookings() {
  const { theme } = useTheme();
  const utils = trpc.useUtils();

  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [search, setSearch] = useState("");
  const [activeBooking, setActiveBooking] = useState<BookingItem | null>(null);
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const [historyDate] = useState(startOfDay);

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

  function invalidateAll() {
    return Promise.all([
      utils.booking.upcoming.invalidate(),
      utils.booking.listPaginated.invalidate(),
      utils.booking.dashboardStats.invalidate(),
    ]);
  }

  function mutationCallbacks(errorMessage: string) {
    return {
      onSuccess: () => {
        setActiveBooking(null);
        invalidateAll();
      },
      onError: (error: { message?: string }) => {
        setActiveBooking(null);
        Alert.alert("Greška", error.message || errorMessage);
      },
    };
  }

  const confirmMutation = trpc.booking.confirm.useMutation(
    mutationCallbacks("Nije moguće potvrditi termin.")
  );
  const rejectMutation = trpc.booking.reject.useMutation(
    mutationCallbacks("Nije moguće odbiti termin.")
  );
  const cancelMutation = trpc.booking.cancel.useMutation(
    mutationCallbacks("Nije moguće otkazati termin.")
  );

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

  const openBookingDetails = (uid: string) => {
    if (!uid) return;
    setTimeout(() => router.push(`/booking/${uid}`), MODAL_DISMISS_DELAY);
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
                icon: React.createElement(CheckCircle, {
                  size: 20,
                  color: theme.colors.success,
                }),
                onPress: () => confirmMutation.mutate({ uid: activeBooking.uid }),
                disabled: isMutating,
              },
              {
                label: "Odbij",
                icon: React.createElement(XCircle, {
                  size: 20,
                  color: theme.colors.destructive,
                }),
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
                icon: React.createElement(XCircle, {
                  size: 20,
                  color: theme.colors.destructive,
                }),
                onPress: () => cancelMutation.mutate({ uid: activeBooking.uid }),
                destructive: true,
                disabled: isMutating,
              },
            ]
          : []),
        ...(activeBooking.status !== "CANCELLED" && activeBooking.status !== "REJECTED"
          ? [
              {
                label: "Promeni termin",
                icon: React.createElement(RefreshCw, {
                  size: 20,
                  color: theme.colors.foreground,
                }),
                onPress: () => openBookingDetails(activeBooking.uid),
                disabled: isMutating,
              },
            ]
          : []),
        {
          label: "Detalji",
          icon: React.createElement(Info, { size: 20, color: theme.colors.foreground }),
          onPress: () => openBookingDetails(activeBooking.uid),
        },
      ]
    : [];

  return {
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
  };
}
