"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@zakazi-termin/ui";
import { Plus, Trash2, Check, Clock } from "lucide-react";

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

export default function AvailabilityPage() {
  const [newScheduleName, setNewScheduleName] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([
    { days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00" },
  ]);

  const utils = trpc.useUtils();

  const { data: schedules, isLoading } = trpc.availability.listSchedules.useQuery();
  const { data: currentUser } = trpc.user.me.useQuery();

  const createSchedule = trpc.availability.createSchedule.useMutation({
    onSuccess: (schedule) => {
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
  const handleSelectSchedule = (scheduleId: number) => {
    setSelectedScheduleId(scheduleId);
    const schedule = schedules?.find((s) => s.id === scheduleId);
    if (schedule?.availability) {
      const workingHours = schedule.availability
        .filter((a) => a.days.length > 0)
        .map((a) => ({
          days: a.days,
          startTime: formatTime(a.startTime),
          endTime: formatTime(a.endTime),
        }));
      setAvailability(workingHours.length > 0 ? workingHours : [{ days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00" }]);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dostupnost</h1>
        <p className="text-gray-600 mt-1">Upravljajte svojim radnim vremenom i rasporedima</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              {schedules?.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedScheduleId === schedule.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleSelectSchedule(schedule.id)}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{schedule.name}</span>
                    {currentUser?.defaultScheduleId === schedule.id && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Podrazumevani
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Da li ste sigurni da želite da obrišete ovaj raspored?")) {
                        deleteSchedule.mutate({ id: schedule.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              ))}

              {schedules?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nemate nijedan raspored. Kreirajte novi raspored iznad.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Availability Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedSchedule ? `Radno vreme - ${selectedSchedule.name}` : "Izaberite raspored"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSchedule ? (
              <div className="space-y-6">
                {/* Availability entries */}
                <div className="space-y-4">
                  {availability.map((entry, entryIndex) => (
                    <div key={entryIndex} className="border rounded-lg p-4 space-y-4">
                      {/* Days selector */}
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(entryIndex, day.value)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              entry.days.includes(day.value)
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {day.short}
                          </button>
                        ))}
                      </div>

                      {/* Time inputs */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-gray-500">Od</Label>
                          <Input
                            type="time"
                            value={entry.startTime}
                            onChange={(e) => updateTime(entryIndex, "startTime", e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-gray-500">Do</Label>
                          <Input
                            type="time"
                            value={entry.endTime}
                            onChange={(e) => updateTime(entryIndex, "endTime", e.target.value)}
                            className="w-32"
                          />
                        </div>
                        {availability.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEntry(entryIndex)}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add entry button */}
                <Button variant="outline" onClick={addEntry} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj vremenski interval
                </Button>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setDefaultSchedule.mutate({ scheduleId: selectedScheduleId! })}
                    disabled={currentUser?.defaultScheduleId === selectedScheduleId || setDefaultSchedule.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Postavi kao podrazumevani
                  </Button>
                  <Button
                    onClick={handleSaveAvailability}
                    disabled={setScheduleAvailability.isPending}
                  >
                    {setScheduleAvailability.isPending ? "Čuvanje..." : "Sačuvaj promene"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Izaberite raspored sa leve strane ili kreirajte novi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
