import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { Loader2 } from "lucide-react";

import type { SubscriptionStatus } from "./types";

type ManageSubscriptionCardProps = {
  status: SubscriptionStatus;
  onManagePayment: () => void;
  isManagingPayment: boolean;
  onResume: () => void;
  isResuming: boolean;
  onOpenCancelDialog: () => void;
  isCanceling: boolean;
};

export function ManageSubscriptionCard({
  status,
  onManagePayment,
  isManagingPayment,
  onResume,
  isResuming,
  onOpenCancelDialog,
  isCanceling,
}: ManageSubscriptionCardProps) {
  return (
    <Card data-testid="manage-subscription-card">
      <CardHeader>
        <CardTitle className="text-lg">Upravljanje pretplatom</CardTitle>
        <CardDescription className="text-sm">
          Promenite način plaćanja ili otkažite pretplatu
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={onManagePayment}
          disabled={isManagingPayment}
          className="min-w-[200px]"
          data-testid="manage-payment-button"
        >
          {isManagingPayment ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Učitavanje...
            </>
          ) : (
            "Upravljaj načinom plaćanja"
          )}
        </Button>

        {status.cancelAtPeriodEnd ? (
          <Button
            variant="outline"
            onClick={onResume}
            disabled={isResuming}
            className="min-w-[160px]"
            data-testid="resume-subscription-button"
          >
            {isResuming ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Učitavanje...
              </>
            ) : (
              "Nastavi pretplatu"
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive min-w-[140px]"
            onClick={onOpenCancelDialog}
            disabled={isCanceling}
            data-testid="cancel-subscription-button"
          >
            {isCanceling ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Učitavanje...
              </>
            ) : (
              "Otkaži pretplatu"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
