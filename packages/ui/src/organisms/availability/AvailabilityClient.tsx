"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Input,
  Label,
} from "@salonko/ui";
import { Check, Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Nedelja", short: "Ned" },
  { value: 1, label: "Ponedeljak", short: "Pon" },
  { value: 2, label: "Utorak", short: "Uto" },
  { value: 3, label: "Sreda", short: "Sre" },
  { value: 4, label: "Četvrtak", short: "Čet" },
  { value: 5, label: "Petak", short: "Pet" },
  { value: 6, label: "Subota", short: "Sub" },
];

type AvailabilityEntry = {
  days: number[];
  startTime: string;
  endTime: string;
};

type Schedule = RouterOutputs["availability"]["listSchedules"][number];
type User = RouterOutputs["user"]["me"];

type AvailabilityClientProps = {
  initialSchedules: Schedule[];
  currentUser: User;
};

export function AvailabilityClient({
  initialSchedules,
  currentUser: initialUser,
}: AvailabilityClientProps) {
  const [newScheduleName, setNewScheduleName] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([
    { days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00" },
  ]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: schedules } = trpc.availability.listSchedules.useQuery(undefined, {
    initialData: initialSchedules,
  });

  const { data: currentUser } = trpc.user.me.useQuery(undefined, {
    initialData: initialUser,
  });

  const createSchedule = trpc.availability.createSchedule.useMutation({
    onSuccess: (schedule: { id: string }) => {
      utils.availability.listSchedules.invalidate();
      setSelectedScheduleId(schedule.id);
      setNewScheduleName("");
    },
  });

  const deleteSchedule = trpc.availability.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.availability.listSchedules.invalidate();
      setSelectedScheduleId(null);
    },
  });

  const setScheduleAvailability = trpc.availability.setAvailability.useMutation({
    onSuccess: () => {
      utils.availability.listSchedules.invalidate();
    },
  });

  const setDefaultSchedule = trpc.user.setDefaultSchedule.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
    },
  });

  const selectedSchedule = schedules?.find((s) => s.id === selectedScheduleId);

  // Load availability when schedule is selected
  const handleSelectSchedule = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    const schedule = schedules?.find((s) => s.id === scheduleId);
    if (schedule?.availability) {
      const workingHours = schedule.availability
        .filter((a: { days: number[] }) => a.days.length > 0)
        .map((a: { days: number[]; startTime: Date; endTime: Date }) => ({
          days: a.days,
          startTime: formatTime(a.startTime),
          endTime: formatTime(a.endTime),
        }));
      setAvailability(
        workingHours.length > 0
          ? workingHours
          : [{ days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00" }]
      );
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
  };

  const handleCreateSchedule = () => {
    if (!newScheduleName.trim()) return;
    createSchedule.mutate({ name: newScheduleName });
  };

  const handleSaveAvailability = () => {
    if (!selectedScheduleId) return;
    setScheduleAvailability.mutate({
      scheduleId: selectedScheduleId,
      availability: availability.filter((a) => a.days.length > 0),
    });
  };

  const toggleDay = (entryIndex: number, day: number) => {
    setAvailability((prev) =>
      prev.map((entry, i) => {
        if (i !== entryIndex) return entry;
        const days = entry.days.includes(day)
          ? entry.days.filter((d) => d !== day)
          : [...entry.days, day].sort((a, b) => a - b);
        return { ...entry, days };
      })
    );
  };

  const updateTime = (entryIndex: number, field: "startTime" | "endTime", value: string) => {
    setAvailability((prev) =>
      prev.map((entry, i) => (i === entryIndex ? { ...entry, [field]: value } : entry))
    );
  };

  const addEntry = () => {
    setAvailability((prev) => [...prev, { days: [], startTime: "09:00", endTime: "17:00" }]);
  };

  const removeEntry = (index: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteSchedule = (id: string) => {
    setScheduleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSchedule = () => {
    if (scheduleToDelete) {
      deleteSchedule.mutate({ id: scheduleToDelete });
      setScheduleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dostupnost</h1>
        <p className="mt-1 text-muted-foreground">
          Upravljajte svojim radnim vremenom i rasporedima
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Schedule List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rasporedi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create new schedule */}
            <div className="flex gap-2">
              <Input
                placeholder="Novi raspored..."
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateSchedule()}
              />
              <Button
                size="sm"
                onClick={handleCreateSchedule}
                disabled={!newScheduleName.trim() || createSchedule.isPending}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Schedule list */}
            <div className="space-y-2">
              {schedules?.map((schedule: Schedule) => (
                <div
                  key={schedule.id}
                  className={`w-full flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedScheduleId === schedule.id
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-border hover:border-gray-300 dark:hover:border-muted-foreground/30"
                  }`}
                >
                  <button
                    type="button"
                    className="flex flex-1 gap-2 items-center min-w-0 text-left"
                    onClick={() => handleSelectSchedule(schedule.id)}
                  >
                    <Clock className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium truncate text-foreground">{schedule.name}</span>
                    {currentUser?.defaultScheduleId === schedule.id && (
                      <span className="text-xs shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                        Podrazumevani
                      </span>
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                  >
                    <Trash2
                      className="w-4 h-4 text-muted-foreground hover:text-red-500"
                      aria-hidden="true"
                    />
                  </Button>
                </div>
              ))}

              {schedules?.length === 0 && (
                <p className="py-4 text-sm text-center text-muted-foreground">
                  Nemate nijedan raspored. Kreirajte novi raspored iznad.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Availability Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg truncate">
              {selectedSchedule ? `Radno vreme - ${selectedSchedule.name}` : "Izaberite raspored"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSchedule ? (
              <div className="space-y-6">
                {/* Availability entries */}
                <div className="space-y-4">
                  {availability.map((entry, entryIndex) => (
                    <div
                      key={`${entry.days.join("-")}-${entry.startTime}-${entryIndex}`}
                      className="p-4 space-y-4 rounded-lg border border-gray-200 dark:border-border"
                    >
                      {/* Days selector */}
                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(entryIndex, day.value)}
                            className={`px-1 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors text-center ${
                              entry.days.includes(day.value)
                                ? "bg-primary text-white"
                                : "bg-gray-100 dark:bg-muted text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted/80"
                            }`}
                          >
                            {day.short}
                          </button>
                        ))}
                      </div>

                      {/* Time inputs */}
                      <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex gap-2 items-center">
                          <Label className="text-sm text-muted-foreground shrink-0">Od</Label>
                          <Input
                            type="time"
                            value={entry.startTime}
                            onChange={(e) => updateTime(entryIndex, "startTime", e.target.value)}
                            className="w-[7.5rem]"
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <Label className="text-sm text-muted-foreground shrink-0">Do</Label>
                          <Input
                            type="time"
                            value={entry.endTime}
                            onChange={(e) => updateTime(entryIndex, "endTime", e.target.value)}
                            className="w-[7.5rem]"
                          />
                        </div>
                        {availability.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEntry(entryIndex)}
                            className="ml-auto sm:ml-0"
                          >
                            <Trash2
                              className="w-4 h-4 text-muted-foreground hover:text-red-500"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add entry button */}
                <Button variant="outline" onClick={addEntry} className="w-full">
                  <Plus className="mr-2 w-4 h-4" aria-hidden="true" />
                  Dodaj vremenski interval
                </Button>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 pt-4 border-t border-gray-200 dark:border-border sm:flex-row sm:justify-between sm:items-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setDefaultSchedule.mutate({
                        scheduleId: selectedScheduleId!,
                      })
                    }
                    disabled={
                      currentUser?.defaultScheduleId === selectedScheduleId ||
                      setDefaultSchedule.isPending
                    }
                    className="w-full sm:w-auto"
                  >
                    <Check className="mr-2 w-4 h-4" aria-hidden="true" />
                    Postavi kao podrazumevani
                  </Button>
                  <Button
                    onClick={handleSaveAvailability}
                    disabled={setScheduleAvailability.isPending}
                    className="w-full sm:w-auto"
                  >
                    {setScheduleAvailability.isPending ? "Čuvanje..." : "Sačuvaj promene"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Clock
                  className="mx-auto mb-4 w-12 h-12 text-gray-300 dark:text-muted-foreground/40"
                  aria-hidden="true"
                />
                <p className="lg:hidden">Izaberite raspored odozgo ili kreirajte novi</p>
                <p className="hidden lg:block">
                  Izaberite raspored sa leve strane ili kreirajte novi
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteSchedule}
        title="Obriši raspored"
        description="Da li ste sigurni da želite da obrišete ovaj raspored?"
        confirmText="Obriši"
        isLoading={deleteSchedule.isPending}
      />
    </div>
  );
}
