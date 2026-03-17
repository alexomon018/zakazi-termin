const lightColors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceMuted: "#F7F0F4",
  foreground: "#180F13",
  mutedForeground: "#7D6972",
  primary: "#BA3678",
  primaryForeground: "#FFFFFF",
  border: "#EDE2E8",
  input: "#EDE2E8",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#16a34a",
  accent: "#F7F0F4",
  primaryTint: "#F5E4ED",
  warning: "#D97706",
};

const darkColors = {
  background: "#1C1719",
  surface: "#272024",
  surfaceMuted: "#352B30",
  foreground: "#F7F0F4",
  mutedForeground: "#BDA8B2",
  primary: "#E07AA8",
  primaryForeground: "#1C1719",
  border: "#473A40",
  input: "#3E3237",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#22c55e",
  accent: "#352B30",
  primaryTint: "#2D1F26",
  warning: "#FBBF24",
};

export const spacing = {
  xs: 4,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const fontFamily = {
  heading: {
    regular: "Lato_400Regular",
    bold: "Lato_700Bold",
    black: "Lato_900Black",
  },
  body: {
    regular: "OpenSans_400Regular",
    medium: "OpenSans_500Medium",
    semiBold: "OpenSans_600SemiBold",
    bold: "OpenSans_700Bold",
  },
} as const;

export const typography = {
  title: 24,
  h1: 20,
  h2: 17,
  body: 15,
  bodySm: 13,
  caption: 11,
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
