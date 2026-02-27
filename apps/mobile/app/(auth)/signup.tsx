import { AppButton, AppCard, AppInput, AppScreen, AppText } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Link } from "expo-router";
import { Calendar } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function SignupScreen() {
  const { theme } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [salonName, setSalonName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    if (!name.trim() || !salonName.trim() || !email.trim() || !password.trim()) {
      setError("Sva polja su obavezna.");
      return;
    }

    if (password.length < 8) {
      setError("Lozinka mora imati najmanje 8 karaktera.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        salonName: salonName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registracija nije uspela. Pokušajte ponovo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        keyboardView: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.xl,
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                Započnite besplatni probni period
              </AppText>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <AppText variant="bodySm">Ime i prezime</AppText>
                <AppInput
                  placeholder="Vaše ime"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  textContentType="name"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputGroup}>
                <AppText variant="bodySm">Naziv salona</AppText>
                <AppInput
                  placeholder="Naziv vašeg salona"
                  value={salonName}
                  onChangeText={setSalonName}
                  autoCapitalize="words"
                  editable={!isSubmitting}
                />
              </View>

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
                  placeholder="Najmanje 8 karaktera"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="newPassword"
                  editable={!isSubmitting}
                />
              </View>

              {error && (
                <AppText variant="bodySm" centered style={{ color: theme.colors.destructive }}>
                  {error}
                </AppText>
              )}

              <AppButton label="Registrujte se" onPress={handleSignup} loading={isSubmitting} />

              <View style={styles.footer}>
                <AppText variant="bodySm" muted>
                  Već imate nalog?{" "}
                </AppText>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <AppText variant="bodySm" style={{ color: theme.colors.accent }}>
                      Prijavite se
                    </AppText>
                  </Pressable>
                </Link>
              </View>
            </View>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
