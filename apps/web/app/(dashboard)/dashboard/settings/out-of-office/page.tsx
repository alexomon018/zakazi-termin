import { createServerCaller } from "@/lib/trpc/server";
import { OutOfOfficeClient } from "@zakazi-termin/ui";

export default async function OutOfOfficeSettingsPage() {
  const caller = await createServerCaller();

  // Pre-fetch data in parallel
  const [entries, reasons] = await Promise.all([
    caller.outOfOffice.list(),
    caller.outOfOffice.reasons(),
  ]);

  return <OutOfOfficeClient initialEntries={entries} initialReasons={reasons} />;
}
