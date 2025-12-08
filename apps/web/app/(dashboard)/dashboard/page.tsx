import { getSession } from "@/lib/auth";
import { prisma } from "@zakazi-termin/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@zakazi-termin/ui";
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
        <h1 className="text-2xl font-bold text-gray-900">
          Dobrodošli, {session.user.name?.split(" ")[0] || "Korisniče"}!
        </h1>
        <p className="text-gray-600 mt-1">
          Evo pregleda vaših termina i aktivnosti.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Danas
            </CardTitle>
            <Calendar className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings}</div>
            <p className="text-xs text-gray-500">zakazanih termina</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Predstojeći termini
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings}</div>
            <p className="text-xs text-gray-500">ukupno zakazano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tipovi termina
            </CardTitle>
            <Clock className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventTypes}</div>
            <p className="text-xs text-gray-500">aktivnih tipova</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Predstojeći termini</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nemate zakazanih termina.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <div key={booking.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{booking.title}</p>
                    <p className="text-sm text-gray-500">
                      {booking.attendees[0]?.name} ({booking.attendees[0]?.email})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(booking.startTime).toLocaleDateString("sr-RS", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.startTime).toLocaleTimeString("sr-RS", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">Link za zakazivanje</h3>
        <p className="text-sm text-blue-700 mb-3">
          Podelite ovaj link sa klijentima kako bi mogli da zakazuju termine:
        </p>
        <code className="bg-white px-3 py-2 rounded border border-blue-200 text-sm text-blue-900 block">
          {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/{session.user.username}
        </code>
      </div>
    </div>
  );
}
