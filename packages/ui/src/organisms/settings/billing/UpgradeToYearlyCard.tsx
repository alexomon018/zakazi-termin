import { PRICING_CONFIG } from "@salonko/config";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { Crown, Loader2 } from "lucide-react";

import type { SubscriptionStatus } from "./types";

type UpgradeToYearlyCardProps = {
  status: SubscriptionStatus;
  onOpenUpgradeDialog: () => void;
  isUpgrading: boolean;
};

export function UpgradeToYearlyCard({
  status,
  onOpenUpgradeDialog,
  isUpgrading,
}: UpgradeToYearlyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Nadogradite na godišnju pretplatu</CardTitle>
        <CardDescription className="text-sm">
          Uštedite {PRICING_CONFIG.yearly.savings} prelaskom na godišnji plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
          <p className="font-semibold text-foreground">Godišnja pretplata</p>
          <p className="text-2xl font-bold text-foreground">
            {PRICING_CONFIG.yearly.price}{" "}
            <span className="text-sm font-normal text-muted-foreground">RSD/god</span>
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
        <Button onClick={onOpenUpgradeDialog} disabled={isUpgrading} className="w-full">
          {isUpgrading ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <Crown className="mr-2 w-4 h-4" />
          )}
          {isUpgrading ? "Nadogradnja..." : "Nadogradi na godišnji plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
