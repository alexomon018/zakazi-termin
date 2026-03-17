"use client";

import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import { Calendar } from "lucide-react";
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
    <Card className="shadow-sm">
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
          <div className="py-8 text-center">
            <Calendar
              className="mx-auto mb-4 w-12 h-12 text-primary/30 dark:text-primary/40"
              aria-hidden="true"
            />
            <p className="text-muted-foreground">Nemate zakazanih termina.</p>
            <Link href="/dashboard/event-types">
              <Button variant="outline" size="sm" className="mt-4">
                Kreiraj tip termina
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {displayedBookings.map((booking) => {
                // Get staff name (assigned host or event owner)
                const staffName = booking.assignedHost?.name || booking.user?.name;
                return (
                  <div key={booking.id} className="flex justify-between items-center py-4">
                    <div>
                      <p className="font-medium text-foreground">{booking.title}</p>
                      {booking.attendees[0] ? (
                        <p className="text-sm text-muted-foreground">
                          {booking.attendees[0]?.name} ({booking.attendees[0]?.email})
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nema podataka o klijentu</p>
                      )}
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
