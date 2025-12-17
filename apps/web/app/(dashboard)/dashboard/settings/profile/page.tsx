import { createServerCaller } from "@/lib/trpc/server";
import { ProfileClient } from "./profile-client";

export default async function ProfileSettingsPage() {
  const caller = await createServerCaller();

  // Pre-fetch user data
  const user = await caller.user.me();

  return <ProfileClient initialUser={user!} />;
}
