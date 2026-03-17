import {
  AppButton,
  AppInput,
  AppText,
  FormField,
  ScreenHeader,
  SectionHeader,
} from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOCATION_TYPES = [
  { value: "inPerson" as const, label: "U salonu" },
  { value: "phone" as const, label: "Telefonom" },
  { value: "link" as const, label: "Online link" },
];

export type EventTypeFormData = {
  title: string;
  slug: string;
  description: string;
  length: number;
  hidden: boolean;
  locationType: "inPerson" | "phone" | "link";
  locationAddress: string;
  minimumBookingNotice: number;
  beforeEventBuffer: number;
  afterEventBuffer: number;
  requiresConfirmation: boolean;
  scheduleId: string | null;
};

export const DEFAULT_FORM_DATA: EventTypeFormData = {
  title: "",
  slug: "",
  description: "",
  length: 30,
  hidden: false,
  locationType: "inPerson",
  locationAddress: "",
  minimumBookingNotice: 120,
  beforeEventBuffer: 0,
  afterEventBuffer: 0,
  requiresConfirmation: false,
  scheduleId: null,
};

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[š]/g, "s")
    .replace(/[ž]/g, "z")
    .replace(/[đ]/g, "dj")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateEventTypeForm(formData: EventTypeFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  const slug = formData.slug.trim();
  if (!formData.title.trim()) errors.title = "Naziv je obavezan";
  if (!slug) {
    errors.slug = "Slug je obavezan";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = "Slug može sadržati samo mala slova, brojeve i crtice";
  }
  if (formData.length < 5) errors.length = "Trajanje mora biti najmanje 5 minuta";
  if (formData.locationType === "inPerson" && !formData.locationAddress.trim()) {
    errors.locationAddress = "Adresa je obavezna za termine uživo";
  }
  return errors;
}

type Schedule = { id: string; name: string };

const NOTICE_OPTIONS = [
  { value: 0, label: "Bez ograničenja" },
  { value: 60, label: "1 sat" },
  { value: 120, label: "2 sata" },
  { value: 240, label: "4 sata" },
  { value: 480, label: "8 sati" },
  { value: 1440, label: "1 dan" },
  { value: 2880, label: "2 dana" },
  { value: 10080, label: "1 nedelja" },
];

