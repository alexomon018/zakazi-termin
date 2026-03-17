import {
  AppButton,
  AppInput,
  AppText,
  ConfirmDialog,
  QueryStateView,
  ScreenHeader,
  SectionHeader,
} from "@/components/atoms";
import { SettingsScrollView } from "@/components/molecules";
import { DayAvailabilityRow, type TimeRange } from "@/components/molecules/DayAvailabilityRow";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useMe } from "@/lib/use-me";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatTimeUTC } from "@salonko/config/date-formatters";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";

const DAYS_OF_WEEK = [
  { value: 1, label: "Ponedeljak" },
  { value: 2, label: "Utorak" },
  { value: 3, label: "Sreda" },
  { value: 4, label: "Četvrtak" },
  { value: 5, label: "Petak" },
  { value: 6, label: "Subota" },
  { value: 0, label: "Nedelja" },
];

type DayAvailability = {
  enabled: boolean;
  timeRanges: TimeRange[];
};
type EditorState = Record<number, DayAvailability>;

type DateOverride = {
  date: Date;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
};

type ScheduleAvailabilityEntry = {
  days: number[];
  date: Date | null;
  startTime: Date;
  endTime: Date;
};

type ScheduleData = {
  name: string;
  availability: ScheduleAvailabilityEntry[];
};

function initializeEditorState(schedule: ScheduleData): EditorState {
  const state: EditorState = {};
  for (const day of DAYS_OF_WEEK) {
    state[day.value] = {
      enabled: false,
      timeRanges: [{ startTime: "09:00", endTime: "17:00" }],
    };
  }

  const workingHours = schedule.availability.filter((a) => a.days && a.days.length > 0 && !a.date);

  for (const entry of workingHours) {
    const startTime = formatTimeUTC(entry.startTime);
    const endTime = formatTimeUTC(entry.endTime);

    for (const dayValue of entry.days) {
      if (!state[dayValue].enabled) {
        state[dayValue] = { enabled: true, timeRanges: [{ startTime, endTime }] };
      } else {
        state[dayValue].timeRanges.push({ startTime, endTime });
      }
    }
  }
  return state;
}

function extractDateOverrides(schedule: ScheduleData): DateOverride[] {
  return schedule.availability
    .filter((a): a is ScheduleAvailabilityEntry & { date: Date } => a.date !== null)
    .map((a) => ({
      date: new Date(a.date),
      startTime: formatTimeUTC(a.startTime),
      endTime: formatTimeUTC(a.endTime),
      isBlocked: formatTimeUTC(a.startTime) === "00:00" && formatTimeUTC(a.endTime) === "00:00",
    }))
    .sort((a: DateOverride, b: DateOverride) => a.date.getTime() - b.date.getTime());
}

