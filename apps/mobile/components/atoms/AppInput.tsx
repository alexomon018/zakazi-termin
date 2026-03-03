import { useTheme } from "@/lib/theme-context";
import { TextInput, type TextInputProps } from "react-native";

export function AppInput(props: TextInputProps) {
  const { theme } = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.colors.mutedForeground}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.input,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          fontSize: theme.typography.body,
          color: theme.colors.foreground,
          backgroundColor: theme.colors.surface,
        },
        props.style,
      ]}
    />
  );
}
