import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  ConfirmDialog,
  ScreenHeader,
  SectionHeader,
} from "@/components/atoms";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileSettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const utils = trpc.useUtils();

  const meQuery = trpc.user.me.useQuery(undefined, { retry: false });
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
        scrollView: { flex: 1, backgroundColor: theme.colors.background },
        content: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.sm,
          gap: theme.spacing.md,
          paddingBottom: 100,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        },
        formGroup: { gap: theme.spacing.xs, marginBottom: theme.spacing.sm },
        multilineInput: { minHeight: 80, textAlignVertical: "top" },
        infoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginVertical: theme.spacing.xs,
        },
        actions: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
      }),
    [theme, insets.top]
  );

  if (meQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (meQuery.error) {
    return (
      <View style={styles.centered}>
        <AppText variant="bodySm" muted centered>
          Greška pri učitavanju profila.
        </AppText>
        <AppButton label="Pokušaj ponovo" onPress={() => meQuery.refetch()} variant="outline" />
      </View>
    );
  }

  const role = meQuery.data?.membership?.role ?? "OWNER";
  const isOwner = role === "OWNER";

  const handleSave = () => {
    const payload: { name?: string; salonName?: string; bio?: string } = {};
    if (name.trim()) payload.name = name.trim();
    if (isOwner && salonName.trim().length >= 3) payload.salonName = salonName.trim();
    if (isOwner) payload.bio = bio;
    updateMutation.mutate(payload);
  };

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Profil" />
        <AppCard>
          <View style={styles.formGroup}>
            <AppText variant="bodySm">Ime</AppText>
            <AppInput value={name} onChangeText={setName} placeholder="Vaše ime" />
          </View>

          {isOwner && (
            <View style={styles.formGroup}>
              <AppText variant="bodySm">Naziv salona</AppText>
              <AppInput
                value={salonName}
                onChangeText={setSalonName}
                placeholder="Naziv salona (min 3 karaktera)"
              />
              {salonName.trim().length > 0 && salonName.trim().length < 3 && (
                <AppText variant="caption" muted>
                  Naziv mora imati najmanje 3 karaktera
                </AppText>
              )}
            </View>
          )}

          {isOwner && (
            <View style={styles.formGroup}>
              <AppText variant="bodySm">Bio</AppText>
              <AppInput
                value={bio}
                onChangeText={setBio}
                placeholder="Opis vašeg salona (opcionalno)"
                multiline
                numberOfLines={3}
                style={styles.multilineInput}
              />
            </View>
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
            <AppText variant="bodySm">{role}</AppText>
          </View>

          <View style={styles.actions}>
            <AppButton
              label="Sačuvaj profil"
              onPress={handleSave}
              loading={updateMutation.isPending}
            />
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
              variant="destructive"
            />
          </View>
        </AppCard>
      </ScrollView>

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
