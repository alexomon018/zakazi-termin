import { useTheme } from "@/lib/theme-context";
import { Text, View } from "react-native";

export function SectionDateHeader({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xs }}>
      <Text
        style={{
          fontSize: theme.typography.caption,
          fontWeight: "600",
          color: theme.colors.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
