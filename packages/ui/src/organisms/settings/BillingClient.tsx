"use client";

import { trpc } from "@/lib/trpc/client";
import { useExponentialBackoffPolling } from "@salonko/ui/hooks/useExponentialBackoffPolling";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BillingAlerts } from "./billing/BillingAlerts";
import { BillingPageHeader } from "./billing/BillingPageHeader";
import { CancelSubscriptionDialog } from "./billing/CancelSubscriptionDialog";
import { CurrentStatusCard } from "./billing/CurrentStatusCard";
import { DowngradeToMonthlyCard } from "./billing/DowngradeToMonthlyCard";
import { DowngradeToMonthlyDialog } from "./billing/DowngradeToMonthlyDialog";
import { InvoiceHistoryCard } from "./billing/InvoiceHistoryCard";
import { ManageSubscriptionCard } from "./billing/ManageSubscriptionCard";
import { PastDueCard } from "./billing/PastDueCard";
import { PlanPickerCard } from "./billing/PlanPickerCard";
import { UpgradeToYearlyCard } from "./billing/UpgradeToYearlyCard";
import { UpgradeToYearlyDialog } from "./billing/UpgradeToYearlyDialog";
import type { SubscriptionStatus } from "./billing/types";

type BillingClientProps = {
  initialStatus?: SubscriptionStatus;
};

export function BillingClient({ initialStatus }: BillingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLocked = searchParams.get("locked") === "true";
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);

  const utils = trpc.useUtils();

  // Clear success/canceled URL params after showing the message
  useEffect(() => {
    if (success || canceled) {
      const timer = setTimeout(() => {
        router.replace("/dashboard/settings/billing", { scroll: false });
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [success, canceled, router]);

  const { data: status, refetch } = trpc.subscription.getStatus.useQuery(undefined, {
    initialData: initialStatus,
  });

  // Refetch status when returning from Stripe checkout
  // Poll for status update as webhook may take a moment
  // Use exponential backoff: 1s, 2s, 4s, 8s (max 8s interval)
  useExponentialBackoffPolling({
    enabled: success,
    onPoll: refetch,
  });

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });

  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });

  const cancelSubscription = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      utils.subscription.getStatus.invalidate();
    },
  });

  const resumeSubscription = trpc.subscription.resume.useMutation({
    onSuccess: () => {
      utils.subscription.getStatus.invalidate();
    },
  });

  const upgradeToYearly = trpc.subscription.scheduleUpgradeToYearly.useMutation({
    onSuccess: () => {
      utils.subscription.getStatus.invalidate();
    },
  });

  const downgradeToMonthly = trpc.subscription.scheduleDowngradeToMonthly.useMutation({
    onSuccess: () => {
      utils.subscription.getStatus.invalidate();
    },
  });

  const { data: invoicesData, isLoading: invoicesLoading } =
    trpc.subscription.getInvoices.useQuery();

  // Show loading state if status is not yet available
  if (!status) {
    return (
      <div className="space-y-6">
        <BillingPageHeader />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Determine if pricing options should be shown (for NEW subscriptions only)
  const showPricingOptions =
    !status.hasPaidSubscription && // Show if user is in trial without paid subscription
    (status.isInTrial ||
      // Show if user has no subscription
      !status.hasSubscription ||
      // Show if subscription is expired
      status.status === "EXPIRED" ||
      // Show if user has subscription but it's not active, not in trial, and not past due
      // This covers cases where trial expired but status hasn't been updated to EXPIRED yet
      (status.hasSubscription &&
        !status.isInTrial &&
        status.status !== "ACTIVE" &&
        status.status !== "PAST_DUE"));

  // Show upgrade option when user has monthly paid subscription
  const showUpgradeOption =
    status.hasPaidSubscription &&
    status.billingInterval === "MONTH" &&
    !status.cancelAtPeriodEnd &&
    (status.status === "ACTIVE" || status.isInTrial);

  const showDowngradeOption =
    status.hasPaidSubscription &&
    status.billingInterval === "YEAR" &&
    !status.cancelAtPeriodEnd &&
    (status.status === "ACTIVE" || status.isInTrial);

  return (
    <div className="space-y-6">
      <BillingPageHeader />
      <BillingAlerts isLocked={isLocked} success={success} canceled={canceled} />
      <CurrentStatusCard status={status} />

      {/* Pricing Options - Show when trial (without paid subscription), expired, or no subscription */}
      {showPricingOptions && (
        <PlanPickerCard
          selectedInterval={selectedInterval}
          onSelectInterval={setSelectedInterval}
          onSubscribe={() => createCheckout.mutate({ interval: selectedInterval })}
          isSubscribing={createCheckout.isPending}
        />
      )}

      {/* Manage Subscription - Show when user has a paid subscription */}
      {status.hasPaidSubscription && (status.status === "ACTIVE" || status.isInTrial) && (
        <ManageSubscriptionCard
          status={status}
          onManagePayment={() => createPortal.mutate()}
          isManagingPayment={createPortal.isPending}
          onResume={() => resumeSubscription.mutate()}
          isResuming={resumeSubscription.isPending}
          onOpenCancelDialog={() => setShowCancelDialog(true)}
          isCanceling={cancelSubscription.isPending}
        />
      )}

      {/* Upgrade to Yearly - Show when user has monthly subscription */}
      {showUpgradeOption && (
        <UpgradeToYearlyCard
          status={status}
          onOpenUpgradeDialog={() => setShowUpgradeDialog(true)}
          isUpgrading={upgradeToYearly.isPending}
        />
      )}

      {/* Downgrade to Monthly - Show when user has yearly subscription */}
      {showDowngradeOption && (
        <DowngradeToMonthlyCard
          status={status}
          onOpenDowngradeDialog={() => setShowDowngradeDialog(true)}
          isDowngrading={downgradeToMonthly.isPending}
        />
      )}

      {/* Past Due - Show manage payment */}
      {status.status === "PAST_DUE" && (
        <PastDueCard
          onManagePayment={() => createPortal.mutate()}
          isManagingPayment={createPortal.isPending}
        />
      )}

      {/* Invoice History */}
      <InvoiceHistoryCard invoices={invoicesData?.invoices} isLoading={invoicesLoading} />

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        isPending={cancelSubscription.isPending}
        onConfirm={() => {
          cancelSubscription.mutate(undefined, {
            onSuccess: () => setShowCancelDialog(false),
          });
        }}
      />

      {/* Upgrade to Yearly Dialog */}
      <UpgradeToYearlyDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        isPending={upgradeToYearly.isPending}
        onConfirm={() => {
          upgradeToYearly.mutate();
          setShowUpgradeDialog(false);
        }}
      />

      {/* Downgrade to Monthly Dialog */}
      <DowngradeToMonthlyDialog
        open={showDowngradeDialog}
        onOpenChange={setShowDowngradeDialog}
        isPending={downgradeToMonthly.isPending}
        onConfirm={() => {
          downgradeToMonthly.mutate();
          setShowDowngradeDialog(false);
        }}
      />
    </div>
  );
}
