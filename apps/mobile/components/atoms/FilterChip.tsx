import { useTheme } from "@/lib/theme-context";
import { Pressable, Text } from "react-native";

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : theme.colors.border,
        backgroundColor: active ? theme.colors.primary : theme.colors.surface,
      }}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: theme.typography.bodySm,
          fontWeight: "500",
          color: active ? theme.colors.primaryForeground : theme.colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