export default function ScheduleEditorScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();

  const scheduleQuery = trpc.availability.getSchedule.useQuery(
    { id: id! },
    { retry: false, enabled: !!id }
  );
  const meQuery = useMe();

  const [scheduleName, setScheduleName] = useState("");
  const [days, setDays] = useState<EditorState>({});
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingBlockDate, setPendingBlockDate] = useState<Date>(new Date());

  const updateScheduleMutation = trpc.availability.updateSchedule.useMutation({
    onSuccess: () => {
      utils.availability.listSchedules.invalidate();
    },
    onError: (error) => {
      Alert.alert("Greška", error.message ?? "Ažuriranje rasporeda nije uspelo.");
    },
  });
  const setAvailabilityMutation = trpc.availability.setAvailability.useMutation({
    onSuccess: () => {
      setHasChanges(false);
      utils.availability.getSchedule.invalidate({ id: id! });
      utils.availability.listSchedules.invalidate();
    },
    onError: (error) => {
      setHasChanges(true);
      Alert.alert("Greška", error.message ?? "Čuvanje rasporeda nije uspelo.");
    },
  });
  const deleteScheduleMutation = trpc.availability.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.availability.listSchedules.invalidate();
      setShowDelete(false);
      router.back();
    },
    onError: (error) => {
      setShowDelete(false);
      Alert.alert("Greška", error.message ?? "Brisanje rasporeda nije uspelo.");
    },
  });
  const setDefaultMutation = trpc.user.setDefaultSchedule.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      utils.availability.listSchedules.invalidate();
    },
    onError: (error) => {
      Alert.alert("Greška", error.message ?? "Postavljanje podrazumevanog rasporeda nije uspelo.");
    },
  });
  const addDateOverrideMutation = trpc.availability.addDateOverride.useMutation({
    onSuccess: () => {
      utils.availability.getSchedule.invalidate({ id: id! });
    },
    onError: (error) => {
      Alert.alert("Greška", error.message ?? "Dodavanje izuzetka nije uspelo.");
    },
  });
  const blockDateMutation = trpc.availability.blockDate.useMutation({
    onSuccess: () => {
      utils.availability.getSchedule.invalidate({ id: id! });
    },
    onError: (error) => {
      Alert.alert("Greška", error.message ?? "Blokiranje datuma nije uspelo.");
    },
  });
  const removeDateOverrideMutation = trpc.availability.removeDateOverride.useMutation({
    onSuccess: () => {
      utils.availability.getSchedule.invalidate({ id: id! });
    },
    onError: (error) => {
      Alert.alert("Greška", error.message ?? "Uklanjanje izuzetka nije uspelo.");
    },
  });

  useEffect(() => {
    if (scheduleQuery.data) {
      setScheduleName(scheduleQuery.data.name);
      setDays(initializeEditorState(scheduleQuery.data));
      setDateOverrides(extractDateOverrides(scheduleQuery.data));
    }
  }, [scheduleQuery.data]);

  const isDefault = meQuery.data?.defaultScheduleId === id;

  const handleSave = () => {
    if (scheduleName.trim() && scheduleName !== scheduleQuery.data?.name) {
      updateScheduleMutation.mutate({ id: id!, name: scheduleName.trim() });
    }

    const availability: { days: number[]; startTime: string; endTime: string }[] = [];
    for (const day of DAYS_OF_WEEK) {
      if (days[day.value]?.enabled) {
        for (const range of days[day.value].timeRanges) {
          availability.push({
            days: [day.value],
            startTime: range.startTime,
            endTime: range.endTime,
          });
        }
      }
    }

    setAvailabilityMutation.mutate({ scheduleId: id!, availability });
  };

  const handleDayToggle = (dayValue: number, enabled: boolean) => {
    setHasChanges(true);
    setDays((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        enabled,
        timeRanges: enabled
          ? prev[dayValue]?.timeRanges?.length > 0
            ? prev[dayValue].timeRanges
            : [{ startTime: "09:00", endTime: "17:00" }]
          : (prev[dayValue]?.timeRanges ?? [{ startTime: "09:00", endTime: "17:00" }]),
      },
    }));
  };

  const handleTimeRangesChange = (dayValue: number, ranges: TimeRange[]) => {
    setHasChanges(true);
    setDays((prev) => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], timeRanges: ranges },
    }));
  };

  const handleBlockDate = (date: Date) => {
    blockDateMutation.mutate({ scheduleId: id!, date });
  };

  const handleRemoveOverride = (date: Date) => {
    removeDateOverrideMutation.mutate({ scheduleId: id!, date });
  };

  const isSaving = setAvailabilityMutation.isPending || updateScheduleMutation.isPending;
  const isSaveDisabled =
    isSaving || (!hasChanges && scheduleName.trim() === scheduleQuery.data?.name);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        },
        saveChipDisabled: {
          opacity: 0.5,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        overrideRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
      }),
    [theme]
  );

  if (scheduleQuery.isLoading) {
    return <QueryStateView state="loading" />;
  }

  if (scheduleQuery.error || !scheduleQuery.data) {
    return (
      <QueryStateView
        state="error"
        message="Nije moguće učitati raspored."
        onRetry={() => router.back()}
      />
    );
  }

  return (
    <>
      <SettingsScrollView keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title={scheduleName.trim() || "Uredi raspored"}
          rightContent={
            <Pressable
              style={[styles.chip, styles.saveChip, isSaveDisabled && styles.saveChipDisabled]}
              onPress={handleSave}
              disabled={isSaveDisabled}
              accessibilityRole="button"
              accessibilityLabel="Sačuvaj"
              accessibilityState={{ disabled: isSaveDisabled }}
            >
              <AppText
                variant="bodySm"
                style={{
                  fontWeight: "700",
                  color: isSaveDisabled
                    ? theme.colors.mutedForeground
                    : theme.colors.primaryForeground,
                }}
              >
                {isSaving ? "Čuvanje..." : "Sačuvaj"}
              </AppText>
            </Pressable>
          }
        />
        <SectionHeader title="Naziv rasporeda" />
        <AppInput
          value={scheduleName}
          onChangeText={(v) => {
            setScheduleName(v);
            setHasChanges(true);
          }}
          placeholder="Naziv rasporeda"
        />

        <SectionHeader title="Radno vreme" />
        <View style={styles.card}>
          {DAYS_OF_WEEK.map((day) => (
            <DayAvailabilityRow
              key={day.value}
              label={day.label}
              enabled={days[day.value]?.enabled ?? false}
              timeRanges={days[day.value]?.timeRanges ?? [{ startTime: "09:00", endTime: "17:00" }]}
              onToggle={(enabled) => handleDayToggle(day.value, enabled)}
              onTimeRangesChange={(ranges) => handleTimeRangesChange(day.value, ranges)}
            />
          ))}
        </View>

        <SectionHeader title="Izuzeci datuma" />
        {dateOverrides.length > 0 && (
          <View style={styles.card}>
            {dateOverrides.map((override) => (
              <View key={override.date.toISOString()} style={styles.overrideRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySm">{override.date.toLocaleDateString("sr-RS")}</AppText>
                  <AppText variant="caption" muted>
                    {override.isBlocked
                      ? "Blokirano"
                      : `${override.startTime} - ${override.endTime}`}
                  </AppText>
                </View>
                <AppButton
                  label="Ukloni"
                  onPress={() => handleRemoveOverride(override.date)}
                  variant="outline"
                />
              </View>
            ))}
          </View>
        )}
        <AppButton
          label="Blokiraj datum"
          onPress={() => setShowDatePicker(true)}
          variant="outline"
        />

        {showDatePicker && (
          <>
            <DateTimePicker
              value={pendingBlockDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={new Date()}
              onChange={(_, selectedDate) => {
                if (Platform.OS !== "ios") {
                  setShowDatePicker(false);
                  if (selectedDate) handleBlockDate(selectedDate);
                  return;
                }
                if (selectedDate) setPendingBlockDate(selectedDate);
              }}
            />
            {Platform.OS === "ios" && (
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label="Otkaži"
                    onPress={() => {
                      setShowDatePicker(false);
                      setPendingBlockDate(new Date());
                    }}
                    variant="outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label="Potvrdi"
                    onPress={() => {
                      setShowDatePicker(false);
                      handleBlockDate(pendingBlockDate);
                      setPendingBlockDate(new Date());
                    }}
                  />
                </View>
              </View>
            )}
          </>
        )}

        {!isDefault && (
          <AppButton
            label="Postavi kao podrazumevani"
            onPress={() => setDefaultMutation.mutate({ scheduleId: id! })}
            variant="outline"
            loading={setDefaultMutation.isPending}
          />
        )}

        <AppButton
          label="Obriši raspored"
          onPress={() => setShowDelete(true)}
          variant="outline"
          disabled={isDefault}
          textColorOverride={theme.colors.destructive}
        />
      </SettingsScrollView>

      <ConfirmDialog
        visible={showDelete}
        title="Obriši raspored"
        message={`Da li ste sigurni da želite da obrišete "${scheduleName}"?`}
        confirmLabel="Obriši"
        destructive
        loading={deleteScheduleMutation.isPending}
        onConfirm={() => deleteScheduleMutation.mutate({ id: id! })}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
