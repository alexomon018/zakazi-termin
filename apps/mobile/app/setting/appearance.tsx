import { AppCard, AppText, QueryStateView, ScreenHeader, SectionHeader } from "@/components/atoms";
import { SettingsScrollView } from "@/components/molecules";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useMe } from "@/lib/use-me";
import { Check } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

const THEMES = [
  { value: "light", label: "Svetla" },
  { value: "dark", label: "Tamna" },
  { value: "system", label: "Sistem" },
] as const;

const BRAND_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0d9488",
  "#0284c7",
  "#4f46e5",
];

const BRAND_COLOR_NAMES: Record<string, string> = {
  "#2563eb": "plava",
  "#7c3aed": "ljubičasta",
  "#db2777": "roze",
  "#ea580c": "narandžasta",
  "#16a34a": "zelena",
  "#0d9488": "tirkizna",
  "#0284c7": "svetloplava",
  "#4f46e5": "indigo",
};

const getColorName = (hex: string) => BRAND_COLOR_NAMES[hex] ?? hex;

export default function AppearanceSettingsScreen() {
  const { theme, preference, setPreference } = useTheme();
  const utils = trpc.useUtils();
  const meQuery = useMe();

  const appearanceMutation = trpc.user.updateAppearance.useMutation({
    onSuccess: async () => {
      await utils.user.me.invalidate();
    },
    onError: (error) => {
      Alert.alert("Greška", error.message || "Nije moguće sačuvati podešavanja izgleda.");
    },
  });

  const [optimisticBrandColor, setOptimisticBrandColor] = useState<string | null>(null);

  const handleThemeSelect = (value: "light" | "dark" | "system") => {
    const previous = preference;
    setPreference(value);
    appearanceMutation.mutate(
      {
        theme: value === "system" ? null : value,
      },
      {
        onError: () => {
          setPreference(previous);
        },
      }
    );
  };

  const handleBrandColorSelect = (color: string) => {
    const previous = optimisticBrandColor ?? meQuery.data?.brandColor ?? "#2563eb";
    setOptimisticBrandColor(color);
    appearanceMutation.mutate(
      { brandColor: color },
      {
        onSuccess: () => setOptimisticBrandColor(null),
        onError: () => setOptimisticBrandColor(previous),
      }
    );
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        themeRow: { gap: theme.spacing.sm },
        themeOption: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        themeOptionActive: {
          borderColor: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}08`,
        },
        colorGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.md,
          marginTop: theme.spacing.sm,
        },
        colorSwatch: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
        },
        colorSwatchActive: {
          borderWidth: 3,
          borderColor: theme.colors.foreground,
        },
      }),
    [theme]
  );

  if (meQuery.isLoading) {
    return <QueryStateView state="loading" />;
  }

  if (meQuery.isError) {
    return <QueryStateView state="error" onRetry={() => meQuery.refetch()} />;
  }

  const currentTheme = preference;
  const currentBrandColor = optimisticBrandColor ?? meQuery.data?.brandColor ?? "#2563eb";

  return (
    <SettingsScrollView>
      <ScreenHeader title="Izgled" />
      <SectionHeader title="Tema" />
      <AppCard>
        <View style={styles.themeRow}>
          {THEMES.map((t) => (
            <Pressable
              key={t.value}
              style={[styles.themeOption, currentTheme === t.value && styles.themeOptionActive]}
              onPress={() => handleThemeSelect(t.value)}
              accessibilityRole="button"
              accessibilityLabel={`${t.label} tema`}
              accessibilityState={{ selected: currentTheme === t.value }}
            >
              <AppText variant="bodySm">{t.label}</AppText>
              {currentTheme === t.value && (
                <Check size={16} color={theme.colors.primary} accessible={false} />
              )}
            </Pressable>
          ))}
        </View>
      </AppCard>

      <SectionHeader title="Boja brenda" />
      <AppCard>
        <AppText variant="bodySm" muted>
          Izaberite boju koja će se koristiti na vašoj stranici za rezervacije.
        </AppText>
        <View style={styles.colorGrid}>
          {BRAND_COLORS.map((color) => (
            <Pressable
              key={color}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                currentBrandColor === color && styles.colorSwatchActive,
              ]}
              onPress={() => handleBrandColorSelect(color)}
              accessibilityRole="button"
              accessibilityLabel={`Boja brenda ${getColorName(color)}`}
              accessibilityState={{ selected: currentBrandColor === color }}
            >
              {currentBrandColor === color && (
                <Check size={18} color={"#ffffff"} accessible={false} />
              )}
            </Pressable>
          ))}
        </View>
      </AppCard>
    </SettingsScrollView>
  );
}
