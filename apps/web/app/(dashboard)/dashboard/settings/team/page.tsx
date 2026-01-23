import { createServerCaller } from "@/lib/trpc/server";
import { TeamSettingsClient } from "@salonko/ui";
import { redirect } from "next/navigation";

export default async function TeamSettingsPage() {
  const caller = await createServerCaller();

  // Pre-fetch organization and members data
  const [organization, user] = await Promise.all([caller.organization.get(), caller.user.me()]);

  // Check user's role - only OWNER and ADMIN can access team settings
  const userRole = user?.membership?.role ?? "OWNER"; // No membership = solo owner

  if (userRole === "MEMBER") {
    // Regular team members cannot access team settings - redirect to profile
    redirect("/dashboard/settings/profile");
  }

  // If user has an organization, fetch members and invites
  let members: Awaited<ReturnType<typeof caller.team.listMembers>> = [];
  let invites: Awaited<ReturnType<typeof caller.team.listInvites>> = [];

  if (organization) {
    [members, invites] = await Promise.all([
      caller.team.listMembers({ organizationId: organization.id }),
      caller.team.listInvites({ organizationId: organization.id }),
    ]);
  }

  return (
    <TeamSettingsClient
      initialOrganization={organization}
      initialMembers={members}
      initialInvites={invites}
      currentUser={user}
    />
  );
}
