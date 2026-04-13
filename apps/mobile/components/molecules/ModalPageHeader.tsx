import { AppButton, AppText } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

type ModalPageHeaderProps = {
  title: string;
  onClose: () => void;
  closeLabel?: string;
};

export function ModalPageHeader({ title, onClose, closeLabel = "Zatvori" }: ModalPageHeaderProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.header}>
      <AppText variant="h2">{title}</AppText>
      <AppButton label={closeLabel} onPress={onClose} variant="outline" />
    </View>
  );
}
