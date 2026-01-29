"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@salonko/ui";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScheduleListItem } from "../../molecules/availability/ScheduleListItem";

type Schedule = RouterOutputs["availability"]["listSchedules"][number];
type User = RouterOutputs["user"]["me"];

export interface AvailabilityListClientProps {
  initialSchedules: Schedule[];
  currentUser: User;
}

export function AvailabilityListClient({
  initialSchedules,
  currentUser: initialUser,
}: AvailabilityListClientProps) {
  const router = useRouter();
  const [newScheduleDialogOpen, setNewScheduleDialogOpen] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState("");
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
    onSuccess: (schedule) => {
      utils.availability.listSchedules.invalidate();
      setNewScheduleDialogOpen(false);
      setNewScheduleName("");
      router.push(`/dashboard/availability/${schedule.id}`);
    },
  });

  const deleteSchedule = trpc.availability.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.availability.listSchedules.invalidate();
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    },
  });

  const duplicateSchedule = trpc.availability.duplicateSchedule.useMutation({
    onSuccess: (schedule) => {
      utils.availability.listSchedules.invalidate();
      router.push(`/dashboard/availability/${schedule.id}`);
    },
  });

  const setDefaultSchedule = trpc.user.setDefaultSchedule.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
    },
  });

  const handleCreateSchedule = () => {
    if (!newScheduleName.trim()) return;
    createSchedule.mutate({
      name: newScheduleName,
      timeZone: currentUser?.timeZone || "Europe/Belgrade",
    });
  };

  const handleDeleteSchedule = (id: string) => {
    setScheduleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSchedule = () => {
    if (scheduleToDelete) {
      deleteSchedule.mutate({ id: scheduleToDelete });
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateSchedule.mutate({ id });
  };

  const handleSetDefault = (id: string) => {
    setDefaultSchedule.mutate({ scheduleId: id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Dostupnost</h1>
          <p className="mt-1 text-muted-foreground">
            Konfigurišite vremena kada ste dostupni za zakazivanje.
          </p>
        </div>
        <Button onClick={() => setNewScheduleDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 size-4" />
          Novi
        </Button>
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {schedules && schedules.length > 0 ? (
          schedules.map((schedule) => (
            <ScheduleListItem
              key={schedule.id}
              id={schedule.id}
              name={schedule.name}
              timeZone={schedule.timeZone}
              availability={schedule.availability}
              isDefault={currentUser?.defaultScheduleId === schedule.id}
              onSetDefault={() => handleSetDefault(schedule.id)}
              onDuplicate={() => handleDuplicate(schedule.id)}
              onDelete={() => handleDeleteSchedule(schedule.id)}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Nemate nijedan raspored. Kreirajte novi raspored da biste započeli.
            </p>
            <Button className="mt-4" onClick={() => setNewScheduleDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Kreiraj raspored
            </Button>
          </div>
        )}
      </div>

      {/* New Schedule Dialog */}
      <Dialog open={newScheduleDialogOpen} onOpenChange={setNewScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novi raspored</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-name">Naziv rasporeda</Label>
              <Input
                id="schedule-name"
                placeholder="npr. Radno vreme"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (createSchedule.isPending || !newScheduleName.trim()) return;
                  handleCreateSchedule();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewScheduleDialogOpen(false);
                setNewScheduleName("");
              }}
            >
              Otkaži
            </Button>
            <Button
              onClick={handleCreateSchedule}
              disabled={!newScheduleName.trim() || createSchedule.isPending}
            >
              {createSchedule.isPending ? "Kreiranje..." : "Kreiraj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteSchedule}
        title="Obriši raspored"
        description="Da li ste sigurni da želite da obrišete ovaj raspored? Ova akcija se ne može poništiti."
        confirmText="Obriši"
        isLoading={deleteSchedule.isPending}
        variant="destructive"
      />
    </div>
  );
}
