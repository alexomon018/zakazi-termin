import { useTheme } from "@/lib/theme-context";
import { Text } from "react-native";

export function SectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <Text
      style={{
        fontSize: theme.typography.caption,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: theme.colors.mutedForeground,
        fontWeight: "600",
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs,
      }}
    >
      {title}
    </Text>
  );
}
