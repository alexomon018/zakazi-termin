import { Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import { formatTrialTimeRemaining } from "@salonko/ui/lib/utils/formatTrialTime";
import { Crown } from "lucide-react";

import type { SubscriptionStatus } from "./types";

type CurrentStatusCardProps = {
  status: SubscriptionStatus;
};

export function CurrentStatusCard({ status }: CurrentStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center text-lg">
          <Crown className="w-5 h-5" />
          Trenutni status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status.isInTrial ? (
          <div className="space-y-1">
            <p className="text-base font-semibold text-green-600 dark:text-green-400">
              Probni period aktivan
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Imate još{" "}
              <strong>
                {formatTrialTimeRemaining(status.trialDaysRemaining, status.trialEndsAt)}
              </strong>{" "}
              besplatnog pristupa.
            </p>
          </div>
        ) : status.status === "ACTIVE" ? (
          <div className="space-y-1">
            <p className="text-base font-semibold text-green-600 dark:text-green-400">
              Aktivna pretplata
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status.billingInterval === "YEAR" ? "Godišnja" : "Mesečna"} pretplata
              {status.cancelAtPeriodEnd && " (otkazana, aktivna do kraja perioda)"}
            </p>
            {status.currentPeriodEnd && (
              <p className="text-xs text-gray-500">
                Sledeća naplata:{" "}
                {new Date(status.currentPeriodEnd).toLocaleDateString("sr-RS", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        ) : !status.hasSubscription ? (
          <div className="space-y-1">
            <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
              Nemate pretplatu
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pretplatite se da biste koristili sve funkcije aplikacije.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              {status.status === "PAST_DUE" ? "Plaćanje neuspešno" : "Pretplata istekla"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status.status === "PAST_DUE"
                ? "Ažurirajte način plaćanja da biste nastavili da koristite Zakazi Termin."
                : "Pretplatite se da biste nastavili da koristite Zakazi Termin."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
