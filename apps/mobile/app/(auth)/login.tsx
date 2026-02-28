import { AppButton, AppCard, AppScreen, AppText } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Calendar } from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { loginWithOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithOAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prijava nije uspela. Pokušajte ponovo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: theme.spacing.xl,
        },
        header: {
          alignItems: "center",
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.xl,
        },
        logoRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          marginBottom: theme.spacing.xs,
        },
        logoIcon: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        actions: {
          gap: theme.spacing.lg,
        },
      }),
    [theme]
  );

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppCard>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Calendar size={22} color={theme.colors.primaryForeground} />
              </View>
              <AppText variant="h1">Salonko</AppText>
            </View>
            <AppText variant="bodySm" muted centered>
              Upravljajte zakazivanjem iz jednog mesta
            </AppText>
          </View>

          <View style={styles.actions}>
            {error && (
              <AppText variant="bodySm" centered style={{ color: theme.colors.destructive }}>
                {error}
              </AppText>
            )}

            <AppButton label="Prijavite se" onPress={handleLogin} loading={isSubmitting} />
          </View>
        </AppCard>
      </View>
    </AppScreen>
  );
}
