import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { useAuth } from "./auth-context";
import { type Theme, getTheme } from "./theme";
import { trpc } from "./trpc";

type ColorSchemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  colorScheme: "light" | "dark";
  preference: ColorSchemePreference;
  setPreference: (p: ColorSchemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const rawScheme = useColorScheme();
  const systemScheme = rawScheme === "dark" ? "dark" : "light";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const meQuery = trpc.user.me.useQuery(undefined, {
    retry: false,
    enabled: isAuthenticated && !authLoading,
  });

  const dbPreference = meQuery.data?.theme;
  const resolvedPreference: ColorSchemePreference =
    dbPreference === "light" || dbPreference === "dark" ? dbPreference : "system";

  const [localPreference, setLocalPreference] = useState<ColorSchemePreference>("system");

  useEffect(() => {
    if (!meQuery.isLoading) {
      setLocalPreference(resolvedPreference);
    }
  }, [resolvedPreference, meQuery.isLoading]);

  const colorScheme: "light" | "dark" =
    localPreference === "system" ? systemScheme : localPreference;

  const themeValue = useMemo(() => getTheme(colorScheme), [colorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeValue,
      colorScheme,
      preference: localPreference,
      setPreference: setLocalPreference,
    }),
    [themeValue, colorScheme, localPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
