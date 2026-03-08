import { useTheme } from "@/lib/theme-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { type ReactNode, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";

type ScreenHeaderProps = {
  title: string;
  rightContent?: ReactNode;
};

export function ScreenHeader({ title, rightContent }: ScreenHeaderProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        topRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        },
        backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        titleText: { flex: 1, fontWeight: "700" },
      }),
    [theme]
  );

  return (
    <View style={styles.topRow}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Nazad"
        accessibilityHint="Navigira na prethodni ekran"
      >
        <ChevronLeft size={20} color={theme.colors.foreground} />
      </Pressable>
      <AppText variant="h2" style={styles.titleText}>
        {title}
      </AppText>
      {rightContent}
    </View>
  );
}
