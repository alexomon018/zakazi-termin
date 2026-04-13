import { AppButton, AppScreen, AppText, SalonkoIcon } from "@/components/atoms";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function LoginScreen() {
  const { theme, colorScheme } = useTheme();
  const { loginWithOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithOAuth();
    } catch (e) {
      console.error("Login failed:", e);
      setError("Prijava nije uspela. Pokušajte ponovo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingHorizontal: theme.spacing.xl,
        },
        center: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        logoIcon: {
          marginBottom: theme.spacing.sm,
        },
        bottom: {
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
        },
        loadingOverlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
          opacity: 0.94,
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={styles.logoIcon}>
            <SalonkoIcon
              size={40}
              color={colorScheme === "dark" ? "#FFFFFF" : theme.colors.primary}
            />
          </View>
          <AppText variant="h1">Salonko</AppText>
          <AppText variant="bodySm" muted centered>
            Upravljajte zakazivanjem iz jednog mesta
          </AppText>
        </View>

        <View style={styles.bottom}>
          {error && (
            <AppText variant="bodySm" centered style={{ color: theme.colors.destructive }}>
              {error}
            </AppText>
          )}
          <AppButton label="Prijavite se" onPress={handleLogin} loading={isSubmitting} />
        </View>
      </View>
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText variant="bodySm" muted centered>
            Završavamo prijavu...
          </AppText>
        </View>
      )}
    </AppScreen>
  );
}
