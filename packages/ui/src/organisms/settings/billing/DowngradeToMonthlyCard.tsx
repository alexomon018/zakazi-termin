import { PRICING_CONFIG } from "@salonko/config";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { CalendarClock, Loader2 } from "lucide-react";

import type { SubscriptionStatus } from "./types";

type DowngradeToMonthlyCardProps = {
  status: SubscriptionStatus;
  onOpenDowngradeDialog: () => void;
  isDowngrading: boolean;
};

export function DowngradeToMonthlyCard({
  status,
  onOpenDowngradeDialog,
  isDowngrading,
}: DowngradeToMonthlyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pređite na mesečnu pretplatu</CardTitle>
        <CardDescription className="text-sm">
          Mesečni plan se naplaćuje svakog meseca
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg border bg-muted/30">
          <p className="font-semibold text-foreground">Mesečna pretplata</p>
          <p className="text-2xl font-bold text-foreground">
            {PRICING_CONFIG.monthly.price}{" "}
            <span className="text-sm font-normal text-muted-foreground">RSD/mes</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nova cena stupa na snagu na kraju trenutnog perioda
            {status.currentPeriodEnd && (
              <>
                {" "}
                (
                {new Date(status.currentPeriodEnd).toLocaleDateString("sr-RS", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                )
              </>
            )}
          </p>
        </div>
        <Button
          onClick={onOpenDowngradeDialog}
          disabled={isDowngrading}
          className="w-full"
          variant="outline"
        >
          {isDowngrading ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <CalendarClock className="mr-2 w-4 h-4" />
          )}
          {isDowngrading ? "Promena..." : "Pređi na mesečni plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
