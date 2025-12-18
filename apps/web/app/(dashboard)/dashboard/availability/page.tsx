import { createServerCaller } from "@/lib/trpc/server";
import { AvailabilityClient } from "@zakazi-termin/ui";

export default async function AvailabilityPage() {
  const caller = await createServerCaller();

  // Fetch data in parallel
  const [schedules, currentUser] = await Promise.all([
    caller.availability.listSchedules(),
    caller.user.me(),
  ]);

  return <AvailabilityClient initialSchedules={schedules} currentUser={currentUser} />;
}
