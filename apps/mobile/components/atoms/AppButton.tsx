import { useTheme } from "@/lib/theme-context";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  textColorOverride,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline" | "destructive";
  textColorOverride?: string;
}) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const containerStyle = useMemo(
    () => ({
      height: 46,
      borderRadius: theme.radius.sm,
      backgroundColor:
        variant === "outline"
          ? theme.colors.surface
          : variant === "destructive"
            ? theme.colors.destructive
            : theme.colors.primary,
      borderWidth: variant === "outline" ? 1 : 0,
      borderColor: variant === "outline" ? theme.colors.border : "transparent",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: theme.spacing.lg,
      opacity: isDisabled ? 0.6 : 1,
    }),
    [theme, variant, isDisabled]
  );

  const textColor =
    textColorOverride ??
    (variant === "outline"
      ? theme.colors.foreground
      : variant === "destructive"
        ? theme.colors.destructiveForeground
        : theme.colors.primaryForeground);

  return (
    <Pressable
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            fontSize: theme.typography.body,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
