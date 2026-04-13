import { PLAN_TIERS, PRICING_CONFIG } from "@salonko/config";
import type { PlanTier } from "@salonko/config";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { cn } from "@salonko/ui/utils";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import type { SubscriptionStatus } from "./types";

type ChangePlanCardProps = {
  status: SubscriptionStatus;
  onOpenChangePlanDialog: (newPlan: PlanTier) => void;
  isChangingPlan: boolean;
};

export function ChangePlanCard({
  status,
  onOpenChangePlanDialog,
  isChangingPlan,
}: ChangePlanCardProps) {
  const currentPlan = status.planTier;

  // Filter out current plan from available options
  const availablePlans = PLAN_TIERS.filter((tier) => tier !== currentPlan);

  return (
    <Card data-testid="change-plan-card">
      <CardHeader>
        <CardTitle className="text-lg">Promenite plan</CardTitle>
        <CardDescription className="text-sm">
          Izaberite drugi plan - promena stupa na snagu na kraju tekućeg perioda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availablePlans.map((tier) => {
            const config = PRICING_CONFIG[tier];

            return (
              <div
                key={tier}
                className="relative rounded-xl border p-4 transition-all hover:border-primary/50"
              >
                {config.badge && (
                  <span
                    className={cn(
                      "absolute -top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium text-white",
                      tier === "growth" ? "bg-primary" : "bg-emerald-500"
                    )}
                  >
                    {config.badge}
                  </span>
                )}
                <p className="font-semibold text-foreground">{config.name}</p>
                <p className="text-lg font-bold text-foreground">
                  {config.price}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    RSD/{config.billingInterval === "MONTH" ? "mes" : "god"}
                  </span>
                </p>
                <ul className="mt-2 space-y-1">
                  {config.features.slice(0, 2).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <Check className="w-3 h-3 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => onOpenChangePlanDialog(tier)}
                  disabled={isChangingPlan}
                >
                  {isChangingPlan ? (
                    <Loader2 className="mr-1 w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-1 w-3 h-3" />
                  )}
                  Pređi na ovaj plan
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
