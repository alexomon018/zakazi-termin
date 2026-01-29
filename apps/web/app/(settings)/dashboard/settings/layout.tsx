import { getSession } from "@/lib/auth";
import { createServerCaller } from "@/lib/trpc/server";
import type { MembershipRole } from "@salonko/prisma";
import { getAppOriginFromHeaders } from "@salonko/trpc";
import { DashboardShell, MobileSettingsNav, SettingsSidebar, TrialBanner } from "@salonko/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch user data to get membership role
  const caller = await createServerCaller();
  const userData = await caller.user.me();

  // Get user's role - default to OWNER if no membership (solo user/salon owner)
  const userRole: MembershipRole = userData?.membership?.role ?? "OWNER";
  const origin = getAppOriginFromHeaders(await headers());

  // Merge session user with userData
  const user = {
    ...session.user,
    salonSlug: userData?.salonSlug ?? null,
  };

  return (
    <DashboardShell
      user={user}
      origin={origin}
      customSidebar={<SettingsSidebar userRole={userRole} />}
      hideMobileNav
    >
      {/* Mobile settings navigation */}
      <MobileSettingsNav userRole={userRole} />
      <TrialBanner />
      <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </DashboardShell>
  );
}
