import type { Theme } from "@/lib/theme";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

export function useQueryStateViewStyles(theme: Theme, variant: "full" | "inline") {
  return useMemo(
    () =>
      StyleSheet.create({
        container:
          variant === "full"
            ? {
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: theme.colors.background,
                gap: theme.spacing.md,
              }
            : {
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: theme.spacing.xxl * 2,
                gap: theme.spacing.sm,
              },
      }),
    [theme, variant]
  );
}
