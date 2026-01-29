import { createServerCaller } from "@/lib/trpc/server";
import { AppearanceClient } from "@salonko/ui";

export default async function AppearanceSettingsPage() {
  const caller = await createServerCaller();

  // Pre-fetch user data
  const user = await caller.user.me();

  return <AppearanceClient initialUser={user} />;
}
