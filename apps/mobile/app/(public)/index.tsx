import { AppButton, AppCard, AppInput, AppScreen, AppText } from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function PublicLandingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [salonSlug, setSalonSlug] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: theme.spacing.lg,
        },
        form: {
          marginTop: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppCard>
          <AppText variant="h2" centered>
            Rezervišite termin
          </AppText>
          <AppText variant="bodySm" centered muted>
            Unesite naziv salona (slug) da biste videli dostupne usluge.
          </AppText>
          <View style={styles.form}>
            <AppInput
              value={salonSlug}
              onChangeText={setSalonSlug}
              placeholder="npr. moj-salon"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AppButton
              label="Prikaži usluge"
              onPress={() => router.push(`/(public)/${salonSlug.trim().toLowerCase()}`)}
              disabled={!salonSlug.trim()}
            />
          </View>
        </AppCard>
      </View>
    </AppScreen>
  );
}
