"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Button,
  CancelBookingDialog,
  Card,
  CardContent,
  DateTimeDisplay,
  LocationDisplay,
  RejectBookingDialog,
  StatusBadge,
  TabFilter,
  TimeRangeDisplay,
  UserAvatar,
  UserInfoDisplay,
} from "@salonko/ui";
import { Calendar, Check, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import type { RouterOutputs } from "@salonko/trpc";

type BookingFilter = "upcoming" | "pending" | "past" | "cancelled";
type Booking = RouterOutputs["booking"]["list"][number];

type BookingsClientProps = {
  initialBookings: Booking[];
  initialTotal: number;
  initialFilter?: BookingFilter;
};

const ITEMS_PER_PAGE = 5;

export function BookingsClient({
  initialBookings,
  initialTotal,
  initialFilter = "upcoming",
}: BookingsClientProps) {
  const [filter, setFilter] = useState<BookingFilter>(initialFilter);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBookingUid, setSelectedBookingUid] = useState<string | null>(null);

  // Track displayed bookings and pagination per filter
  const [bookingsPerFilter, setBookingsPerFilter] = useState<Record<BookingFilter, Booking[]>>({
    upcoming: initialFilter === "upcoming" ? initialBookings : [],
    pending: initialFilter === "pending" ? initialBookings : [],
    past: initialFilter === "past" ? initialBookings : [],
    cancelled: initialFilter === "cancelled" ? initialBookings : [],
  });

  const [totalsPerFilter, setTotalsPerFilter] = useState<Record<BookingFilter, number>>({
    upcoming: initialFilter === "upcoming" ? initialTotal : 0,
    pending: initialFilter === "pending" ? initialTotal : 0,
    past: initialFilter === "past" ? initialTotal : 0,
    cancelled: initialFilter === "cancelled" ? initialTotal : 0,
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingFilter, setIsLoadingFilter] = useState(false);

  const utils = trpc.useUtils();

  // Get query params for a specific filter
  const getQueryParams = useCallback((filterType: BookingFilter, skip = 0) => {
    const now = new Date();
    switch (filterType) {
      case "upcoming":
        return { dateFrom: now, status: "ACCEPTED" as const, skip, take: ITEMS_PER_PAGE };
      case "pending":
        return { status: "PENDING" as const, skip, take: ITEMS_PER_PAGE };
      case "past":
        return { dateTo: now, status: "ACCEPTED" as const, skip, take: ITEMS_PER_PAGE };
      case "cancelled":
        return { status: "CANCELLED" as const, skip, take: ITEMS_PER_PAGE };
      default:
        return { skip, take: ITEMS_PER_PAGE };
    }
  }, []);

  // Current bookings and hasMore for active filter
  const currentBookings = bookingsPerFilter[filter];
  const currentTotal = totalsPerFilter[filter];
  const hasMore = currentBookings.length < currentTotal;

  // Query for loading more or changing filters
  const { refetch } = trpc.booking.listPaginated.useQuery(
    getQueryParams(filter, currentBookings.length),
    {
      enabled: false,
      refetchOnWindowFocus: false,
    }
  );

  const handleFilterChange = async (newFilter: BookingFilter) => {
    if (newFilter === filter) return;

    // If we already have data for this filter, just switch
    if (bookingsPerFilter[newFilter].length > 0) {
      setFilter(newFilter);
      return;
    }

    // Otherwise, fetch data for the new filter
    setIsLoadingFilter(true);
    setFilter(newFilter);

    try {
      const result = await utils.booking.listPaginated.fetch(getQueryParams(newFilter, 0));
      if (result) {
        setBookingsPerFilter((prev) => ({
          ...prev,
          [newFilter]: result.bookings,
        }));
        setTotalsPerFilter((prev) => ({
          ...prev,
          [newFilter]: result.total,
        }));
      }
    } finally {
      setIsLoadingFilter(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const result = await utils.booking.listPaginated.fetch(
        getQueryParams(filter, currentBookings.length)
      );
      if (result) {
        setBookingsPerFilter((prev) => ({
          ...prev,
          [filter]: [...prev[filter], ...result.bookings],
        }));
        setTotalsPerFilter((prev) => ({
          ...prev,
          [filter]: result.total,
        }));
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Invalidate and refresh current filter data
  const refreshCurrentFilter = async () => {
    setIsLoadingFilter(true);
    try {
      const result = await utils.booking.listPaginated.fetch(getQueryParams(filter, 0));
      if (result) {
        setBookingsPerFilter((prev) => ({
          ...prev,
          [filter]: result.bookings,
        }));
        setTotalsPerFilter((prev) => ({
          ...prev,
          [filter]: result.total,
        }));
      }
      // Clear other filters so they refresh on next visit
      setBookingsPerFilter((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(updated) as BookingFilter[]) {
          if (key !== filter) {
            updated[key] = [];
          }
        }
        return updated;
      });
      setTotalsPerFilter((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(updated) as BookingFilter[]) {
          if (key !== filter) {
            updated[key] = 0;
          }
        }
        return updated;
      });
    } finally {
      setIsLoadingFilter(false);
    }
  };

  const confirmBooking = trpc.booking.confirm.useMutation({
    onSuccess: refreshCurrentFilter,
  });

  const rejectBooking = trpc.booking.reject.useMutation({
    onSuccess: refreshCurrentFilter,
  });

  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: refreshCurrentFilter,
  });

  const handleConfirm = (uid: string) => {
    confirmBooking.mutate({ uid });
  };

  const handleRejectClick = (uid: string) => {
    setSelectedBookingUid(uid);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = (reason?: string) => {
    if (selectedBookingUid) {
      rejectBooking.mutate({ uid: selectedBookingUid, reason });
      setRejectDialogOpen(false);
      setSelectedBookingUid(null);
    }
  };

  const handleCancelClick = (uid: string) => {
    setSelectedBookingUid(uid);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = (reason?: string) => {
    if (selectedBookingUid) {
      cancelBooking.mutate({ uid: selectedBookingUid, reason });
      setCancelDialogOpen(false);
      setSelectedBookingUid(null);
    }
  };

  const filters: { key: BookingFilter; label: string }[] = [
    { key: "upcoming", label: "Predstojeći" },
    { key: "pending", label: "Na čekanju" },
    { key: "past", label: "Prošli" },
    { key: "cancelled", label: "Otkazani" },
  ];

  const getEmptyMessage = () => {
    switch (filter) {
      case "upcoming":
        return "Nemate predstojećih termina.";
      case "pending":
        return "Nemate termina na čekanju.";
      case "past":
        return "Nemate prošlih termina.";
      case "cancelled":
        return "Nemate otkazanih termina.";
      default:
        return "Nema termina.";
    }
  };

  const isLoading = isLoadingFilter && currentBookings.length === 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Termini</h1>
          <p className="text-muted-foreground mt-1">Upravljajte zakazanim terminima</p>
        </div>

        {/* Filters */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 border-b border-gray-200 dark:border-border pb-4 min-w-max sm:min-w-0">
            {filters.map((f) => (
              <TabFilter
                key={f.key}
                label={f.label}
                isActive={filter === f.key}
                onClick={() => handleFilterChange(f.key)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Učitavanje...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Termini</h1>
        <p className="text-muted-foreground mt-1">Upravljajte zakazanim terminima</p>
      </div>

      {/* Filters */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 border-b border-gray-200 dark:border-border pb-4 min-w-max sm:min-w-0">
          {filters.map((f) => (
            <TabFilter
              key={f.key}
              label={f.label}
              isActive={filter === f.key}
              onClick={() => handleFilterChange(f.key)}
            />
          ))}
        </div>
      </div>

      {/* Bookings list */}
      {currentBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar
              className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="text-muted-foreground">{getEmptyMessage()}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentBookings.map((booking: Booking) => (
            <Card key={booking.id}>
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Title and status */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{booking.title}</h3>
                        <StatusBadge
                          status={
                            booking.status as "PENDING" | "ACCEPTED" | "CANCELLED" | "REJECTED"
                          }
                        />
                      </div>

                      {/* Event type and staff */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {booking.eventType && (
                          <p className="text-sm text-muted-foreground">{booking.eventType.title}</p>
                        )}
                        {(booking.assignedHost?.name || booking.user?.name) && (
                          <span className="text-xs text-muted-foreground/70 bg-muted px-2 py-0.5 rounded">
                            {booking.assignedHost?.name || booking.user?.name}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <DateTimeDisplay date={booking.startTime} />
                        <TimeRangeDisplay startTime={booking.startTime} endTime={booking.endTime} />
                        {booking.location && <LocationDisplay location={booking.location} />}
                      </div>

                      {/* Attendees */}
                      {booking.attendees && booking.attendees.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2">GOST</p>
                          {booking.attendees.map(
                            (attendee: {
                              id: string;
                              name: string;
                              email: string;
                              phoneNumber: string | null;
                            }) => (
                              <div key={attendee.id} className="flex items-center gap-2">
                                <UserAvatar name={attendee.name} />
                                <UserInfoDisplay name={attendee.name} email={attendee.email} />
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Notes/description */}
                      {booking.description && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">NAPOMENA</p>
                          <p className="text-sm text-muted-foreground">{booking.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {booking.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(booking.uid)}
                            disabled={confirmBooking.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="w-4 h-4 mr-1" aria-hidden="true" />
                            Potvrdi
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectClick(booking.uid)}
                            disabled={rejectBooking.isPending}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="w-4 h-4 mr-1" aria-hidden="true" />
                            Odbij
                          </Button>
                        </>
                      )}
                      {booking.status === "ACCEPTED" && new Date(booking.endTime) > new Date() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelClick(booking.uid)}
                          disabled={cancelBooking.isPending}
                          className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                        >
                          Otkaži
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer with booking UID */}
                <div className="bg-gray-50 dark:bg-muted/50 px-4 py-2 text-xs text-muted-foreground rounded-b-lg">
                  Referenca: {booking.uid}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load more button */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Učitavanje..." : "Vidi još"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CancelBookingDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelConfirm}
        isLoading={cancelBooking.isPending}
      />
      <RejectBookingDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isLoading={rejectBooking.isPending}
      />
    </div>
  );
}
