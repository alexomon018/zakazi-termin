import { useTheme } from "@/lib/theme-context";
import { Search, X } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Pretraži...",
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
        gap: theme.spacing.sm,
      }}
    >
      <Search size={16} color={theme.colors.mutedForeground} />
      <TextInput
        style={{
          flex: 1,
          fontSize: theme.typography.bodySm,
          color: theme.colors.foreground,
          padding: 0,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <X size={16} color={theme.colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}
