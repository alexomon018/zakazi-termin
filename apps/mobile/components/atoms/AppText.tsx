import { fontFamily, typography } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";

type TextVariant = "title" | "h1" | "h2" | "body" | "bodySm" | "caption";

const textVariantStyles: Record<TextVariant, TextStyle> = {
  title: { fontSize: typography.title, fontFamily: fontFamily.heading.black, letterSpacing: -0.5 },
  h1: { fontSize: typography.h1, fontFamily: fontFamily.heading.bold, letterSpacing: -0.3 },
  h2: { fontSize: typography.h2, fontFamily: fontFamily.body.semiBold },
  body: { fontSize: typography.body },
  bodySm: { fontSize: typography.bodySm },
  caption: { fontSize: typography.caption },
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
  style?: StyleProp<TextStyle>;
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
