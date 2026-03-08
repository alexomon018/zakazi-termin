import { AppText } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

type DatePickerFieldProps = {
  label: string;
  value: Date;
  minimumDate?: Date;
  showPicker: boolean;
  onToggle: () => void;
  onPickerDismiss: () => void;
  onChange: (date: Date) => void;
};

export function DatePickerField({
  label,
  value,
  minimumDate,
  showPicker,
  onToggle,
  onPickerDismiss,
  onChange,
}: DatePickerFieldProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        formGroup: { gap: theme.spacing.xs },
        dateButton: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          backgroundColor: theme.colors.surface,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.formGroup}>
      <AppText variant="bodySm">{label}</AppText>
      <Pressable style={styles.dateButton} onPress={onToggle}>
        <AppText variant="body">{value.toLocaleDateString("sr-RS")}</AppText>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={minimumDate}
          onChange={(_, date) => {
            if (Platform.OS !== "ios") {
              onPickerDismiss();
            }
            if (date) onChange(date);
          }}
        />
      )}
    </View>
  );
}
