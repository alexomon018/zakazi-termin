import { createServerCaller } from "@/lib/trpc/server";
import { BookingsClient } from "@salonko/ui";

export default async function BookingsPage() {
  const caller = await createServerCaller();

  // Fetch initial data (upcoming bookings with pagination)
  const now = new Date();
  const initialData = await caller.booking.listPaginated({
    dateFrom: now,
    status: "ACCEPTED",
    skip: 0,
    take: 5,
  });

  return (
    <BookingsClient
      initialBookings={initialData.bookings}
      initialTotal={initialData.total}
      initialFilter="upcoming"
    />
  );
}
