import { useTheme } from "@/lib/theme-context";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export function AppScreen({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {children}
    </SafeAreaView>
  );
}
