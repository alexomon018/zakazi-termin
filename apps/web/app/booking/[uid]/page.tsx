import { createPublicServerCaller } from "@/lib/trpc/server";
import { BookingDetailsClient, BookingNotFound } from "@salonko/ui";

type Props = {
  params: Promise<{
    uid: string;
  }>;
};

export default async function BookingDetailsPage({ params }: Props) {
  const { uid } = await params;

  const caller = await createPublicServerCaller();

  try {
    const booking = await caller.booking.byUid({ uid });

    if (!booking) {
      return <BookingNotFound />;
    }

    return <BookingDetailsClient initialBooking={booking} />;
  } catch {
    return <BookingNotFound />;
  }
}
