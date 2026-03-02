import { AppButton, AppInput, AppText, FilterChip } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { Mail } from "lucide-react-native";
import { useMemo } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

type TeamInviteMemberModalProps = {
  visible: boolean;
  inviteEmail: string;
  inviteRole: "ADMIN" | "MEMBER";
  canChangeRoles: boolean;
  isInviting: boolean;
  onEmailChange: (email: string) => void;
  onRoleChange: (role: "ADMIN" | "MEMBER") => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function TeamInviteMemberModal({
  visible,
  inviteEmail,
  inviteRole,
  canChangeRoles,
  isInviting,
  onEmailChange,
  onRoleChange,
  onSubmit,
  onClose,
}: TeamInviteMemberModalProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        formContent: {
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        iconRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
        },
        iconCircle: {
          width: 48,
          height: 48,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        },
        formGroup: {
          gap: theme.spacing.xs,
        },
        roleChips: {
          flexDirection: "row",
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="h2">Pozovi člana</AppText>
          <AppButton label="Zatvori" onPress={onClose} variant="outline" />
        </View>
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <Mail size={24} color={theme.colors.primary} />
            </View>
            <AppText variant="bodySm" muted>
              Pošaljite pozivnicu putem email-a. Primljeni korisnik će dobiti link za pridruživanje.
            </AppText>
          </View>

          <View style={styles.formGroup}>
            <AppText variant="bodySm">Email adresa</AppText>
            <AppInput
              value={inviteEmail}
              onChangeText={onEmailChange}
              placeholder="ime@primer.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {inviteEmail.trim() !== "" && !isValidEmail(inviteEmail.trim()) && (
              <AppText variant="caption" style={{ color: theme.colors.destructive }}>
                Unesite validnu email adresu
              </AppText>
            )}
          </View>

          <View style={styles.formGroup}>
            <AppText variant="bodySm">Uloga</AppText>
            <View style={styles.roleChips}>
              <FilterChip
                label="Član"
                active={inviteRole === "MEMBER"}
                onPress={() => onRoleChange("MEMBER")}
              />
              {canChangeRoles && (
                <FilterChip
                  label="Administrator"
                  active={inviteRole === "ADMIN"}
                  onPress={() => onRoleChange("ADMIN")}
                />
              )}
            </View>
            <AppText variant="caption" muted>
              {inviteRole === "MEMBER"
                ? "Član može upravljati svojim uslugama i terminima."
                : "Administrator može pozivati i uklanjati članove."}
            </AppText>
          </View>

          <AppButton
            label="Pošalji pozivnicu"
            onPress={onSubmit}
            loading={isInviting}
            disabled={!inviteEmail.trim() || !isValidEmail(inviteEmail.trim())}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
