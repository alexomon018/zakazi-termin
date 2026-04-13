import { createServerCaller } from "@/lib/trpc/server";
import type { RouterOutputs } from "@salonko/trpc";
import { BillingClient } from "@salonko/ui";
import { redirect } from "next/navigation";

export default async function BillingSettingsPage() {
  const caller = await createServerCaller();

  // Check user's role - only OWNER can access billing
  const user = await caller.user.me();
  const userRole = user?.membership?.role ?? "OWNER"; // No membership = solo owner

  if (userRole !== "OWNER") {
    // Team members cannot access billing - redirect to profile
    redirect("/dashboard/settings/profile");
  }

  // Get subscription status (trial is auto-started in the dashboard layout)
  let status: RouterOutputs["subscription"]["getStatus"] | undefined;
  try {
    status = await caller.subscription.getStatus();
  } catch {
    // If status fetch fails, render page without initial status
    // The BillingClient will handle loading/error states via tRPC
    status = undefined;
  }

  return <BillingClient initialStatus={status} />;
}
