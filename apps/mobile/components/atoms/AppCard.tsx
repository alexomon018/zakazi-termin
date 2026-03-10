import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { View } from "react-native";

export function AppCard({ children, gap }: { children: ReactNode; gap?: number }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        ...(gap != null && { gap }),
      }}
    >
      {children}
    </View>
  );
}
