import { createPublicServerCaller } from "@/lib/trpc/server";
import { BookingClient, EventNotFound } from "@zakazi-termin/ui";

type Props = {
  params: Promise<{
    username: string;
    eventSlug: string;
  }>;
};

export default async function PublicBookingPage({ params }: Props) {
  const { username, eventSlug } = await params;

  const caller = await createPublicServerCaller();

  try {
    const eventType = await caller.eventType.getPublic({
      username,
      slug: eventSlug,
    });

    if (!eventType) {
      return <EventNotFound />;
    }

    return (
      <BookingClient
        eventType={eventType}
        username={username}
        eventSlug={eventSlug}
      />
    );
  } catch {
    return <EventNotFound />;
  }
}
