import { DayAvailabilityRow, type TimeRange } from "@/components/ui/DayAvailabilityRow";
import {
  AppButton,
  AppInput,
  AppText,
  ConfirmDialog,
  SectionHeader,
} from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

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

function formatTime(date: Date): string {
  const d = new Date(date);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

function initializeEditorState(schedule: any): EditorState {
  const state: EditorState = {};
  for (const day of DAYS_OF_WEEK) {
    state[day.value] = {
      enabled: false,
      timeRanges: [{ startTime: "09:00", endTime: "17:00" }],
    };
  }

  const workingHours = schedule.availability.filter(
    (a: any) => a.days && a.days.length > 0 && !a.date
  );

  for (const entry of workingHours) {
    const startTime = formatTime(entry.startTime);
    const endTime = formatTime(entry.endTime);

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

function extractDateOverrides(schedule: any): DateOverride[] {
  return schedule.availability
    .filter((a: any) => a.date !== null)
    .map((a: any) => ({
      date: new Date(a.date),
      startTime: formatTime(a.startTime),
      endTime: formatTime(a.endTime),
      isBlocked: formatTime(a.startTime) === "00:00" && formatTime(a.endTime) === "00:00",
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
  const meQuery = trpc.user.me.useQuery(undefined, { retry: false });

  const [scheduleName, setScheduleName] = useState("");
  const [days, setDays] = useState<EditorState>({});
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollView: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          paddingBottom: 100,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
          gap: theme.spacing.md,
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
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (scheduleQuery.error || !scheduleQuery.data) {
    return (
      <View style={styles.centered}>
        <AppText variant="bodySm" muted centered>
          Nije moguće učitati raspored.
        </AppText>
        <AppButton label="Nazad" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const isSaving = setAvailabilityMutation.isPending || updateScheduleMutation.isPending;

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="Naziv rasporeda" />
        <View style={styles.card}>
          <AppInput
            value={scheduleName}
            onChangeText={(v) => {
              setScheduleName(v);
              setHasChanges(true);
            }}
            placeholder="Naziv rasporeda"
          />
        </View>

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
        <View style={styles.card}>
          {dateOverrides.length > 0 ? (
            dateOverrides.map((override) => (
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
            ))
          ) : (
            <AppText variant="bodySm" muted>
              Nema izuzetaka.
            </AppText>
          )}
          <AppButton
            label="Blokiraj datum"
            onPress={() => setShowDatePicker(true)}
            variant="outline"
          />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowDatePicker(Platform.OS === "ios");
              if (selectedDate) {
                handleBlockDate(selectedDate);
              }
            }}
          />
        )}

        <AppButton
          label="Sačuvaj raspored"
          onPress={handleSave}
          loading={isSaving}
          disabled={!hasChanges && scheduleName === scheduleQuery.data?.name}
        />

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
          variant="destructive"
          disabled={isDefault}
        />
      </ScrollView>

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
