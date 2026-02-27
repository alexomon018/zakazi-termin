const lightColors = {
  background: "#F9FAFB",
  surface: "#ffffff",
  surfaceMuted: "#F1F5F9",
  foreground: "#0f172a",
  mutedForeground: "#64748b",
  primary: "#0f172a",
  primaryForeground: "#ffffff",
  border: "#e2e8f0",
  input: "#e2e8f0",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#16a34a",
  accent: "#2563eb",
};

const darkColors = {
  background: "#181C24",
  surface: "#1F2937",
  surfaceMuted: "#1E293B",
  foreground: "#F9FAFB",
  mutedForeground: "#A8B5C8",
  primary: "#F9FAFB",
  primaryForeground: "#0F172A",
  border: "#334155",
  input: "#334155",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#22c55e",
  accent: "#3b82f6",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const typography = {
  title: 28,
  h1: 24,
  h2: 20,
  body: 16,
  bodySm: 14,
  caption: 12,
} as const;

const lightShadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

const darkShadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export function getTheme(mode: "light" | "dark") {
  return {
    colors: mode === "dark" ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    shadow: mode === "dark" ? darkShadow : lightShadow,
  } as const;
}

/** Backward-compat alias — use `useTheme()` from theme-context instead */
export const theme = getTheme("light");

export type Theme = ReturnType<typeof getTheme>;
export type ThemeColors = typeof lightColors;
