"use client";

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { useEffect } from "react";

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeSyncer />
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from "next-themes";
