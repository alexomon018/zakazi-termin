import { PRICING_CONFIG } from "@salonko/config";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { CreditCard, Loader2 } from "lucide-react";

type PlanPickerCardProps = {
  selectedInterval: "monthly" | "yearly";
  onSelectInterval: (interval: "monthly" | "yearly") => void;
  onSubscribe: () => void;
  isSubscribing: boolean;
};

export function PlanPickerCard({
  selectedInterval,
  onSelectInterval,
  onSubscribe,
  isSubscribing,
}: PlanPickerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Izaberite plan</CardTitle>
        <CardDescription className="text-sm">
          Odaberite mesečnu ili godišnju pretplatu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectInterval("monthly")}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              selectedInterval === "monthly"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="font-semibold text-foreground">Mesečna</p>
            <p className="text-2xl font-bold text-foreground">
              {PRICING_CONFIG.monthly.price}{" "}
              <span className="text-sm font-normal text-muted-foreground">RSD/mes</span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectInterval("yearly")}
            className={`relative rounded-xl border-2 p-4 text-left transition-all ${
              selectedInterval === "yearly"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {PRICING_CONFIG.yearly.savings && (
              <span className="absolute -top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                {PRICING_CONFIG.yearly.savings}
              </span>
            )}
            <p className="font-semibold text-foreground">Godišnja</p>
            <p className="text-2xl font-bold text-foreground">
              {PRICING_CONFIG.yearly.price}{" "}
              <span className="text-sm font-normal text-muted-foreground">RSD/god</span>
            </p>
          </button>
        </div>

        <Button onClick={onSubscribe} disabled={isSubscribing} className="w-full" size="lg">
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
