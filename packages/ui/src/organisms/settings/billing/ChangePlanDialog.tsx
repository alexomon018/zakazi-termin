import { PRICING_CONFIG } from "@salonko/config";
import type { PlanTier } from "@salonko/config";
import { Button } from "@salonko/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salonko/ui/atoms/Dialog";
import { Loader2 } from "lucide-react";

type ChangePlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlan: PlanTier | null;
  currentPlan: PlanTier | null;
  isPending: boolean;
  onConfirm: () => void;
};

export function ChangePlanDialog({
  open,
  onOpenChange,
  newPlan,
  currentPlan,
  isPending,
  onConfirm,
}: ChangePlanDialogProps) {
  const newPlanConfig = newPlan ? PRICING_CONFIG[newPlan] : null;
  const currentPlanConfig = currentPlan ? PRICING_CONFIG[currentPlan] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="change-plan-dialog">
        <DialogHeader>
          <DialogTitle>Promenite plan?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              {currentPlanConfig && newPlanConfig && (
                <>
                  <p>
                    Prelazite sa <strong>{currentPlanConfig.name}</strong> na{" "}
                    <strong>{newPlanConfig.name}</strong>.
                  </p>
                  <p>
                    Nova cena:{" "}
                    <strong>
                      {newPlanConfig.price} RSD/
                      {newPlanConfig.billingInterval === "MONTH" ? "mesečno" : "godišnje"}
                    </strong>
                  </p>
                </>
              )}
              <p>
                Promena će stupiti na snagu na kraju tekućeg perioda naplate. Do tada ćete nastaviti
                da koristite trenutni plan.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Odustani
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            Potvrdi promenu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
