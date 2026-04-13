import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { ScrollView, type ScrollViewProps, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettingsScrollViewStyles } from "./SettingsScrollView.styles";

type SettingsScrollViewProps = {
  children: ReactNode;
  stickyHeader?: ReactNode;
  paddingBottom?: number;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

export function SettingsScrollView({
  children,
  stickyHeader,
  paddingBottom = 100,
  keyboardShouldPersistTaps,
}: SettingsScrollViewProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useSettingsScrollViewStyles(theme, insets.top, paddingBottom, !!stickyHeader);

  return (
    <View style={styles.scrollView}>
      {stickyHeader && <View style={styles.stickyHeader}>{stickyHeader}</View>}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {children}
      </ScrollView>
    </View>
  );
}
