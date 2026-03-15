import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * When `label` is omitted (icon-only FAB), provide `accessibilityLabel`
 * so screen-readers can announce the button's purpose.
 */
export function FAB({
  onPress,
  icon,
  label,
  accessibilityLabel,
}: {
  onPress: () => void;
  icon: ReactNode;
  label?: string;
  accessibilityLabel?: string;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={label ?? accessibilityLabel}
      style={{
        position: "absolute",
        bottom: insets.bottom + 16,
        right: theme.spacing.xl,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.full,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        ...theme.shadow.md,
      }}
      onPress={onPress}
    >
      {icon}
      {label && (
        <Text
          style={{
            fontSize: theme.typography.bodySm,
            fontWeight: "600",
            color: theme.colors.primaryForeground,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
