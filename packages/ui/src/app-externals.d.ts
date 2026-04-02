// Ambient module declarations for app-level imports.
// The ui package uses these modules from the host app (apps/web).
// In composite mode, we can't reference files outside rootDir,
// so we declare the expected module shapes here.

declare module "@/lib/trpc/client" {
  import type { AppRouter } from "@salonko/trpc";
  import type { CreateTRPCReact } from "@trpc/react-query";
  export const trpc: CreateTRPCReact<AppRouter, unknown>;
}

declare module "@/lib/theme-provider" {
  export { useTheme } from "next-themes";
  export function ThemeProvider(props: {
    children: React.ReactNode;
  }): React.ReactElement;
}
