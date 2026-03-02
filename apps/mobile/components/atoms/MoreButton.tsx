import { useTheme } from "@/lib/theme-context";
import { MoreHorizontal } from "lucide-react-native";
import { Pressable } from "react-native";

export function MoreButton({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="More actions"
      accessibilityHint="Opens additional actions for this item"
      style={{
        width: 36,
        height: 36,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
      }}
      onPress={onPress}
      hitSlop={8}
    >
      <MoreHorizontal size={20} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}
