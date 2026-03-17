import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  ConfirmDialog,
  FormField,
  QueryStateView,
  ScreenHeader,
  SectionHeader,
} from "@/components/atoms";
import { SettingsScrollView } from "@/components/molecules";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useMe } from "@/lib/use-me";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function ProfileSettingsScreen() {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const utils = trpc.useUtils();

  const meQuery = useMe();
  const [name, setName] = useState("");
  const [salonName, setSalonName] = useState("");
  const [bio, setBio] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateMutation = trpc.user.update.useMutation({
    onSuccess: async () => {
      await utils.user.me.invalidate();
    },
  });

  const deleteAccountMutation = trpc.user.deleteAccount.useMutation({
    onSuccess: async () => {
      setShowDeleteConfirm(false);
      await logout();
    },
  });

  useEffect(() => {
    if (meQuery.data) {
      setName(meQuery.data.name ?? "");
      setSalonName(meQuery.data.salonName ?? "");
      setBio(meQuery.data.bio ?? "");
    }
  }, [meQuery.data]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        multilineInput: { minHeight: 80, textAlignVertical: "top" },
        saveChip: {
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
          opacity: updateMutation.isPending ? 0.7 : 1,
        },
        infoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginVertical: theme.spacing.xs,
        },
        actions: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
      }),
    [theme, updateMutation.isPending]
  );

  if (meQuery.isLoading) {
    return <QueryStateView state="loading" />;
  }

  if (meQuery.error) {
    return (
      <QueryStateView
        state="error"
        message="Greška pri učitavanju profila."
        onRetry={() => meQuery.refetch()}
      />
    );
  }

  const role = meQuery.data?.membership?.role ?? "OWNER";
  const isOwner = role === "OWNER";
  const roleLabel = role === "OWNER" ? "Vlasnik" : role === "ADMIN" ? "Admin" : "Član";

  const handleSave = () => {
    const payload: { name?: string; salonName?: string; bio?: string } = {};
    if (name.trim()) payload.name = name.trim();
    if (isOwner && salonName.trim().length >= 3) payload.salonName = salonName.trim();
    if (isOwner) payload.bio = bio;
    updateMutation.mutate(payload);
  };

  return (
    <>
      <SettingsScrollView keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Profil"
          rightContent={
            <Pressable
              style={styles.saveChip}
              onPress={handleSave}
              disabled={updateMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Sačuvaj profil"
            >
              <AppText
                variant="bodySm"
                style={{ fontWeight: "700", color: theme.colors.primaryForeground }}
              >
                {updateMutation.isPending ? "Čuvanje..." : "Sačuvaj"}
              </AppText>
            </Pressable>
          }
        />
        <AppCard>
          <FormField label="Ime">
            <AppInput value={name} onChangeText={setName} placeholder="Vaše ime" />
          </FormField>

          {isOwner && (
            <FormField
              label="Naziv salona"
              error={
                salonName.trim().length > 0 && salonName.trim().length < 3
                  ? "Naziv mora imati najmanje 3 karaktera"
                  : undefined
              }
            >
              <AppInput
                value={salonName}
                onChangeText={setSalonName}
                placeholder="Naziv salona (min 3 karaktera)"
              />
            </FormField>
          )}

          {isOwner && (
            <FormField label="Bio">
              <AppInput
                value={bio}
                onChangeText={setBio}
                placeholder="Opis vašeg salona (opcionalno)"
                multiline
                numberOfLines={3}
                style={styles.multilineInput}
              />
            </FormField>
          )}

          <View style={styles.infoRow}>
            <AppText variant="bodySm" muted>
              Email
            </AppText>
            <AppText variant="bodySm">{meQuery.data?.email ?? "—"}</AppText>
          </View>

          <View style={styles.infoRow}>
            <AppText variant="bodySm" muted>
              Uloga
            </AppText>
            <AppText variant="bodySm">{roleLabel}</AppText>
          </View>
        </AppCard>

        <SectionHeader title="Opasna zona" />
        <AppCard>
          <AppText variant="bodySm" muted>
            Brisanje naloga je trajna akcija. Svi podaci će biti obrisani.
          </AppText>
          <View style={styles.actions}>
            <AppButton
              label="Obriši nalog"
              onPress={() => setShowDeleteConfirm(true)}
              variant="outline"
              textColorOverride={theme.colors.destructive}
            />
          </View>
        </AppCard>
      </SettingsScrollView>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Obriši nalog"
        message="Da li ste sigurni da želite da trajno obrišete vaš nalog? Ova akcija se ne može poništiti."
        confirmLabel="Obriši nalog"
        destructive
        loading={deleteAccountMutation.isPending}
        onConfirm={() => deleteAccountMutation.mutate({ confirmText: "DELETE" })}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
