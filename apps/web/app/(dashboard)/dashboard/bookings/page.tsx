import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server";
import { BookingsClient } from "./bookings-client";

export default async function BookingsPage() {
  const caller = await createServerCaller();

  // Fetch initial data (upcoming bookings)
  const now = new Date();
  const initialBookings = await caller.booking.list({
    dateFrom: now,
    status: "ACCEPTED",
  });

  return <BookingsClient initialBookings={initialBookings} initialFilter="upcoming" />;
}
