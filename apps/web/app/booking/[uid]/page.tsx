import { createPublicServerCaller } from "@/lib/trpc/server";
import { BookingDetailsClient, BookingNotFound } from "@salonko/ui";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    uid: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const caller = await createPublicServerCaller();

  try {
    const booking = await caller.booking.byUid({ uid });

    if (!booking || !booking.eventType || !booking.user) {
      return {
        title: "Rezervacija nije pronadjena",
        description: "Ova rezervacija ne postoji ili je istekla.",
        robots: { index: false, follow: false },
      };
    }

    const title = `Rezervacija: ${booking.eventType.title}`;
    const description = `Detalji vase rezervacije za ${booking.eventType.title} kod ${booking.user.name || "salona"}.`;

    return {
      title,
      description,
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Rezervacija nije pronadjena",
      description: "Ova rezervacija ne postoji ili je istekla.",
      robots: { index: false, follow: false },
    };
  }
}

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
