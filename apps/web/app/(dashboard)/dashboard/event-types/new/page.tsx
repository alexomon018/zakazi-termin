import { createServerCaller } from "@/lib/trpc/server";
import { NewEventTypeClient } from "./new-event-type-client";

export default async function NewEventTypePage() {
  const caller = await createServerCaller();

  // Pre-fetch schedules on server
  const schedules = await caller.availability.listSchedules();

  return <NewEventTypeClient schedules={schedules} />;
}
