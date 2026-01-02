import { createServerCaller } from "@/lib/trpc/server";
import { BillingClient } from "@salonko/ui";

export default async function BillingSettingsPage() {
  const caller = await createServerCaller();

  // Get subscription status (trial is auto-started in the dashboard layout)
  const status = await caller.subscription.getStatus();

  return <BillingClient initialStatus={status} />;
}
