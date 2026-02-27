import { AppButton, AppCard, AppInput, AppScreen, AppText } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Link } from "expo-router";
import { Calendar } from "lucide-react-native";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Unesite email i lozinku.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prijava nije uspela. Pokušajte ponovo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        keyboardView: {
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
        form: {
          gap: theme.spacing.lg,
        },
        inputGroup: {
          gap: theme.spacing.xs,
        },
        footer: {
          flexDirection: "row",
          justifyContent: "center",
          marginTop: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <AppCard>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Calendar size={22} color={theme.colors.primaryForeground} />
              </View>
              <AppText variant="h1">Salonko</AppText>
            </View>
            <AppText variant="bodySm" muted centered>
              Prijavite se na svoj nalog
            </AppText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <AppText variant="bodySm">Email</AppText>
              <AppInput
                placeholder="vas@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <AppText variant="bodySm">Lozinka</AppText>
              <AppInput
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                editable={!isSubmitting}
                onSubmitEditing={handleLogin}
              />
            </View>

            {error && (
              <AppText variant="bodySm" centered style={{ color: theme.colors.destructive }}>
                {error}
              </AppText>
            )}

            <AppButton label="Prijavite se" onPress={handleLogin} loading={isSubmitting} />

            <View style={styles.footer}>
              <AppText variant="bodySm" muted>
                Nemate nalog?{" "}
              </AppText>
              <Link href="/(auth)/signup" asChild>
                <Pressable>
                  <AppText variant="bodySm" style={{ color: theme.colors.accent }}>
                    Registrujte se
                  </AppText>
                </Pressable>
              </Link>
            </View>
          </View>
        </AppCard>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
