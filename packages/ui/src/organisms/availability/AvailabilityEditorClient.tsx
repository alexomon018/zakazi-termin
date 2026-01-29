"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@salonko/ui";
import { ArrowLeft, HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DateOverrideDialog,
  DateOverrideItem,
  DayAvailabilityRow,
  type TimeRange,
} from "../../molecules/availability";

type Schedule = NonNullable<RouterOutputs["availability"]["getSchedule"]>;
type User = RouterOutputs["user"]["me"];

// Days of week starting with Monday
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

interface DateOverride {
  date: Date;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
}

function formatTime(date: Date): string {
  const d = new Date(date);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

function initializeEditorState(schedule: Schedule): EditorState {
  // Initialize all days as disabled with default times
  const state: EditorState = {};
  for (const day of DAYS_OF_WEEK) {
    state[day.value] = {
      enabled: false,
      timeRanges: [{ startTime: "09:00", endTime: "17:00" }],
    };
  }

  // Process availability entries (exclude date overrides)
  const workingHours = schedule.availability.filter((a) => a.days && a.days.length > 0 && !a.date);

  for (const entry of workingHours) {
    const startTime = formatTime(entry.startTime);
    const endTime = formatTime(entry.endTime);

    for (const dayValue of entry.days) {
      if (!state[dayValue].enabled) {
        state[dayValue] = {
          enabled: true,
          timeRanges: [{ startTime, endTime }],
        };
      } else {
        // Add additional time range
        state[dayValue].timeRanges.push({ startTime, endTime });
      }
    }
  }

  return state;
}

function extractDateOverrides(schedule: Schedule): DateOverride[] {
  return schedule.availability
    .filter((a) => a.date !== null)
    .map((a) => ({
      date: new Date(a.date!),
      startTime: formatTime(a.startTime),
      endTime: formatTime(a.endTime),
      isBlocked: formatTime(a.startTime) === "00:00" && formatTime(a.endTime) === "00:00",
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function formatAvailabilitySummary(days: EditorState): string {
  const enabledDays = DAYS_OF_WEEK.filter((d) => days[d.value]?.enabled);
  if (enabledDays.length === 0) return "Nedostupan";

  // Get unique time ranges
  const timeRanges = new Set<string>();
  for (const day of enabledDays) {
    for (const range of days[day.value].timeRanges) {
      timeRanges.add(`${range.startTime} - ${range.endTime}`);
    }
  }

  // Simple summary
  const dayLabels = enabledDays.map((d) => d.label.substring(0, 3));
  if (dayLabels.length === 5 && enabledDays.every((d) => d.value >= 1 && d.value <= 5)) {
    return `Pon - Pet, ${[...timeRanges].join(", ")}`;
  }

  return `${dayLabels.join(", ")}, ${[...timeRanges].join(", ")}`;
}

export interface AvailabilityEditorClientProps {
  schedule: Schedule;
  currentUser: User;
}

export function AvailabilityEditorClient({
  schedule: initialSchedule,
  currentUser: initialUser,
}: AvailabilityEditorClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  // State
  const [isEditingName, setIsEditingName] = useState(false);
  const [scheduleName, setScheduleName] = useState(initialSchedule.name);
  const [timeZone, setTimeZone] = useState(
    initialSchedule.timeZone || initialUser?.timeZone || "Europe/Belgrade"
  );
  const [days, setDays] = useState<EditorState>(() => initializeEditorState(initialSchedule));
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>(() =>
    extractDateOverrides(initialSchedule)
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // tRPC queries
  const { data: schedule } = trpc.availability.getSchedule.useQuery(
    { id: initialSchedule.id },
    { initialData: initialSchedule }
  );

  const { data: currentUser } = trpc.user.me.useQuery(undefined, {
    initialData: initialUser,
  });

  // tRPC mutations
  const updateSchedule = trpc.availability.updateSchedule.useMutation({
    onSuccess: () => {
      utils.availability.getSchedule.invalidate({ id: initialSchedule.id });
      utils.availability.listSchedules.invalidate();
    },
  });

  const setAvailability = trpc.availability.setAvailability.useMutation({
    onSuccess: () => {
      utils.availability.getSchedule.invalidate({ id: initialSchedule.id });
      utils.availability.listSchedules.invalidate();
      setHasChanges(false);
    },
  });

  const deleteSchedule = trpc.availability.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.availability.listSchedules.invalidate();
      router.push("/dashboard/availability");
    },
  });

  const setDefaultSchedule = trpc.user.setDefaultSchedule.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
    },
  });

  const addDateOverride = trpc.availability.addDateOverride.useMutation({
    onSuccess: () => {
      utils.availability.getSchedule.invalidate({ id: initialSchedule.id });
    },
  });

  const blockDate = trpc.availability.blockDate.useMutation({
    onSuccess: () => {
      utils.availability.getSchedule.invalidate({ id: initialSchedule.id });
    },
  });

  const removeDateOverride = trpc.availability.removeDateOverride.useMutation({
    onSuccess: () => {
      utils.availability.getSchedule.invalidate({ id: initialSchedule.id });
    },
  });

  // Track changes
  useEffect(() => {
    const currentState = JSON.stringify({ days, timeZone, name: scheduleName });
    const initialState = JSON.stringify({
      days: initializeEditorState(initialSchedule),
      timeZone: initialSchedule.timeZone || initialUser?.timeZone || "Europe/Belgrade",
      name: initialSchedule.name,
    });
    setHasChanges(currentState !== initialState);
  }, [days, timeZone, scheduleName, initialSchedule, initialUser?.timeZone]);

  // Update local state when schedule changes from server
  useEffect(() => {
    if (schedule) {
      setDateOverrides(extractDateOverrides(schedule));
    }
  }, [schedule]);

  const isDefault = currentUser?.defaultScheduleId === initialSchedule.id;

  // Handlers
  const handleToggleDay = useCallback((dayValue: number, enabled: boolean) => {
    setDays((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        enabled,
        timeRanges:
          enabled && prev[dayValue].timeRanges.length === 0
            ? [{ startTime: "09:00", endTime: "17:00" }]
            : prev[dayValue].timeRanges,
      },
    }));
  }, []);

  const handleAddTimeRange = useCallback((dayValue: number) => {
    setDays((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        timeRanges: [...prev[dayValue].timeRanges, { startTime: "09:00", endTime: "17:00" }],
      },
    }));
  }, []);

  const handleRemoveTimeRange = useCallback((dayValue: number, index: number) => {
    setDays((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        timeRanges: prev[dayValue].timeRanges.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const handleUpdateTimeRange = useCallback(
    (dayValue: number, index: number, field: "startTime" | "endTime", value: string) => {
      setDays((prev) => ({
        ...prev,
        [dayValue]: {
          ...prev[dayValue],
          timeRanges: prev[dayValue].timeRanges.map((range, i) =>
            i === index ? { ...range, [field]: value } : range
          ),
        },
      }));
    },
    []
  );

  const handleCopyTimes = useCallback((sourceDay: number, targetDays: number[]) => {
    setDays((prev) => {
      const sourceRanges = prev[sourceDay].timeRanges;
      const newState = { ...prev };
      for (const day of targetDays) {
        newState[day] = {
          enabled: true,
          timeRanges: sourceRanges.map((r) => ({ ...r })),
        };
      }
      return newState;
    });
  }, []);

  const handleSave = () => {
    // Update name and timezone if changed
    if (scheduleName !== initialSchedule.name || timeZone !== initialSchedule.timeZone) {
      updateSchedule.mutate({
        id: initialSchedule.id,
        name: scheduleName,
        timeZone,
      });
    }

    // Convert editor state to availability format
    const availability: {
      days: number[];
      startTime: string;
      endTime: string;
    }[] = [];

    // Group by time ranges to minimize API entries
    const timeRangeMap = new Map<string, number[]>();

    for (const [dayStr, dayState] of Object.entries(days)) {
      const dayValue = Number.parseInt(dayStr);
      if (!dayState.enabled) continue;

      for (const range of dayState.timeRanges) {
        const key = `${range.startTime}-${range.endTime}`;
        const existing = timeRangeMap.get(key) || [];
        timeRangeMap.set(key, [...existing, dayValue]);
      }
    }

    for (const [timeKey, dayValues] of timeRangeMap) {
      const [startTime, endTime] = timeKey.split("-");
      availability.push({ days: dayValues, startTime, endTime });
    }

    setAvailability.mutate({
      scheduleId: initialSchedule.id,
      availability,
    });
  };

  const handleAddOverride = (date: Date, startTime: string, endTime: string) => {
    addDateOverride.mutate({
      scheduleId: initialSchedule.id,
      date,
      startTime,
      endTime,
    });
    setDateOverrides((prev) =>
      [...prev, { date, startTime, endTime, isBlocked: false }].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      )
    );
  };

  const handleBlockDate = (date: Date) => {
    blockDate.mutate({
      scheduleId: initialSchedule.id,
      date,
    });
    setDateOverrides((prev) =>
      [...prev, { date, startTime: "00:00", endTime: "00:00", isBlocked: true }].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      )
    );
  };

  const handleRemoveOverride = (date: Date) => {
    removeDateOverride.mutate({
      scheduleId: initialSchedule.id,
      date,
    });
    setDateOverrides((prev) => prev.filter((o) => o.date.getTime() !== date.getTime()));
  };

  const summary = useMemo(() => formatAvailabilitySummary(days), [days]);
  const existingOverrideDates = useMemo(() => dateOverrides.map((o) => o.date), [dateOverrides]);

  const isSaving = setAvailability.isPending || updateSchedule.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 items-start">
          <Link href="/dashboard/availability">
            <Button variant="ghost" size="icon" className="size-9 shrink-0">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="space-y-1 min-w-0">
            {isEditingName ? (
              <Input
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                className="px-2 py-1 -mx-2 h-auto text-xl font-bold"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="flex gap-2 items-center text-xl font-bold transition-colors text-foreground hover:text-muted-foreground"
              >
                <span className="truncate">{scheduleName}</span>
                <Pencil className="size-4 shrink-0" />
              </button>
            )}
            <p className="text-sm text-muted-foreground">{summary}</p>
          </div>
        </div>

        <div className="flex gap-2 items-center shrink-0">
          <div className="flex gap-2 items-center mr-2">
            <span className="text-sm text-muted-foreground">Podrazumevani</span>
            <Switch
              checked={isDefault}
              onCheckedChange={(checked) => {
                if (checked) {
                  setDefaultSchedule.mutate({ scheduleId: initialSchedule.id });
                }
              }}
              activeColor="blue"
              disabled={isDefault}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? "Čuvanje..." : "Sačuvaj"}
          </Button>
        </div>
      </div>

      {/* Main Content - Full width schedule editor */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-0">
            {DAYS_OF_WEEK.map((day) => (
              <DayAvailabilityRow
                key={day.value}
                dayValue={day.value}
                dayLabel={day.label}
                enabled={days[day.value]?.enabled || false}
                timeRanges={days[day.value]?.timeRanges || []}
                onToggle={(enabled) => handleToggleDay(day.value, enabled)}
                onAddTimeRange={() => handleAddTimeRange(day.value)}
                onRemoveTimeRange={(index) => handleRemoveTimeRange(day.value, index)}
                onUpdateTimeRange={(index, field, value) =>
                  handleUpdateTimeRange(day.value, index, field, value)
                }
                onCopyToOtherDays={(targetDays) => handleCopyTimes(day.value, targetDays)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Date Overrides - Refined section */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <Accordion type="single" collapsible defaultValue="overrides" className="w-full">
            <AccordionItem value="overrides" className="border-none">
              <AccordionTrigger className="py-0 hover:no-underline">
                <div className="flex gap-2 items-center">
                  <span className="text-base font-medium">Izuzeci za određene datume</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Dodajte izuzetke za specifične datume kada vaša dostupnost odstupa od
                          redovnog rasporeda.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-0">
                <div className="space-y-3">
                  {dateOverrides.length > 0 ? (
                    <div className="divide-y divide-border">
                      {dateOverrides.map((override) => (
                        <DateOverrideItem
                          key={override.date.toISOString()}
                          date={override.date}
                          startTime={override.startTime}
                          endTime={override.endTime}
                          isBlocked={override.isBlocked}
                          onRemove={() => handleRemoveOverride(override.date)}
                          className="border-none"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      Nema definisanih izuzetaka.
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => setOverrideDialogOpen(true)}
                    className="text-primary hover:text-primary hover:bg-primary/5 px-0"
                  >
                    <Plus className="mr-2 size-4" />
                    Dodaj izuzetak
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => deleteSchedule.mutate({ id: initialSchedule.id })}
        title="Obriši raspored"
        description="Da li ste sigurni da želite da obrišete ovaj raspored? Ova akcija se ne može poništiti."
        confirmText="Obriši"
        isLoading={deleteSchedule.isPending}
        variant="destructive"
      />

      {/* Date Override Dialog */}
      <DateOverrideDialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        onSave={handleAddOverride}
        onBlock={handleBlockDate}
        existingDates={existingOverrideDates}
      />
    </div>
  );
}
