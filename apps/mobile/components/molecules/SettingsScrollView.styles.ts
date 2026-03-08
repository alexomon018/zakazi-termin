import type { Theme } from "@/lib/theme";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

export function useSettingsScrollViewStyles(theme: Theme, topInset: number, paddingBottom: number) {
  return useMemo(
    () =>
      StyleSheet.create({
        scrollView: { flex: 1, backgroundColor: theme.colors.background },
        content: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: topInset + theme.spacing.sm,
          gap: theme.spacing.md,
          paddingBottom,
        },
      }),
    [theme, topInset, paddingBottom]
  );
}
