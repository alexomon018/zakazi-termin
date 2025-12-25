"use client";

import { ThemeProvider } from "@/lib/theme-provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </TRPCProvider>
    </SessionProvider>
  );
}
