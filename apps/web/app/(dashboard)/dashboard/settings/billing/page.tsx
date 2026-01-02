import { createServerCaller } from "@/lib/trpc/server";
import { BillingClient } from "@salonko/ui";

/**
 * Render the billing settings page populated with the current subscription status.
 *
 * @returns A JSX element that renders the BillingClient component with `initialStatus` set to the current subscription status.
 */
export default async function BillingSettingsPage() {
  const caller = await createServerCaller();

  // Get subscription status (trial is auto-started in the dashboard layout)
  const status = await caller.subscription.getStatus();

  return <BillingClient initialStatus={status} />;
}