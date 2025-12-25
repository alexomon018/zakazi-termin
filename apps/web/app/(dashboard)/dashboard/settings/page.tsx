import { createServerCaller } from "@/lib/trpc/server";
import { SettingsClient } from "@zakazi-termin/ui";
import { Suspense } from "react";

export default async function SettingsPage() {
  const caller = await createServerCaller();

  // Pre-fetch calendar connections
  const connections = await caller.calendar.listConnections();

  return (
    <Suspense fallback={<div className="text-gray-500">Učitavanje...</div>}>
      <SettingsClient initialConnections={connections} />
    </Suspense>
  );
}
