import { AppButton, SectionHeader } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

type TeamInviteActionsProps = {
  onOpenInviteModal: () => void;
  onCreateLink: () => void;
  isCreatingLink: boolean;
};

export function TeamInviteActions({
  onOpenInviteModal,
  onCreateLink,
  isCreatingLink,
}: TeamInviteActionsProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { gap: theme.spacing.sm },
      }),
    [theme]
  );

  return (
    <>
      <SectionHeader title="Pozovi člana" />
      <View style={styles.container}>
        <AppButton label="Pozovi putem email-a" onPress={onOpenInviteModal} />
        <AppButton
          label="Kreiraj link za pozivnicu"
          variant="outline"
          loading={isCreatingLink}
          onPress={onCreateLink}
        />
      </View>
    </>
  );
}
