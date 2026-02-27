import { AppButton, AppText } from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Plus, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Switch, View } from "react-native";

export type TimeRange = {
  startTime: string;
  endTime: string;
};

function parseTimeToDate(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatTimeFromDate(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function TimeButton({
  time,
  onTimeChange,
}: {
  time: string;
  onTimeChange: (newTime: string) => void;
}) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <Pressable
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          backgroundColor: theme.colors.surface,
        }}
        onPress={() => setShowPicker(true)}
      >
        <AppText variant="bodySm">{time}</AppText>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={parseTimeToDate(time)}
          mode="time"
          is24Hour
          minuteInterval={5}
          onChange={(_, selectedDate) => {
            setShowPicker(Platform.OS === "ios");
            if (selectedDate) {
              onTimeChange(formatTimeFromDate(selectedDate));
            }
          }}
        />
      )}
    </>
  );
}

export function DayAvailabilityRow({
  label,
  enabled,
  timeRanges,
  onToggle,
  onTimeRangesChange,
}: {
  label: string;
  enabled: boolean;
  timeRanges: TimeRange[];
  onToggle: (enabled: boolean) => void;
  onTimeRangesChange: (ranges: TimeRange[]) => void;
}) {
  const { theme } = useTheme();

  const updateRange = (index: number, field: "startTime" | "endTime", value: string) => {
    const updated = [...timeRanges];
    updated[index] = { ...updated[index], [field]: value };
    onTimeRangesChange(updated);
  };

  const addRange = () => {
    onTimeRangesChange([...timeRanges, { startTime: "09:00", endTime: "17:00" }]);
  };

  const removeRange = (index: number) => {
    onTimeRangesChange(timeRanges.filter((_, i) => i !== index));
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        rangesContainer: {
          marginTop: theme.spacing.sm,
          marginLeft: 52,
          gap: theme.spacing.sm,
        },
        rangeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        },
        removeButton: { padding: theme.spacing.xs },
        addRangeButton: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xs,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
        />
        <AppText variant="body">{label}</AppText>
      </View>
      {enabled && (
        <View style={styles.rangesContainer}>
          {timeRanges.map((range, index) => (
            <View key={`${label}-${range.startTime}-${range.endTime}`} style={styles.rangeRow}>
              <TimeButton
                time={range.startTime}
                onTimeChange={(v) => updateRange(index, "startTime", v)}
              />
              <AppText variant="bodySm" muted>
                —
              </AppText>
              <TimeButton
                time={range.endTime}
                onTimeChange={(v) => updateRange(index, "endTime", v)}
              />
              {timeRanges.length > 1 && (
                <Pressable style={styles.removeButton} onPress={() => removeRange(index)}>
                  <Trash2 size={16} color={theme.colors.destructive} />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable style={styles.addRangeButton} onPress={addRange}>
            <Plus size={14} color={theme.colors.accent} />
            <AppText variant="caption" muted>
              Dodaj period
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}
