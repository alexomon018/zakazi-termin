"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent } from "@zakazi-termin/ui";
import {
  Clock,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: booking, isLoading, refetch } = trpc.booking.byUid.useQuery({ uid });

  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      refetch();
      setShowCancelDialog(false);
    },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("sr-RS", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
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
      case "ACCEPTED":
        return (
          <span className="inline-flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
            <CheckCircle className="w-4 h-4" />
            Potvrđeno
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex gap-1 items-center px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full">
            <AlertCircle className="w-4 h-4" />
            Čeka potvrdu
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex gap-1 items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
            <XCircle className="w-4 h-4" />
            Otkazano
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
            <XCircle className="w-4 h-4" />
            Odbijeno
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Učitavanje...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="mx-auto max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Termin nije pronađen
            </h2>
            <p className="text-gray-500">
              Ovaj termin ne postoji ili je uklonjen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPast = new Date(booking.startTime) < new Date();
  const canModify = booking.status === "ACCEPTED" || booking.status === "PENDING";
  const canCancel = canModify && !isPast;
  const canReschedule = canModify && !isPast;

  const attendee = booking.attendees[0];

  return (
    <div className="px-4 py-8 min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex gap-2 items-center mb-6 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Nazad na početnu
        </Link>

        <Card>
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 justify-between items-start mb-6 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {booking.eventType?.title || booking.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Ref: {booking.uid.slice(0, 8).toUpperCase()}
                </p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            {/* Booking details */}
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <Calendar className="flex-shrink-0 mt-0.5 w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(booking.startTime)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Clock className="flex-shrink-0 mt-0.5 w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.eventType?.length || 30} minuta
                  </p>
                </div>
              </div>

              {booking.location && (
                <div className="flex gap-3 items-start">
                  <MapPin className="flex-shrink-0 mt-0.5 w-5 h-5 text-gray-400" />
                  <p className="text-gray-900">{booking.location}</p>
                </div>
              )}

              {/* Organizer */}
              <div className="pt-4 mt-4 border-t">
                <h3 className="mb-3 text-sm font-medium text-gray-500">
                  Organizator
                </h3>
                <div className="flex gap-3 items-center">
                  <div className="flex justify-center items-center w-10 h-10 bg-blue-100 rounded-full">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.user?.name || "Organizator"}
                    </p>
                    <p className="text-sm text-gray-500">{booking.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Attendee */}
              {attendee && (
                <div className="pt-4 mt-4 border-t">
                  <h3 className="mb-3 text-sm font-medium text-gray-500">
                    Vaši podaci
                  </h3>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center text-gray-900">
                      <User className="w-4 h-4 text-gray-400" />
                      {attendee.name}
                    </div>
                    <div className="flex gap-2 items-center text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {attendee.email}
                    </div>
                    {attendee.phoneNumber && (
                      <div className="flex gap-2 items-center text-gray-900">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {attendee.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description/Notes */}
              {booking.description && (
                <div className="pt-4 mt-4 border-t">
                  <h3 className="mb-2 text-sm font-medium text-gray-500">
                    Napomena
                  </h3>
                  <p className="text-gray-900">{booking.description}</p>
                </div>
              )}

              {/* Cancellation reason */}
              {booking.cancellationReason && (
                <div className="p-4 mt-4 bg-red-50 rounded-lg">
                  <h3 className="mb-1 text-sm font-medium text-red-800">
                    Razlog otkazivanja
                  </h3>
                  <p className="text-red-700">{booking.cancellationReason}</p>
                </div>
              )}

              {/* Rejection reason */}
              {booking.rejectionReason && (
                <div className="p-4 mt-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-1 text-sm font-medium text-gray-800">
                    Razlog odbijanja
                  </h3>
                  <p className="text-gray-700">{booking.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {(canReschedule || canCancel) && (
              <div className="flex flex-col gap-3 pt-6 mt-6 border-t sm:flex-row">
                {canReschedule && booking.user?.username && booking.eventType?.slug && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      router.push(
                        `/${booking.user?.username}/${booking.eventType?.slug}?rescheduleUid=${booking.uid}`
                      )
                    }
                  >
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Promeni termin
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="mr-2 w-4 h-4" />
                    Otkaži termin
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel dialog */}
        {showCancelDialog && (
          <div className="flex fixed inset-0 justify-center items-center p-4 bg-black bg-opacity-50">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Otkazivanje termina
                </h2>
                <p className="mb-4 text-gray-600">
                  Da li ste sigurni da želite da otkažete ovaj termin?
                </p>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Razlog otkazivanja (opciono)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Unesite razlog..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCancelDialog(false)}
                  >
                    Odustani
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={cancelMutation.isPending}
                    onClick={() =>
                      cancelMutation.mutate({
                        uid: booking.uid,
                        reason: cancelReason || undefined,
                      })
                    }
                  >
                    {cancelMutation.isPending ? "Otkazujem..." : "Otkaži termin"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-sm text-center text-gray-500">
          Pokreće{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Zakazi Termin
          </Link>
        </div>
      </div>
    </div>
  );
}
