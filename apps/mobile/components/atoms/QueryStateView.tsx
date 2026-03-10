import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { useQueryStateViewStyles } from "./QueryStateView.styles";

type QueryStateViewProps = {
  /** "full" fills the parent (flex:1); "inline" uses vertical padding (for inside ScrollView) */
  variant?: "full" | "inline";
} & (
  | { state: "loading" }
  | { state: "error"; message?: string; onRetry?: () => void }
  | { state: "empty"; title: string; message?: string; icon?: ReactNode }
);

export function QueryStateView(props: QueryStateViewProps) {
  const { theme } = useTheme();
  const { variant = "full", state } = props;
  const styles = useQueryStateViewStyles(theme, variant);

  if (state === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (state === "error") {
    const { message, onRetry } = props;
    return (
      <View style={styles.container}>
        <AppText variant="h2" centered>
          Greška pri učitavanju
        </AppText>
        {message && (
          <AppText variant="bodySm" muted centered>
            {message}
          </AppText>
        )}
        {onRetry && <AppButton label="Pokušaj ponovo" onPress={onRetry} variant="outline" />}
      </View>
    );
  }

  const { title, message, icon } = props;
  return (
    <View style={styles.container}>
      {icon}
      <AppText variant="h2" centered>
        {title}
      </AppText>
      {message && (
        <AppText variant="bodySm" muted centered>
          {message}
        </AppText>
      )}
    </View>
  );
}
