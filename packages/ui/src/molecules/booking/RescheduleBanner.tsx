import { RefreshCw } from "lucide-react";

interface RescheduleBannerProps {
  currentStartTime: Date;
}

export function RescheduleBanner({ currentStartTime }: RescheduleBannerProps) {
  return (
    <div className="flex gap-2 items-center p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
      <RefreshCw className="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-400" />
      <div>
        <p className="font-medium text-blue-900 dark:text-blue-100">Promena termina</p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Trenutni termin:{" "}
          {new Date(currentStartTime).toLocaleDateString("sr-RS", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          u{" "}
          {new Date(currentStartTime).toLocaleTimeString("sr-RS", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
