import { UpcomingBookings } from "@/components/dashboard/UpcomingBookings";
import { getSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/utils";
import { prisma } from "@salonko/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import { Calendar, Clock, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dobrodošli, {session.user.name?.split(" ")[0] || "Korisniče"}!
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Evo pregleda vaših termina i aktivnosti.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Danas
            </CardTitle>
            <Calendar className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{todayBookings}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">zakazanih termina</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Predstojeći termini
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{upcomingBookings}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">ukupno zakazano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tipovi termina
            </CardTitle>
            <Clock className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{eventTypes}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">aktivnih tipova</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming bookings */}
      <UpcomingBookings initialBookings={bookings} totalBookings={upcomingBookings} />

      {/* Quick links */}
      <div className="p-6 bg-blue-50 rounded-lg dark:bg-blue-900/20">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-300">Link za zakazivanje</h3>
        <p className="mb-3 text-sm text-blue-700 dark:text-blue-400">
          Podelite ovaj link sa klijentima kako bi mogli da zakazuju termine:
        </p>
        <code className="block px-3 py-2 text-sm text-blue-900 bg-white rounded border border-blue-200 dark:bg-gray-800 dark:border-blue-800 dark:text-blue-300">
          {getAppUrl()}/{session.user.username}
        </code>
      </div>
    </div>
  );
}
