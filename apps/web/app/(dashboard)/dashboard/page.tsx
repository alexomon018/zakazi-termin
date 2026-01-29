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

  // First, ensure the user has a subscription/trial
  // This handles the race condition where new users might hit the page before their trial is created
  // The layout also calls startTrial(), but we need to ensure it exists before calling subscription-protected procedures
  const subscriptionStatus = await caller.subscription.getStatus();
  if (!subscriptionStatus.hasSubscription) {
    // Start trial for new users - this is idempotent (safe to call multiple times)
    await caller.subscription.startTrial();
  }

  // Now fetch stats and bookings - the subscription is guaranteed to exist
  const [stats, upcomingData, userProfile] = await Promise.all([
    caller.booking.dashboardStats(),
    caller.booking.upcoming({ skip: 0, take: 5 }),
    caller.user.me(),
  ]);

  const { upcomingBookings, eventTypes, todayBookings } = stats;
  const { bookings } = upcomingData;

  // Determine the booking link slug (salonSlug or organization slug) with a safe fallback
  const displaySlug = userProfile?.salonSlug || userProfile?.membership?.organization?.slug || null;

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
    </div>
  );
}
