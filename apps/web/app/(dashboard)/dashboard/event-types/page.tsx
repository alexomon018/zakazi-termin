import { createServerCaller } from "@/lib/trpc/server";
import { EventTypesClient } from "@zakazi-termin/ui";

export default async function EventTypesPage() {
  const caller = await createServerCaller();

  // Fetch data in parallel
  const [eventTypes, currentUser] = await Promise.all([caller.eventType.list(), caller.user.me()]);

  return <EventTypesClient initialEventTypes={eventTypes} currentUser={currentUser} />;
}
