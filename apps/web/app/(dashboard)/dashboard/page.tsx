import { UpcomingBookings } from "@/components/dashboard/UpcomingBookings";
import { getSession } from "@/lib/auth";
import { prisma } from "@salonko/prisma";
import { getAppOriginFromHeaders } from "@salonko/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import { Calendar, Clock, Users } from "lucide-react";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const origin = getAppOriginFromHeaders(await headers());

  // Fetch stats
  const [upcomingBookings, eventTypes, todayBookings] = await Promise.all([
    prisma.booking.count({
      where: {
        userId: session.user.id,
        startTime: { gte: new Date() },
        status: { in: ["ACCEPTED", "PENDING"] },
      },
    }),
    prisma.eventType.count({
      where: { userId: session.user.id },
    }),
    prisma.booking.count({
      where: {
        userId: session.user.id,
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { in: ["ACCEPTED", "PENDING"] },
      },
    }),
  ]);

  // Fetch upcoming bookings list
  const bookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      startTime: { gte: new Date() },
      status: { in: ["ACCEPTED", "PENDING"] },
    },
    include: {
      eventType: true,
      attendees: true,
    },
    orderBy: { startTime: "asc" },
    take: 5,
  });

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
        <Card className="transition-all duration-300 hover:shadow-elevated-lg hover:border-primary/20 group">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Danas</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/15 transition-colors group-hover:bg-primary/15 dark:group-hover:bg-primary/20">
              <Calendar className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todayBookings}</div>
            <p className="text-xs text-muted-foreground">zakazanih termina</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-elevated-lg hover:border-primary/20 group">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Predstojeći termini
            </CardTitle>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/15 transition-colors group-hover:bg-primary/15 dark:group-hover:bg-primary/20">
              <Users className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">ukupno zakazano</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-elevated-lg hover:border-primary/20 group">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipovi termina
            </CardTitle>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/15 transition-colors group-hover:bg-primary/15 dark:group-hover:bg-primary/20">
              <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
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
      <div className="p-6 rounded-xl bg-white/50 dark:bg-card/50 backdrop-blur-sm border border-gray-200/50 dark:border-border/50 shadow-sm">
        <h3 className="mb-2 font-medium text-foreground">Link za zakazivanje</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Podelite ovaj link sa klijentima kako bi mogli da zakazuju termine:
        </p>
        <code className="block px-4 py-3 text-sm text-foreground bg-gray-50 dark:bg-muted/50 rounded-lg border border-gray-200/50 dark:border-border/50 break-all font-mono">
          {origin}/{session.user.salonName}
        </code>
      </div>
    </div>
  );
}
