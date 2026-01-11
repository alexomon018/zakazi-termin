"use client";

import { trpc } from "@/lib/trpc/client";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { ConfirmDialog } from "../../molecules/dialogs/ConfirmDialog";
import {
  EventTypeForm,
  type EventTypeFormData,
  type Location,
  type Schedule,
  buildLocationsArray,
  validateEventTypeForm,
} from "./EventTypeForm";

type EventType = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  length: number;
  hidden: boolean;
  requiresConfirmation: boolean;
  minimumBookingNotice: number;
  beforeEventBuffer: number;
  afterEventBuffer: number;
  slotInterval: number | null;
  scheduleId: string | null;
  locations: unknown;
};

type EditEventTypeClientProps = {
  eventType: EventType;
  schedules: Schedule[];
};

export function EditEventTypeClient({ eventType, schedules }: EditEventTypeClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const locations = eventType.locations as Location[] | null;
  const firstLocation = locations?.[0];

  const [formData, setFormData] = useState<EventTypeFormData>({
    title: eventType.title,
    slug: eventType.slug,
    description: eventType.description || "",
    length: eventType.length,
    hidden: eventType.hidden,
    locationType: firstLocation?.type || "inPerson",
    locationAddress: firstLocation?.address || "",
    minimumBookingNotice: eventType.minimumBookingNotice,
    beforeEventBuffer: eventType.beforeEventBuffer,
    afterEventBuffer: eventType.afterEventBuffer,
    slotInterval: eventType.slotInterval,
    requiresConfirmation: eventType.requiresConfirmation,
    scheduleId: eventType.scheduleId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateEventType = trpc.eventType.update.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
      utils.eventType.byId.invalidate({ id: eventType.id });
      router.push("/dashboard/event-types");
    },
    onError: (error: { message: string }) => {
      if (error.message.includes("Unique constraint")) {
        setErrors({ slug: "Ovaj slug već postoji. Izaberite drugi." });
      } else {
        setErrors({ form: error.message });
      }
    },
  });

  const deleteEventType = trpc.eventType.delete.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
      router.push("/dashboard/event-types");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors = validateEventTypeForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newLocations = buildLocationsArray(formData);

    updateEventType.mutate({
      id: eventType.id,
      title: formData.title,
      slug: formData.slug,
      description: formData.description || undefined,
      length: formData.length,
      hidden: formData.hidden,
      locations: newLocations.length > 0 ? newLocations : undefined,
      minimumBookingNotice: formData.minimumBookingNotice,
      beforeEventBuffer: formData.beforeEventBuffer,
      afterEventBuffer: formData.afterEventBuffer,
      slotInterval: formData.slotInterval || undefined,
      requiresConfirmation: formData.requiresConfirmation,
      scheduleId: formData.scheduleId || undefined,
    });
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteEventType.mutate({ id: eventType.id });
  };

  return (
    <div className="mx-auto space-y-6 max-w-3xl">
      <div className="flex gap-2 justify-between items-start">
        <div className="flex gap-3 items-start min-w-0 sm:gap-4">
          <Link href="/dashboard/event-types" className="mt-1 shrink-0">
            <Button variant="ghost" size="icon" className="w-8 h-8 sm:hidden">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Nazad
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
              Izmeni tip termina
            </h1>
            <p className="mt-1 text-sm text-gray-600 truncate sm:text-base dark:text-gray-400">
              Ažurirajte podešavanja za "{eventType.title}"
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDelete}
          className="text-red-600 shrink-0 sm:hidden hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          className="hidden text-red-600 shrink-0 sm:inline-flex hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="mr-2 w-4 h-4" />
          Obriši
        </Button>
      </div>

      <EventTypeForm
        formData={formData}
        errors={errors}
        schedules={schedules}
        isPending={updateEventType.isPending}
        submitLabel="Sačuvaj izmene"
        pendingLabel="Čuvanje..."
        showVisibilityToggle
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Obriši tip termina"
        description="Da li ste sigurni da želite da obrišete ovaj tip termina? Ova akcija je nepovratna."
        confirmText="Obriši"
        isLoading={deleteEventType.isPending}
      />
    </div>
  );
}
