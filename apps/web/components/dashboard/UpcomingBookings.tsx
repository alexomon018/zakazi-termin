"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@zakazi-termin/ui";
import { trpc } from "@/lib/trpc/client";

interface Attendee {
  id: number;
  name: string;
  email: string;
}

interface Booking {
  id: number;
  title: string;
  startTime: Date;
  attendees: Attendee[];
}

interface UpcomingBookingsProps {
  initialBookings: Array<{
    id: number;
    title: string;
    startTime: Date;
    attendees: Array<{
      id: number;
      name: string;
      email: string;
      timeZone: string;
      phoneNumber: string | null;
      locale: string;
      bookingId: number;
    }>;
    [key: string]: unknown;
  }>;
  totalBookings: number;
}

export function UpcomingBookings({ initialBookings, totalBookings }: UpcomingBookingsProps) {
  const [displayedBookings, setDisplayedBookings] = useState<Booking[]>(initialBookings);
  const [skip, setSkip] = useState(initialBookings.length);
  const [hasMore, setHasMore] = useState(initialBookings.length < totalBookings);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { refetch } = trpc.booking.upcoming.useQuery(
    { skip, take: 5 },
    {
      enabled: false,
      refetchOnWindowFocus: false,
    }
  );

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const result = await refetch();
      if (result.data) {
        setDisplayedBookings((prev) => [...prev, ...result.data.bookings]);
        setSkip((prev) => prev + result.data.bookings.length);
        setHasMore(result.data.hasMore);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Predstojeći termini</CardTitle>
        {totalBookings > 0 && (
          <Link href="/dashboard/bookings">
            <Button variant="outline" size="sm">
              Vidi sve
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {displayedBookings.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Nemate zakazanih termina.
          </p>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayedBookings.map((booking) => (
                <div key={booking.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{booking.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.attendees[0]?.name} ({booking.attendees[0]?.email})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(booking.startTime).toLocaleDateString("sr-RS", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(booking.startTime).toLocaleTimeString("sr-RS", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Učitavanje..." : "Vidi još"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
