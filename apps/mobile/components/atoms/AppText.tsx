import { typography } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { Text, type TextStyle } from "react-native";

type TextVariant = "title" | "h1" | "h2" | "body" | "bodySm" | "caption";

const textVariantStyles: Record<TextVariant, TextStyle> = {
  title: { fontSize: typography.title, fontWeight: "800", letterSpacing: -0.5 },
  h1: { fontSize: typography.h1, fontWeight: "700", letterSpacing: -0.3 },
  h2: { fontSize: typography.h2, fontWeight: "600" },
  body: { fontSize: typography.body, fontWeight: "400" },
  bodySm: { fontSize: typography.bodySm, fontWeight: "400" },
  caption: { fontSize: typography.caption, fontWeight: "400" },
};

export function AppText({
  children,
  variant = "body",
  muted = false,
  centered = false,
  style,
}: {
  children: ReactNode;
  variant?: TextVariant;
  muted?: boolean;
  centered?: boolean;
  style?: TextStyle;
}) {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        { color: theme.colors.foreground },
        textVariantStyles[variant],
        muted && { color: theme.colors.mutedForeground },
        centered && { textAlign: "center" },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
