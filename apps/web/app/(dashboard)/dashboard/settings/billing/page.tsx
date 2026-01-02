import { createServerCaller } from "@/lib/trpc/server";
import { BillingClient } from "@salonko/ui";

/**
 * Renders the billing settings UI preloaded with the current user's subscription status.
 *
 * @returns A React element containing the BillingClient component initialized with the user's subscription status.
 */
export default async function BillingSettingsPage() {
  const caller = await createServerCaller();

  // Get subscription status (trial is auto-started in the dashboard layout)
  const status = await caller.subscription.getStatus();

  return <BillingClient initialStatus={status} />;
}