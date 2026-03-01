import { AppCard, AppText, SectionHeader } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { Check } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

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

export default function AppearanceSettingsScreen() {
  const { theme, preference, setPreference } = useTheme();
  const utils = trpc.useUtils();
  const meQuery = trpc.user.me.useQuery(undefined, { retry: false });

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
        scrollView: { flex: 1, backgroundColor: theme.colors.background },
        content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 100 },
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
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const currentTheme = preference;
  const currentBrandColor = optimisticBrandColor ?? meQuery.data?.brandColor ?? "#2563eb";

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <SectionHeader title="Tema" />
      <AppCard>
        <View style={styles.themeRow}>
          {THEMES.map((t) => (
            <Pressable
              key={t.value}
              style={[styles.themeOption, currentTheme === t.value && styles.themeOptionActive]}
              onPress={() => handleThemeSelect(t.value)}
            >
              <AppText variant="bodySm">{t.label}</AppText>
              {currentTheme === t.value && <Check size={16} color={theme.colors.primary} />}
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
            >
              {currentBrandColor === color && <Check size={18} color={"#ffffff"} />}
            </Pressable>
          ))}
        </View>
      </AppCard>
    </ScrollView>
  );
}
