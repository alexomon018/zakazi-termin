import type { Theme } from "@/lib/theme";

export type BookingStatus = "ACCEPTED" | "PENDING" | "CANCELLED" | "REJECTED";

export function statusLabel(status: BookingStatus | string): string {
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

export function statusColor(status: BookingStatus | string, theme: Theme): string {
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
