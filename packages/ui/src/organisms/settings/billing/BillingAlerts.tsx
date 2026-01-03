import { AlertCircle, Check } from "lucide-react";

type BillingAlertsProps = {
  isLocked: boolean;
  success: boolean;
  canceled: boolean;
};

export function BillingAlerts({ isLocked, success, canceled }: BillingAlertsProps) {
  return (
    <>
      {isLocked && (
        <div
          role="alert"
          className="flex gap-3 items-center p-4 bg-amber-50 rounded-lg border border-amber-200 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-300">
            Vaša pretplata je istekla. Pretplatite se da biste nastavili da koristite sve funkcije.
          </span>
        </div>
      )}

      {success && (
        <div
          role="alert"
          className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200 dark:border-green-800 dark:bg-green-900/20"
        >
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">
            Uspešno ste se pretplatili! Hvala vam.
          </span>
        </div>
      )}

      {canceled && (
        <div
          role="alert"
          className="flex gap-3 items-center p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
        >
          <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-800 dark:text-gray-300">Plaćanje je otkazano.</span>
        </div>
      )}
    </>
  );
}
