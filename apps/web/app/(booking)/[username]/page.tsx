import { createPublicServerCaller } from "@/lib/trpc/server";
import { UserNotFound, UserProfileClient } from "@zakazi-termin/ui";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function UserBookingPage({ params }: Props) {
  const { username } = await params;

  const caller = await createPublicServerCaller();

  // Fetch user's public profile
  const user = await caller.user.getPublicProfile({ username });

  if (!user) {
    return <UserNotFound />;
  }

  return <UserProfileClient user={user} username={username} />;
}
