import { PLAN_TIERS, PRICING_CONFIG } from "@salonko/config";
import type { PlanTier } from "@salonko/config";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { cn } from "@salonko/ui/utils";
import { Check, CreditCard, Loader2 } from "lucide-react";

type PlanPickerCardProps = {
  selectedPlan: PlanTier;
  currentPlan: PlanTier | null;
  onSelectPlan: (plan: PlanTier) => void;
  onSubscribe: () => void;
  isSubscribing: boolean;
};

export function PlanPickerCard({
  selectedPlan,
  currentPlan,
  onSelectPlan,
  onSubscribe,
  isSubscribing,
}: PlanPickerCardProps) {
  return (
    <Card data-testid="billing-plan-picker">
      <CardHeader>
        <CardTitle className="text-lg">Izaberite plan</CardTitle>
        <CardDescription className="text-sm">
          Odaberite plan koji najbolje odgovara vašim potrebama
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {PLAN_TIERS.map((tier) => {
            const config = PRICING_CONFIG[tier];
            const isSelected = selectedPlan === tier;
            const isCurrent = currentPlan === tier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => !isCurrent && onSelectPlan(tier)}
                disabled={isCurrent}
                data-testid={`plan-${tier}`}
                className={cn(
                  "relative rounded-xl border-2 p-4 text-left transition-all",
                  isCurrent
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 cursor-not-allowed opacity-75"
                    : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                )}
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
                {isCurrent && (
                  <span className="absolute -top-2 left-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                    Trenutni plan
                  </span>
                )}
                <p className="font-semibold text-foreground">{config.name}</p>
                <p className="text-xl font-bold text-foreground">
                  {config.price}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    RSD/{config.billingInterval === "MONTH" ? "mes" : "god"}
                  </span>
                </p>
                <ul className="mt-2 space-y-1">
                  {config.features.slice(0, 3).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <Check className="w-3 h-3 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <Button
          onClick={onSubscribe}
          disabled={isSubscribing || currentPlan === selectedPlan}
          className="w-full"
          size="lg"
          data-testid="subscribe-button"
        >
          {isSubscribing ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 w-4 h-4" />
          )}
          {isSubscribing ? "Preusmeravanje..." : "Pretplati se"}
        </Button>
      </CardContent>
    </Card>
  );
}