const BUFFER_OPTIONS = [
  { value: 0, label: "Bez pauze" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 sat" },
];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

function OptionChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        height: 34,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : theme.colors.border,
        backgroundColor: active ? theme.colors.primaryTint : theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 14,
      }}
    >
      <AppText
        variant="bodySm"
        style={{
          fontWeight: "600",
          color: active ? theme.colors.primary : theme.colors.foreground,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function OptionRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: number; label: string }[];
  value: number;
  onChange: (v: number) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="bodySm">{label}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {options.map((opt) => (
            <OptionChip
              key={opt.value}
              label={opt.label}
              active={value === opt.value}
              onPress={() => onChange(opt.value)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function EventTypeForm({
  formData,
  errors,
  schedules,
  isPending,
  submitLabel,
  submitError,
  headerTitle,
  showVisibilityToggle = false,
  onBackPress,
  onFormDataChange,
  onSubmit,
}: {
  formData: EventTypeFormData;
  errors: Record<string, string>;
  schedules: Schedule[];
  isPending: boolean;
  submitLabel: string;
  submitError?: string | null;
  headerTitle: string;
  showVisibilityToggle?: boolean;
  onBackPress: () => void;
  onFormDataChange: (updater: (prev: EventTypeFormData) => EventTypeFormData) => void;
  onSubmit: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateField = <K extends keyof EventTypeFormData>(key: K, value: EventTypeFormData[K]) => {
    onFormDataChange((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    onFormDataChange((prev) => {
      const shouldUpdateSlug = prev.slug === generateSlug(prev.title);
      return {
        ...prev,
        title,
        ...(shouldUpdateSlug && { slug: generateSlug(title) }),
      };
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        content: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.sm,
          gap: theme.spacing.md,
          paddingBottom: 100,
        },
        chip: {
          height: 40,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        },
        saveChip: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          opacity: isPending ? 0.7 : 1,
          minWidth: 90,
          paddingHorizontal: 20,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        multilineInput: { minHeight: 80, textAlignVertical: "top" },
        switchRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
      }),
    [theme, insets.top, isPending]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title={headerTitle}
        onBack={onBackPress}
        rightContent={
          <Pressable
            style={[styles.chip, styles.saveChip]}
            onPress={onSubmit}
            disabled={isPending}
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
          >
            <AppText
              variant="bodySm"
              style={{ fontWeight: "700", color: theme.colors.primaryForeground }}
            >
              {isPending ? "Čuvanje..." : submitLabel}
            </AppText>
          </Pressable>
        }
      />
      <SectionHeader title="Osnovno" />
      <View style={styles.card}>
        <FormField label="Naziv" error={errors.title}>
          <AppInput
            value={formData.title}
            onChangeText={handleTitleChange}
            placeholder="npr. Šišanje"
          />
        </FormField>

        <FormField label="Link za zakazivanje" error={errors.slug}>
          <AppInput
            value={formData.slug}
            onChangeText={(v) => updateField("slug", v)}
            placeholder="automatski se generiše"
            autoCapitalize="none"
          />
          {formData.slug.trim() !== "" && (
            <AppText variant="caption" muted>
              vaslon.zakazi.rs/{formData.slug}
            </AppText>
          )}
        </FormField>

        <FormField label="Opis">
          <AppInput
            value={formData.description}
            onChangeText={(v) => updateField("description", v)}
            placeholder="Opis usluge (opcionalno)"
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />
        </FormField>

        <OptionRow
          label="Trajanje (min)"
          options={DURATION_OPTIONS.map((d) => ({ value: d, label: `${d} min` }))}
          value={formData.length}
          onChange={(v) => updateField("length", v)}
        />
        {errors.length && (
          <AppText variant="caption" muted>
            {errors.length}
          </AppText>
        )}
      </View>

      <SectionHeader title="Lokacija" />
      <View style={styles.card}>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {LOCATION_TYPES.map((loc) => (
            <OptionChip
              key={loc.value}
              label={loc.label}
              active={formData.locationType === loc.value}
              onPress={() => updateField("locationType", loc.value)}
            />
          ))}
        </View>
        {formData.locationType === "inPerson" && (
          <FormField label="Adresa" error={errors.locationAddress}>
            <AppInput
              value={formData.locationAddress}
              onChangeText={(v) => updateField("locationAddress", v)}
              placeholder="Adresa salona"
            />
          </FormField>
        )}
        {formData.locationType === "phone" && (
          <FormField label="Telefon">
            <AppInput
              value={formData.locationAddress}
              onChangeText={(v) => updateField("locationAddress", v)}
              placeholder="Broj telefona"
              keyboardType="phone-pad"
            />
          </FormField>
        )}
        {formData.locationType === "link" && (
          <FormField label="Link">
            <AppInput
              value={formData.locationAddress}
              onChangeText={(v) => updateField("locationAddress", v)}
              placeholder="https://"
              autoCapitalize="none"
              keyboardType="url"
            />
          </FormField>
        )}
      </View>

      {schedules.length > 0 && (
        <>
          <SectionHeader title="Raspored" />
          <View style={styles.card}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <AppButton
                  label="Podrazumevani"
                  onPress={() => updateField("scheduleId", null)}
                  variant={formData.scheduleId === null ? "primary" : "outline"}
                />
                {schedules.map((s) => (
                  <AppButton
                    key={s.id}
                    label={s.name}
                    onPress={() => updateField("scheduleId", s.id)}
                    variant={formData.scheduleId === s.id ? "primary" : "outline"}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </>
      )}

      <Pressable
        style={{
          height: 38,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.lg,
        }}
        onPress={() => setShowAdvanced((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={showAdvanced ? "Sakrij napredne opcije" : "Napredne opcije"}
      >
        <AppText variant="bodySm" style={{ fontWeight: "600" }}>
          {showAdvanced ? "Sakrij napredne opcije" : "Napredne opcije"}
        </AppText>
        {showAdvanced ? (
          <ChevronUp size={16} color={theme.colors.foreground} />
        ) : (
          <ChevronDown size={16} color={theme.colors.foreground} />
        )}
      </Pressable>

      {showAdvanced && (
        <View style={styles.card}>
          <OptionRow
            label="Minimalna najava"
            options={NOTICE_OPTIONS}
            value={formData.minimumBookingNotice}
            onChange={(v) => updateField("minimumBookingNotice", v)}
          />
          <OptionRow
            label="Pauza pre"
            options={BUFFER_OPTIONS}
            value={formData.beforeEventBuffer}
            onChange={(v) => updateField("beforeEventBuffer", v)}
          />
          <OptionRow
            label="Pauza posle"
            options={BUFFER_OPTIONS}
            value={formData.afterEventBuffer}
            onChange={(v) => updateField("afterEventBuffer", v)}
          />
          <View style={styles.switchRow}>
            <AppText variant="bodySm">Zahteva potvrdu</AppText>
            <Switch
              value={formData.requiresConfirmation}
              onValueChange={(v) => updateField("requiresConfirmation", v)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
            />
          </View>
        </View>
      )}

      {showVisibilityToggle && (
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <AppText variant="bodySm">Sakriveno</AppText>
            <Switch
              value={formData.hidden}
              onValueChange={(v) => updateField("hidden", v)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
            />
          </View>
        </View>
      )}

      {submitError && (
        <AppText variant="bodySm" centered muted>
          {submitError}
        </AppText>
      )}
    </ScrollView>
  );
}
