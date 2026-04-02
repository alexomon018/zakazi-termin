"use client";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { useEffect } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function ThemeSyncer() {
  const { status } = useSession();
  const { setTheme } = useNextTheme();
  const { data: user } = trpc.user.me.useQuery(undefined, {
    enabled: status === "authenticated",
  });
  useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme);
    }
  }, [user?.theme, setTheme]);
  return null;
}
export function ThemeProvider({ children }) {
  return _jsxs(NextThemesProvider, {
    attribute: "class",
    defaultTheme: "system",
    enableSystem: true,
    disableTransitionOnChange: true,
    children: [_jsx(ThemeSyncer, {}), children],
  });
}
export { useTheme } from "next-themes";
