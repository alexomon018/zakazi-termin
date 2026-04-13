import { getSession } from "@/lib/auth";
import { createServerCaller } from "@/lib/trpc/server";
import { logger } from "@salonko/config";
import { getAppOriginFromHeaders } from "@salonko/trpc";
import { DashboardShell, TrialBanner } from "@salonko/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch subscription status and user data
  const caller = await createServerCaller();
  const [subscriptionStatusResult, userData] = await Promise.all([
    caller.subscription.getStatus(),
    caller.user.me(),
  ]);
  let subscriptionStatus = subscriptionStatusResult;

  // Auto-start trial for new users on their first dashboard visit
  if (!subscriptionStatus.hasSubscription) {
    try {
      await caller.subscription.startTrial();
      // Refresh status after starting trial
      subscriptionStatus = await caller.subscription.getStatus();
    } catch (error) {
      // Log error but don't rethrow - allow page to render with current status
      logger.error("Failed to auto-start trial", {
        error,
        userId: session.user.id,
      });
      // Refresh status to get the best-known state even if trial start failed
      try {
        subscriptionStatus = await caller.subscription.getStatus();
      } catch (refreshError) {
        // If refresh also fails, log but continue with existing status
        logger.error("Failed to refresh subscription status after trial start failure", {
          error: refreshError,
          userId: session.user.id,
        });
      }
    }
  }

  const isSubscribed = subscriptionStatus.isActive || subscriptionStatus.isInTrial;
  const origin = getAppOriginFromHeaders(await headers());

  // Merge session user with userData to get salonSlug
  const user = {
    ...session.user,
    salonSlug: userData?.salonSlug ?? null,
  };

  return (
    <DashboardShell
      user={user}
      isSubscribed={isSubscribed}
      salonIconUrl={userData?.salonIconUrl}
      origin={origin}
    >
      <TrialBanner />
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">{children}</div>
    </DashboardShell>
  );
}
