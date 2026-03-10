import { useTheme } from "@/lib/theme-context";
import { MoreHorizontal } from "lucide-react-native";
import { Pressable } from "react-native";

type MoreButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  /** Button size in pixels. Default: 36 */
  size?: number;
  /** When true, uses full-circle radius and surfaceMuted background. Default: false */
  filled?: boolean;
};

export function MoreButton({
  onPress,
  accessibilityLabel = "More actions",
  size = 36,
  filled = false,
}: MoreButtonProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens additional actions for this item"
      style={{
        width: size,
        height: size,
        borderRadius: filled ? size / 2 : theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: filled ? theme.colors.surfaceMuted : undefined,
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
