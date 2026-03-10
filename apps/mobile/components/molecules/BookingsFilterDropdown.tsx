import { AppText } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { CheckCircle } from "lucide-react-native";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

export type FilterKey = "upcoming" | "pending" | "history";

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "upcoming", label: "Dolazeći" },
  { key: "pending", label: "Na čekanju" },
  { key: "history", label: "Istorija" },
];

export function filterLabel(value: FilterKey): string {
  switch (value) {
    case "upcoming":
      return "Dolazeći";
    case "pending":
      return "Na čekanju";
    case "history":
      return "Istorija";
    default:
      return value;
  }
}

type BookingsFilterDropdownProps = {
  visible: boolean;
  selected: FilterKey;
  onSelect: (key: FilterKey) => void;
  onClose: () => void;
};

export function BookingsFilterDropdown({
  visible,
  selected,
  onSelect,
  onClose,
}: BookingsFilterDropdownProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.15)",
        },
        panelWrap: {
          position: "absolute",
          top: 104,
          right: theme.spacing.lg,
          left: theme.spacing.xl * 2,
        },
        panel: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          ...theme.shadow.md,
        },
        title: {
          marginBottom: theme.spacing.sm,
        },
        option: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: theme.radius.md,
          paddingVertical: 10,
          paddingHorizontal: 8,
        },
      }),
    [theme]
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.panelWrap} pointerEvents="box-none">
        <View style={styles.panel}>
          <AppText variant="body" muted style={styles.title}>
            Filtriraj po statusu
          </AppText>
          {filterOptions.map((option) => {
            const isSelected = option.key === selected;
            return (
              <Pressable
                key={option.key}
                style={styles.option}
                onPress={() => onSelect(option.key)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={isSelected ? `${option.label}, izabrano` : option.label}
              >
                <AppText variant="h2">{option.label}</AppText>
                {isSelected && (
                  <CheckCircle size={18} color={theme.colors.foreground} aria-hidden />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
