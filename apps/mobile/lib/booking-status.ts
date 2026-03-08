import type { Theme } from "@/lib/theme";

export function statusLabel(status: string): string {
  switch (status) {
    case "ACCEPTED":
      return "Potvrđen";
    case "PENDING":
      return "Na čekanju";
    case "CANCELLED":
      return "Otkazan";
    case "REJECTED":
      return "Odbijen";
    default:
      return status;
  }
}

export function statusColor(status: string, theme: Theme): string {
  switch (status) {
    case "ACCEPTED":
      return theme.colors.success;
    case "PENDING":
      return theme.colors.accent;
    case "CANCELLED":
    case "REJECTED":
      return theme.colors.destructive;
    default:
      return theme.colors.mutedForeground;
  }
}
