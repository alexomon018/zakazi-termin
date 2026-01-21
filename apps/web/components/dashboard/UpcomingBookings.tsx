"use client";

import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import Link from "next/link";
import { useState } from "react";

interface Attendee {
  id: string;
  name: string;
  email: string;
}

interface StaffMember {
  id: string;
  name: string | null;
}

interface Booking {
  id: string;
  title: string;
  startTime: Date;
  attendees: Attendee[];
  user?: StaffMember | null;
  assignedHost?: StaffMember | null;
}

interface UpcomingBookingsProps {
  initialBookings: Array<{
    id: string;
    title: string;
    startTime: Date;
    attendees: Array<{
      id: string;
      name: string;
      email: string;
      timeZone: string;
      phoneNumber: string | null;
      locale: string;
      bookingId: string;
    }>;
    user?: { id: string; name: string | null } | null;
    assignedHost?: { id: string; name: string | null } | null;
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
      <CardHeader className="flex flex-row justify-between items-center">
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
          <p className="py-8 text-center text-muted-foreground">Nemate zakazanih termina.</p>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-border">
              {displayedBookings.map((booking) => {
                // Get staff name (assigned host or event owner)
                const staffName = booking.assignedHost?.name || booking.user?.name;
                return (
                  <div key={booking.id} className="flex justify-between items-center py-4">
                    <div>
                      <p className="font-medium text-foreground">{booking.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.attendees[0]?.name} ({booking.attendees[0]?.email})
                      </p>
                      {staffName && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Zaposleni: {staffName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(booking.startTime).toLocaleDateString("sr-RS", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.startTime).toLocaleTimeString("sr-RS", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {hasMore && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
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
