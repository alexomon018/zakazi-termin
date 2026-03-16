import { Check } from "lucide-react";

type InvoiceStatusBadgeProps = {
  status: string | null;
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Check className="w-3 h-3" />
          Plaćeno
        </span>
      );
    case "open":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Na čekanju
        </span>
      );
    case "draft":
      return (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          Nacrt
        </span>
      );
    case "uncollectible":
    case "void":
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Neuspelo
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          {status || "-"}
        </span>
      );
  }
}
