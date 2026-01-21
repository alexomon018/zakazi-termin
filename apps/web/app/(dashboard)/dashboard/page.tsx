import { UpcomingBookings } from "@/components/dashboard/UpcomingBookings";
import { getSession } from "@/lib/auth";
import { createServerCaller } from "@/lib/trpc/server";
import { getAppOriginFromHeaders } from "@salonko/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import { Calendar, Clock, Users } from "lucide-react";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const [origin, caller] = await Promise.all([
    getAppOriginFromHeaders(await headers()),
    createServerCaller(),
  ]);

  // Fetch stats and bookings via tRPC
  const [stats, upcomingData, userProfile] = await Promise.all([
    caller.booking.dashboardStats(),
    caller.booking.upcoming({ skip: 0, take: 5 }),
    caller.user.me(),
  ]);

  const { upcomingBookings, eventTypes, todayBookings } = stats;
  const { bookings } = upcomingData;

  // Determine the booking link slug (salonName or organization slug)
  const displaySlug = userProfile?.salonName || userProfile?.membership?.organization?.slug;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Dobrodošli, {session.user.name?.split(" ")[0] || "Korisniče"}!
        </h1>
        <p className="mt-1 text-muted-foreground">Evo pregleda vaših termina i aktivnosti.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Danas</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todayBookings}</div>
            <p className="text-xs text-muted-foreground">zakazanih termina</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Predstojeći termini
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">ukupno zakazano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipovi termina
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{eventTypes}</div>
            <p className="text-xs text-muted-foreground">aktivnih tipova</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming bookings */}
      <UpcomingBookings initialBookings={bookings} totalBookings={upcomingBookings} />

      {/* Quick links */}
      <div className="p-6 bg-gray-50 rounded-lg dark:bg-muted/30 border border-gray-100 dark:border-border">
        <h3 className="mb-2 font-medium text-foreground">Link za zakazivanje</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Podelite ovaj link sa klijentima kako bi mogli da zakazuju termine:
        </p>
        <code className="block px-3 py-2 text-sm text-foreground bg-white rounded border border-gray-200 dark:bg-card dark:border-border break-all">
          {origin}/{displaySlug}
        </code>
      </div>
    </div>
  );
}
