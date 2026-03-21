import { useTheme } from "@/lib/theme-context";
import { Lock } from "lucide-react-native";
import { useMemo } from "react";
import { View } from "react-native";

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";

export function PaywallScreen({ onOpenBilling }: { onOpenBilling: () => void }) {
  const { theme } = useTheme();

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.md,
      },
      iconContainer: {
        marginBottom: theme.spacing.sm,
      },
      buttonContainer: {
        width: "100%" as const,
        marginTop: theme.spacing.md,
      },
    }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lock size={48} color={theme.colors.mutedForeground} />
      </View>
      <AppText variant="h1" centered>
        Pretplata je istekla
      </AppText>
      <AppText variant="bodySm" muted centered>
        Vaša pretplata ili probni period je istekao. Pretplatite se putem web aplikacije da biste
        nastavili sa korišćenjem.
      </AppText>
      <View style={styles.buttonContainer}>
        <AppButton label="Otvori web aplikaciju" onPress={onOpenBilling} />
      </View>
    </View>
  );
}
