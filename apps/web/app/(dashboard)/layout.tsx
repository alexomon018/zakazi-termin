import { getSession } from "@/lib/auth";
import { createServerCaller } from "@/lib/trpc/server";
import { DashboardNav, TrialBanner } from "@salonko/ui";
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

  // Fetch subscription status to determine if user is subscribed
  const caller = await createServerCaller();
  let subscriptionStatus = await caller.subscription.getStatus();

  // Auto-start trial for new users on their first dashboard visit
  if (!subscriptionStatus.hasSubscription) {
    await caller.subscription.startTrial();
    // Refresh status after starting trial
    subscriptionStatus = await caller.subscription.getStatus();
  }

  const isSubscribed =
    subscriptionStatus.isActive || subscriptionStatus.isInTrial;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav user={session.user} isSubscribed={isSubscribed} />
      <TrialBanner />
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
