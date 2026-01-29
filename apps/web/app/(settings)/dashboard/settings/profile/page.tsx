import { createServerCaller } from "@/lib/trpc/server";
import { ProfileClient } from "@salonko/ui";

export default async function ProfileSettingsPage() {
  const caller = await createServerCaller();

  // Pre-fetch user data
  const user = await caller.user.me();

  return <ProfileClient initialUser={user!} />;
}
