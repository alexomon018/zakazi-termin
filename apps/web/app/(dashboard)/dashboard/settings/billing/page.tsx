import { createServerCaller } from "@/lib/trpc/server";
import type { RouterOutputs } from "@salonko/trpc";
import { BillingClient } from "@salonko/ui";

export default async function BillingSettingsPage() {
  const caller = await createServerCaller();

  // Get subscription status (trial is auto-started in the dashboard layout)
  let status: RouterOutputs["subscription"]["getStatus"] | undefined;
  try {
    status = await caller.subscription.getStatus();
  } catch (error) {
    // If status fetch fails, render page without initial status
    // The BillingClient will handle loading/error states via tRPC
    status = undefined;
  }

  return <BillingClient initialStatus={status} />;
}
