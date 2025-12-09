"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@zakazi-termin/ui";
import { Calendar, Clock, MapPin, User, Check, X, MoreVertical, ExternalLink } from "lucide-react";

type BookingFilter = "upcoming" | "pending" | "past" | "cancelled";

export default function BookingsPage() {
  const [filter, setFilter] = useState<BookingFilter>("upcoming");
  const utils = trpc.useUtils();

  // Determine query parameters based on filter
  const getQueryParams = () => {
    const now = new Date();
    switch (filter) {
      case "upcoming":
        return { dateFrom: now, status: "ACCEPTED" as const };
      case "pending":
        return { status: "PENDING" as const };
      case "past":
        return { dateTo: now, status: "ACCEPTED" as const };
      case "cancelled":
        return { status: "CANCELLED" as const };
      default:
        return {};
    }
  };

  const { data: bookings, isLoading } = trpc.booking.list.useQuery(getQueryParams());

  const confirmBooking = trpc.booking.confirm.useMutation({
    onSuccess: () => {
      utils.booking.list.invalidate();
    },
  });

  const rejectBooking = trpc.booking.reject.useMutation({
    onSuccess: () => {
      utils.booking.list.invalidate();
    },
  });

  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      utils.booking.list.invalidate();
    },
  });

  const handleConfirm = (uid: string) => {
    confirmBooking.mutate({ uid });
  };

  const handleReject = (uid: string) => {
    const reason = prompt("Unesite razlog odbijanja (opciono):");
    rejectBooking.mutate({ uid, reason: reason || undefined });
  };

  const handleCancel = (uid: string) => {
    if (confirm("Da li ste sigurni da želite da otkažete ovaj termin?")) {
      const reason = prompt("Unesite razlog otkazivanja (opciono):");
      cancelBooking.mutate({ uid, reason: reason || undefined });
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString("sr-RS", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("sr-RS", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Na čekanju
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Potvrđeno
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Otkazano
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Odbijeno
          </span>
        );
      default:
        return null;
    }
  };

  const filters: { key: BookingFilter; label: string }[] = [
    { key: "upcoming", label: "Predstojeći" },
    { key: "pending", label: "Na čekanju" },
    { key: "past", label: "Prošli" },
    { key: "cancelled", label: "Otkazani" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Termini</h1>
        <p className="text-gray-600 mt-1">Upravljajte zakazanim terminima</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === f.key
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {bookings?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {filter === "upcoming" && "Nemate predstojećih termina."}
              {filter === "pending" && "Nemate termina na čekanju."}
              {filter === "past" && "Nemate prošlih termina."}
              {filter === "cancelled" && "Nemate otkazanih termina."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Title and status */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{booking.title}</h3>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Event type */}
                      {booking.eventType && (
                        <p className="text-sm text-gray-500 mb-3">
                          {booking.eventType.title}
                        </p>
                      )}

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDateTime(booking.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                        </div>
                        {booking.location && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{booking.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Attendees */}
                      {booking.attendees && booking.attendees.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">GOST</p>
                          {booking.attendees.map((attendee) => (
                            <div key={attendee.id} className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {attendee.name}
                                </p>
                                <p className="text-xs text-gray-500">{attendee.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes/description */}
                      {booking.description && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">NAPOMENA</p>
                          <p className="text-sm text-gray-600">{booking.description}</p>
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
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Potvrdi
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(booking.uid)}
                            disabled={rejectBooking.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Odbij
                          </Button>
                        </>
                      )}
                      {booking.status === "ACCEPTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(booking.uid)}
                          disabled={cancelBooking.isPending}
                          className="text-gray-600 hover:text-red-600"
                        >
                          Otkaži
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer with booking UID */}
                <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 rounded-b-lg">
                  Referenca: {booking.uid}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
