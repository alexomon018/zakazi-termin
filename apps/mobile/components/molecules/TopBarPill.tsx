import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useTopBarPillStyles } from "./TopBarPill.styles";

type TopBarPillProps = {
  children: ReactNode;
};

export function TopBarPill({ children }: TopBarPillProps) {
  const { theme } = useTheme();
  const styles = useTopBarPillStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.pill}>{children}</View>
    </View>
  );
}
