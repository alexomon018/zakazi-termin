import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FAB({
  onPress,
  icon,
  label,
}: {
  onPress: () => void;
  icon: ReactNode;
  label?: string;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      style={{
        position: "absolute",
        bottom: insets.bottom + 64,
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
