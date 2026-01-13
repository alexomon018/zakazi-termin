"use client";

import { trpc } from "@/lib/trpc/client";
import type { PlanTier } from "@salonko/config";
import { useExponentialBackoffPolling } from "@salonko/ui/hooks/useExponentialBackoffPolling";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BillingAlerts } from "./billing/BillingAlerts";
import { BillingPageHeader } from "./billing/BillingPageHeader";
import { CancelSubscriptionDialog } from "./billing/CancelSubscriptionDialog";
import { ChangePlanCard } from "./billing/ChangePlanCard";
import { ChangePlanDialog } from "./billing/ChangePlanDialog";
import { CurrentStatusCard } from "./billing/CurrentStatusCard";
import { InvoiceHistoryCard } from "./billing/InvoiceHistoryCard";
import { ManageSubscriptionCard } from "./billing/ManageSubscriptionCard";
import { PastDueCard } from "./billing/PastDueCard";
import { PlanPickerCard } from "./billing/PlanPickerCard";
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

  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("growth");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [pendingNewPlan, setPendingNewPlan] = useState<PlanTier | null>(null);

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

  const changePlan = trpc.subscription.changePlan.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch to ensure immediate UI update
      await utils.subscription.getStatus.invalidate();
      await refetch();
      setShowChangePlanDialog(false);
      setPendingNewPlan(null);
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

  // Show change plan option when user has an active paid subscription
  const showChangePlanOption =
    status.hasPaidSubscription &&
    !status.cancelAtPeriodEnd &&
    (status.status === "ACTIVE" || status.isInTrial);

  const handleOpenChangePlanDialog = (newPlan: PlanTier) => {
    setPendingNewPlan(newPlan);
    setShowChangePlanDialog(true);
  };

  const handleConfirmChangePlan = () => {
    if (pendingNewPlan) {
      changePlan.mutate({ newPlan: pendingNewPlan });
    }
  };

  return (
    <div className="space-y-6">
      <BillingPageHeader />
      <BillingAlerts isLocked={isLocked} success={success} canceled={canceled} />
      <CurrentStatusCard status={status} />

      {/* Pricing Options - Show when trial (without paid subscription), expired, or no subscription */}
      {showPricingOptions && (
        <PlanPickerCard
          selectedPlan={selectedPlan}
          currentPlan={status.planTier}
          onSelectPlan={setSelectedPlan}
          onSubscribe={() => createCheckout.mutate({ plan: selectedPlan })}
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

      {/* Change Plan - Show when user has active subscription */}
      {showChangePlanOption && (
        <ChangePlanCard
          status={status}
          onOpenChangePlanDialog={handleOpenChangePlanDialog}
          isChangingPlan={changePlan.isPending}
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

      {/* Change Plan Dialog */}
      <ChangePlanDialog
        open={showChangePlanDialog}
        onOpenChange={setShowChangePlanDialog}
        newPlan={pendingNewPlan}
        currentPlan={status.planTier}
        isPending={changePlan.isPending}
        onConfirm={handleConfirmChangePlan}
      />
    </div>
  );
}
