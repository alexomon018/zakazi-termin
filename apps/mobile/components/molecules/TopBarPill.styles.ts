import type { Theme } from "@/lib/theme";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

export function useTopBarPillStyles(theme: Theme) {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          justifyContent: "flex-end",
          marginBottom: theme.spacing.md,
        },
        pill: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.full,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
      }),
    [theme]
  );
}
