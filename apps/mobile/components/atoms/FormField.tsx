import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "./AppText";

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="bodySm">{label}</AppText>
      {children}
      {error && (
        <AppText variant="caption" style={{ color: theme.colors.destructive }}>
          {error}
        </AppText>
      )}
    </View>
  );
}
