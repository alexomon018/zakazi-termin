import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { ScrollView, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettingsScrollViewStyles } from "./SettingsScrollView.styles";

type SettingsScrollViewProps = {
  children: ReactNode;
  paddingBottom?: number;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

export function SettingsScrollView({
  children,
  paddingBottom = 100,
  keyboardShouldPersistTaps,
}: SettingsScrollViewProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useSettingsScrollViewStyles(theme, insets.top, paddingBottom);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  );
}
