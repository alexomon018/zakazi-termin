import { getSession } from "@/lib/auth";
import { createServerCaller } from "@/lib/trpc/server";
import { DashboardNav, TrialBanner } from "@salonko/ui";
import { redirect } from "next/navigation";

/**
 * Dashboard layout component that enforces authentication and ensures subscription state.
 *
 * If no session exists the user is redirected to "/login". Ensures a subscription status is available:
 * if the user has no subscription, a trial is started and the status is refreshed. Renders the dashboard
 * navigation (with subscription state), a trial banner, and the provided children inside the main content area.
 *
 * @param children - Content to render inside the dashboard's main area
 * @returns The rendered dashboard layout element containing navigation, trial banner, and `children`
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch subscription status to determine if user is subscribed
  const caller = await createServerCaller();
  let subscriptionStatus = await caller.subscription.getStatus();

  // Auto-start trial for new users on their first dashboard visit
  if (!subscriptionStatus.hasSubscription) {
    await caller.subscription.startTrial();
    // Refresh status after starting trial
    subscriptionStatus = await caller.subscription.getStatus();
  }

  const isSubscribed = subscriptionStatus.isActive || subscriptionStatus.isInTrial;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav user={session.user} isSubscribed={isSubscribed} />
      <TrialBanner />
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}