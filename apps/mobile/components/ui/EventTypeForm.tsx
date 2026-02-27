import { AppButton, AppInput, AppText, SectionHeader } from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme-context";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

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
  if (!formData.title.trim()) errors.title = "Naziv je obavezan";
  if (!formData.slug.trim()) errors.slug = "Slug je obavezan";
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
            <AppButton
              key={opt.value}
              label={opt.label}
              onPress={() => onChange(opt.value)}
              variant={value === opt.value ? "primary" : "outline"}
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
  showVisibilityToggle = false,
  onFormDataChange,
  onSubmit,
}: {
  formData: EventTypeFormData;
  errors: Record<string, string>;
  schedules: Schedule[];
  isPending: boolean;
  submitLabel: string;
  showVisibilityToggle?: boolean;
  onFormDataChange: (updater: (prev: EventTypeFormData) => EventTypeFormData) => void;
  onSubmit: () => void;
}) {
  const { theme } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateField = <K extends keyof EventTypeFormData>(key: K, value: EventTypeFormData[K]) => {
    onFormDataChange((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    onFormDataChange((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 100 },
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        formGroup: { gap: theme.spacing.xs },
        multilineInput: { minHeight: 80, textAlignVertical: "top" },
        switchRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
      }),
    [theme]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader title="Osnovno" />
      <View style={styles.card}>
        <View style={styles.formGroup}>
          <AppText variant="bodySm">Naziv</AppText>
          <AppInput
            value={formData.title}
            onChangeText={handleTitleChange}
            placeholder="npr. Šišanje"
          />
          {errors.title && (
            <AppText variant="caption" muted>
              {errors.title}
            </AppText>
          )}
        </View>

        <View style={styles.formGroup}>
          <AppText variant="bodySm">Slug (URL)</AppText>
          <AppInput
            value={formData.slug}
            onChangeText={(v) => updateField("slug", v)}
            placeholder="npr. sisanje"
            autoCapitalize="none"
          />
          {errors.slug && (
            <AppText variant="caption" muted>
              {errors.slug}
            </AppText>
          )}
        </View>

        <View style={styles.formGroup}>
          <AppText variant="bodySm">Opis</AppText>
          <AppInput
            value={formData.description}
            onChangeText={(v) => updateField("description", v)}
            placeholder="Opis usluge (opcionalno)"
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />
        </View>

        <OptionRow
          label="Trajanje (min)"
          options={DURATION_OPTIONS.map((d) => ({ value: d, label: `${d}` }))}
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
        <View style={styles.formGroup}>
          <AppText variant="bodySm">Adresa</AppText>
          <AppInput
            value={formData.locationAddress}
            onChangeText={(v) => updateField("locationAddress", v)}
            placeholder="Adresa salona"
          />
          {errors.locationAddress && (
            <AppText variant="caption" muted>
              {errors.locationAddress}
            </AppText>
          )}
        </View>
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

      <AppButton
        label={showAdvanced ? "Sakrij napredne opcije" : "Napredne opcije"}
        onPress={() => setShowAdvanced((prev) => !prev)}
        variant="outline"
      />

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
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
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
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
            />
          </View>
        </View>
      )}

      <AppButton label={submitLabel} onPress={onSubmit} loading={isPending} />
    </ScrollView>
  );
}
