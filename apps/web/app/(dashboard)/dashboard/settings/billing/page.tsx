import { createServerCaller } from "@/lib/trpc/server";
import { BillingClient } from "@salonko/ui";
import { redirect } from "next/navigation";

export default async function BillingSettingsPage() {
  const caller = await createServerCaller();

  // Get subscription status
  let status = await caller.subscription.getStatus();

  // If no subscription exists, start trial automatically
  if (!status.hasSubscription) {
    await caller.subscription.startTrial();
    // Refresh status after starting trial
    status = await caller.subscription.getStatus();
  }

  return <BillingClient initialStatus={status} />;
}
