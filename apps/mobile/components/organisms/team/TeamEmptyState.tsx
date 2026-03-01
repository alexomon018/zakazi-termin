import { AppButton, AppText, InputDialog } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

type TeamEmptyStateProps = {
  salonName: string | null;
  isCreating: boolean;
  onCreate: (name: string) => void;
};

export function TeamEmptyState({ salonName, isCreating, onCreate }: TeamEmptyStateProps) {
  const { theme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const features = ["Zajednicki kalendar", "Podela usluga", "Upravljanje ulogama"];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing.xl,
        },
        content: {
          alignItems: "center",
          gap: theme.spacing.lg,
          maxWidth: 320,
        },
        iconCircle: {
          width: 80,
          height: 80,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: theme.spacing.sm,
        },
        features: {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: theme.spacing.sm,
          marginTop: theme.spacing.xs,
        },
        featureChip: {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: 6,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.surface,
        },
      }),
    [theme]
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Users size={32} color={theme.colors.primary} />
          </View>

          <AppText variant="h2" centered>
            Nemate organizaciju
          </AppText>

          <AppText variant="bodySm" centered muted>
            Organizacija vam omogucava da upravljate timom, delite usluge i koordinirate rasporede
            na jednom mestu.
          </AppText>

          <View style={styles.features}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureChip}>
                <AppText
                  variant="caption"
                  style={{ color: theme.colors.primary, fontWeight: "500" }}
                >
                  {feature}
                </AppText>
              </View>
            ))}
          </View>

          <AppButton
            label="Kreiraj organizaciju"
            onPress={() => {
              setNameInput(salonName ?? "");
              setDialogOpen(true);
            }}
          />
        </View>
      </View>

      <InputDialog
        visible={dialogOpen}
        title="Kreiraj organizaciju"
        placeholder="Naziv organizacije"
        value={nameInput}
        onChangeText={setNameInput}
        confirmLabel="Kreiraj"
        loading={isCreating}
        onConfirm={() => {
          if (nameInput.trim()) {
            onCreate(nameInput.trim());
          }
        }}
        onCancel={() => {
          setDialogOpen(false);
          setNameInput("");
        }}
      />
    </>
  );
}
